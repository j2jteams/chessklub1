/**
 * Template Configuration Loader
 * Loads template IDs from Firestore config doc + env fallback
 */

import { Firestore } from "firebase-admin/firestore";
import { EmailType, EmailConfig, EmailErrorCode } from "./emailTypes";
import { logger } from "../utils/logger";
import { EmailError } from "./errors";

const CONFIG_COLLECTION = "config";
const CONFIG_DOC_ID = "emailTemplates";

const DEFAULT_FROM_EMAIL = "hello@chesstourneys.com";
const DEFAULT_FROM_NAME = "Chess Tourneys";
const DEFAULT_REPLY_TO = "hello@chesstourneys.com";

/**
 * Load template IDs from environment variables (fallback)
 */
function loadTemplateIdsFromEnv(): Partial<Record<EmailType, string>> {
  const templates: Partial<Record<EmailType, string>> = {};

  const envMap: Record<EmailType, string> = {
    [EmailType.WELCOME_EMAIL]: "TEMPLATE_ID_WELCOME_EMAIL",
    [EmailType.CREATOR_SUBMISSION_RECEIPT]: "TEMPLATE_ID_CREATOR_SUBMISSION_RECEIPT",
    [EmailType.CREATOR_APPROVAL_EMAIL]: "TEMPLATE_ID_CREATOR_APPROVAL_EMAIL",
    [EmailType.TOURNAMENT_REGISTRATION_CONFIRMATION]: "TEMPLATE_ID_TOURNAMENT_REGISTRATION_CONFIRMATION",
    [EmailType.REMINDER_24H]: "TEMPLATE_ID_REMINDER_24H",
    [EmailType.REMINDER_2H]: "TEMPLATE_ID_REMINDER_2H",
    [EmailType.TOURNAMENT_UPDATED_NOTIFICATION]: "TEMPLATE_ID_TOURNAMENT_UPDATED_NOTIFICATION",
    [EmailType.PAYMENT_RECEIPT]: "TEMPLATE_ID_PAYMENT_RECEIPT",
    [EmailType.PAYMENT_FAILED]: "TEMPLATE_ID_PAYMENT_FAILED",
    [EmailType.ADMIN_REQUEST_APPROVED]: "TEMPLATE_ID_ADMIN_REQUEST_APPROVED",
    [EmailType.ADMIN_REQUEST_REJECTED]: "TEMPLATE_ID_ADMIN_REQUEST_REJECTED",
    [EmailType.ADMIN_REQUEST_SUBMITTED]: "TEMPLATE_ID_ADMIN_REQUEST_SUBMITTED",
    [EmailType.PASSWORD_RESET]: "TEMPLATE_ID_PASSWORD_RESET",
  };

  for (const [emailType, envKey] of Object.entries(envMap)) {
    const value = process.env[envKey];
    if (value && value.trim()) {
      templates[emailType as EmailType] = value.trim();
    }
  }

  return templates;
}

/**
 * Load template IDs from Firestore config doc
 */
async function loadTemplateIdsFromFirestore(
  db: Firestore
): Promise<Partial<Record<EmailType, string>>> {
  try {
    const configDoc = await db
      .collection(CONFIG_COLLECTION)
      .doc(CONFIG_DOC_ID)
      .get();

    if (!configDoc.exists) {
      logger.debug("Email templates config doc not found in Firestore");
      return {};
    }

    const data = configDoc.data();
    if (!data) {
      return {};
    }

    const templates: Partial<Record<EmailType, string>> = {};

    // Map Firestore fields to EmailType enum
    const fieldMap: Record<EmailType, string> = {
      [EmailType.WELCOME_EMAIL]: "WELCOME_EMAIL",
      [EmailType.CREATOR_SUBMISSION_RECEIPT]: "CREATOR_SUBMISSION_RECEIPT",
      [EmailType.CREATOR_APPROVAL_EMAIL]: "CREATOR_APPROVAL_EMAIL",
      [EmailType.TOURNAMENT_REGISTRATION_CONFIRMATION]: "TOURNAMENT_REGISTRATION_CONFIRMATION",
      [EmailType.REMINDER_24H]: "REMINDER_24H",
      [EmailType.REMINDER_2H]: "REMINDER_2H",
      [EmailType.TOURNAMENT_UPDATED_NOTIFICATION]: "TOURNAMENT_UPDATED_NOTIFICATION",
      [EmailType.PAYMENT_RECEIPT]: "PAYMENT_RECEIPT",
      [EmailType.PAYMENT_FAILED]: "PAYMENT_FAILED",
      [EmailType.ADMIN_REQUEST_APPROVED]: "ADMIN_REQUEST_APPROVED",
      [EmailType.ADMIN_REQUEST_REJECTED]: "ADMIN_REQUEST_REJECTED",
      [EmailType.ADMIN_REQUEST_SUBMITTED]: "ADMIN_REQUEST_SUBMITTED",
      [EmailType.PASSWORD_RESET]: "PASSWORD_RESET",
    };

    for (const [emailType, fieldName] of Object.entries(fieldMap)) {
      const value = data[fieldName];
      if (value && typeof value === "string" && value.trim()) {
        templates[emailType as EmailType] = value.trim();
      }
    }

    return templates;
  } catch (error) {
    logger.warn("Failed to load template IDs from Firestore", { error });
    return {};
  }
}

/**
 * Load complete email configuration
 * Merges Firestore config (preferred) + env fallback
 */
export async function loadEmailConfig(db: Firestore): Promise<EmailConfig> {
  const firestoreTemplates = await loadTemplateIdsFromFirestore(db);
  const envTemplates = loadTemplateIdsFromEnv();

  // Merge: Firestore takes precedence, env is fallback
  const templateIds: Record<EmailType, string> = {} as Record<EmailType, string>;

  for (const emailType of Object.values(EmailType)) {
    const templateId = firestoreTemplates[emailType] || envTemplates[emailType];
    if (!templateId) {
      throw new EmailError(
        EmailErrorCode.TEMPLATE_NOT_CONFIGURED,
        `Template ID not configured for ${emailType}`,
        `Missing template ID for ${emailType}. Set in Firestore config/emailTemplates or env ${emailType}`
      );
    }
    templateIds[emailType] = templateId;
  }

  const fromEmail = process.env.FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const fromName = process.env.FROM_NAME || DEFAULT_FROM_NAME;
  const replyTo = process.env.REPLY_TO || DEFAULT_REPLY_TO;

  return {
    fromEmail,
    fromName,
    replyTo,
    templateIds,
  };
}

