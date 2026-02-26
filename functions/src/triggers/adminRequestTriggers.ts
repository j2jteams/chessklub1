/**
 * Admin Request Email Triggers
 * - When someone submits an admin request → notify Super Admin(s).
 * - When Super Admin approves or rejects → email the applicant.
 */

import * as functions from "firebase-functions/v2";
import { Firestore } from "firebase-admin/firestore";
import { EmailType } from "../email/emailTypes";
import { sendEmail, createEmailIdempotencyKey } from "../email/emailService";
import { loadEmailConfig } from "../email/templateConfig";
import { logger } from "../utils/logger";
import type { defineSecret } from "firebase-functions/params";
type Secret = ReturnType<typeof defineSecret>;

const ADMIN_REQUESTS_COLLECTION = "adminRequests";
const USERS_COLLECTION = "users";
const APP_URL = process.env.APP_URL || "https://chesstourneys.com";

interface AdminRequestDoc {
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  status?: string;
  decidedBy?: string;
  decidedAt?: unknown;
}

/**
 * Sends approval or rejection email when a Super Admin updates an admin request status.
 */
export function createAdminRequestDecidedTrigger(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.firestore.onDocumentUpdated(
    {
      document: `${ADMIN_REQUESTS_COLLECTION}/{requestId}`,
      secrets: [sendGridApiKey],
    },
    async (event) => {
      const requestId = event.params.requestId;
      if (!event.data?.before?.data() || !event.data?.after?.data()) {
        logger.warn("Admin request update missing before/after data", {
          requestId,
        });
        return;
      }

      const before = event.data.before.data() as AdminRequestDoc;
      const after = event.data.after.data() as AdminRequestDoc;

      if (before.status !== "pending") {
        return;
      }
      if (after.status !== "approved" && after.status !== "rejected") {
        return;
      }

      const toEmail = after.email?.trim();
      if (!toEmail) {
        logger.warn("Admin request has no email, skipping notification", {
          requestId,
        });
        return;
      }

      const applicantName =
        after.firstName ||
        after.displayName ||
        toEmail.split("@")[0] ||
        "there";

      try {
        const config = await loadEmailConfig(db);
        const apiKey = sendGridApiKey.value();

        const emailType =
          after.status === "approved"
            ? EmailType.ADMIN_REQUEST_APPROVED
            : EmailType.ADMIN_REQUEST_REJECTED;

        const idempotencyKey = createEmailIdempotencyKey(
          emailType,
          requestId,
          after.status
        );

        const result = await sendEmail(
          db,
          apiKey,
          config,
          emailType,
          toEmail,
          {
            applicantName,
            dashboardUrl: `${APP_URL}/dashboard`,
            loginUrl: `${APP_URL}/login`,
            approved: after.status === "approved",
          },
          idempotencyKey,
          { requestId, userId: after.userId, status: after.status }
        );

        if (result.ok) {
          logger.info("Admin request decision email sent", {
            requestId,
            status: after.status,
            to: toEmail,
          });
        } else {
          logger.error("Failed to send admin request decision email", undefined, {
            requestId,
            status: after.status,
            error: result.error,
          });
        }
      } catch (error) {
        logger.error("Error in admin request decided trigger", error, {
          requestId,
          status: after.status,
        });
      }
    }
  );
}

/**
 * Notifies all Super Admins when a new admin request is submitted (so they can check the UI and approve/reject).
 */
export function createAdminRequestSubmittedTrigger(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.firestore.onDocumentCreated(
    {
      document: `${ADMIN_REQUESTS_COLLECTION}/{requestId}`,
      secrets: [sendGridApiKey],
    },
    async (event) => {
      const requestId = event.params.requestId;
      if (!event.data?.data()) {
        logger.warn("Admin request created with no data", { requestId });
        return;
      }

      const data = event.data.data() as AdminRequestDoc;
      if (data.status !== "pending") {
        return;
      }

      const applicantEmail = data.email?.trim() || "";
      const applicantName =
        data.firstName ||
        data.displayName ||
        (data.email ? data.email.split("@")[0] : "") ||
        "Someone";

      try {
        const superAdminSnap = await db
          .collection(USERS_COLLECTION)
          .where("role", "==", "superAdmin")
          .get();

        const superAdminEmails: string[] = [];
        superAdminSnap.docs.forEach((doc) => {
          const email = doc.data()?.email?.trim();
          if (email) superAdminEmails.push(email);
        });

        if (superAdminEmails.length === 0) {
          logger.warn("No Super Admin emails found for admin request notification", {
            requestId,
          });
          return;
        }

        const config = await loadEmailConfig(db);
        const apiKey = sendGridApiKey.value();
        const reviewUrl = `${APP_URL}/dashboard/super-admin`;

        for (const toEmail of superAdminEmails) {
          const idempotencyKey = createEmailIdempotencyKey(
            EmailType.ADMIN_REQUEST_SUBMITTED,
            requestId,
            toEmail
          );

          const result = await sendEmail(
            db,
            apiKey,
            config,
            EmailType.ADMIN_REQUEST_SUBMITTED,
            toEmail,
            {
              applicantName,
              applicantEmail,
              reviewUrl,
              requestId,
            },
            idempotencyKey,
            { requestId, applicantUserId: data.userId }
          );

          if (result.ok) {
            logger.info("Super Admin notified of new admin request", {
              requestId,
              to: toEmail,
            });
          } else {
            logger.error("Failed to send admin request notification to Super Admin", undefined, {
              requestId,
              to: toEmail,
              error: result.error,
            });
          }
        }
      } catch (error) {
        logger.error("Error in admin request submitted trigger", error, {
          requestId,
        });
      }
    }
  );
}
