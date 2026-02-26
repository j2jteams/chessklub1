/**
 * Core Email Service
 * Centralized email sending with idempotency and audit logging
 */

// Default import: @sendgrid/mail uses module.exports = mailer (no .default in CJS)
import sgMail from "@sendgrid/mail";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import {
  EmailType,
  EmailStatus,
  EmailSendResult,
  EmailDynamicData,
  EmailLogDocument,
  EmailConfig,
} from "./emailTypes";
import { EmailError, normalizeError } from "./errors";
import { EmailErrorCode } from "./emailTypes";
import { isValidEmail } from "../utils/validate";
import { logger } from "../utils/logger";

const EMAIL_LOGS_COLLECTION = "email_logs";

/**
 * Initialize SendGrid client
 */
function initializeSendGrid(apiKey: string): void {
  if (!apiKey || apiKey.trim() === "") {
    throw new EmailError(
      EmailErrorCode.SECRET_MISSING,
      "SendGrid API key is missing"
    );
  }
  sgMail.setApiKey(apiKey);
}

/**
 * Create idempotency key for email log document
 */
function createIdempotencyKey(
  emailType: EmailType,
  ...parts: (string | number)[]
): string {
  return `${emailType}:${parts.join(":")}`;
}

/**
 * Create or get email log document with transaction
 * Returns the log document if it already exists (idempotency check)
 */
async function getOrCreateEmailLog(
  db: Firestore,
  idempotencyKey: string,
  emailType: EmailType,
  to: string,
  templateId: string,
  context?: Record<string, unknown>
): Promise<EmailLogDocument | null> {
  const logRef = db.collection(EMAIL_LOGS_COLLECTION).doc(idempotencyKey);

  return db.runTransaction(async (transaction) => {
    const logDoc = await transaction.get(logRef);

    if (logDoc.exists) {
      // Already sent - return existing log
      const data = logDoc.data() as EmailLogDocument;
      logger.info("Email already sent (idempotency)", {
        idempotencyKey,
        status: data.status,
      });
      return data;
    }

    // Create new log with queued status
    const newLog: EmailLogDocument = {
      emailType,
      to,
      templateId,
      status: EmailStatus.QUEUED,
      idempotencyKey,
      createdAt: Timestamp.now(),
      context: context || {},
    };

    transaction.create(logRef, newLog);
    return newLog;
  });
}

/**
 * Update email log after send attempt
 */
async function updateEmailLog(
  db: Firestore,
  idempotencyKey: string,
  status: EmailStatus,
  providerMessageId?: string,
  error?: unknown
): Promise<void> {
  const logRef = db.collection(EMAIL_LOGS_COLLECTION).doc(idempotencyKey);
  const updateData: Partial<EmailLogDocument> = {
    status,
  };

  if (status === EmailStatus.SENT) {
    updateData.sentAt = Timestamp.now();
    if (providerMessageId) {
      updateData.providerMessageId = providerMessageId;
    }
  } else if (status === EmailStatus.FAILED) {
    updateData.failedAt = Timestamp.now();
    if (error) {
      const normalized = normalizeError(error);
      updateData.error = {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details !== undefined && { details: normalized.details }),
        ...(normalized.httpStatus !== undefined && { httpStatus: normalized.httpStatus }),
        retryable: normalized.retryable,
      };
    }
  }

  try {
    await logRef.set(updateData, { merge: true });
  } catch (err) {
    logger.error("Failed to update email log", err, { idempotencyKey });
    throw new EmailError(
      EmailErrorCode.FIRESTORE_WRITE_FAILED,
      "Failed to update email log",
      undefined,
      undefined,
      false
    );
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  to: string,
  templateId: string,
  dynamicData: EmailDynamicData,
  emailType: EmailType,
  config: EmailConfig
): Promise<string | undefined> {
  const msg = {
    to,
    from: {
      email: config.fromEmail,
      name: config.fromName,
    },
    replyTo: config.replyTo,
    templateId,
    dynamicTemplateData: dynamicData,
    categories: [emailType],
    customArgs: {
      emailType,
      idempotencyKey: `${emailType}:${Date.now()}`,
    },
  };

  try {
    const [response] = await sgMail.send(msg);
    return response.headers["x-message-id"] as string | undefined;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const sgError = error as { response: { statusCode: number; body: unknown } };
      throw new EmailError(
        EmailErrorCode.UNKNOWN_ERROR,
        "SendGrid send failed",
        JSON.stringify(sgError.response.body),
        sgError.response.statusCode,
        sgError.response.statusCode >= 500
      );
    }
    throw error;
  }
}

/**
 * Main email send function with idempotency
 */
export async function sendEmail(
  db: Firestore,
  sendGridApiKey: string,
  config: EmailConfig,
  emailType: EmailType,
  to: string,
  dynamicData: EmailDynamicData,
  idempotencyKey: string,
  context?: Record<string, unknown>
): Promise<EmailSendResult> {
  // Validate inputs
  if (!isValidEmail(to)) {
    return {
      ok: false,
      status: EmailStatus.FAILED,
      error: {
        code: EmailErrorCode.INVALID_INPUT,
        message: "Invalid email address",
        details: `Invalid to address: ${to}`,
        retryable: false,
      },
    };
  }

  const templateId = config.templateIds[emailType];
  if (!templateId) {
    return {
      ok: false,
      status: EmailStatus.FAILED,
      error: {
        code: EmailErrorCode.TEMPLATE_NOT_CONFIGURED,
        message: `Template ID not configured for ${emailType}`,
        retryable: false,
      },
    };
  }

  try {
    // Initialize SendGrid if not already done
    initializeSendGrid(sendGridApiKey);

    // Check idempotency and create log
    const existingLog = await getOrCreateEmailLog(
      db,
      idempotencyKey,
      emailType,
      to,
      templateId,
      context
    );

    if (existingLog && existingLog.status === EmailStatus.SENT) {
      // Already sent - skip
      return {
        ok: true,
        status: EmailStatus.SKIPPED,
        providerMessageId: existingLog.providerMessageId,
      };
    }

    // Send email
    const providerMessageId = await sendViaSendGrid(
      to,
      templateId,
      dynamicData,
      emailType,
      config
    );

    // Update log to sent
    await updateEmailLog(
      db,
      idempotencyKey,
      EmailStatus.SENT,
      providerMessageId
    );

    logger.info("Email sent successfully", {
      emailType,
      to,
      idempotencyKey,
      providerMessageId,
    });

    return {
      ok: true,
      status: EmailStatus.SENT,
      providerMessageId,
    };
  } catch (error) {
    const normalizedError = normalizeError(error);

    // Update log to failed
    try {
      await updateEmailLog(
        db,
        idempotencyKey,
        EmailStatus.FAILED,
        undefined,
        error
      );
    } catch (logError) {
      logger.error("Failed to log email failure", logError, {
        idempotencyKey,
      });
    }

    logger.error("Email send failed", error, {
      emailType,
      to,
      idempotencyKey,
    });

    return {
      ok: false,
      status: EmailStatus.FAILED,
      error: normalizedError,
    };
  }
}

/**
 * Helper to create idempotency key
 */
export function createEmailIdempotencyKey(
  emailType: EmailType,
  ...parts: (string | number)[]
): string {
  return createIdempotencyKey(emailType, ...parts);
}

