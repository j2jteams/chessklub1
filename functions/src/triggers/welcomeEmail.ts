/**
 * Welcome Email Trigger
 * Fires when a user document is created in users/{uid} (2nd gen; avoids Identity Platform requirement).
 */

import * as functions from "firebase-functions/v2";
import { Firestore } from "firebase-admin/firestore";
import { EmailType } from "../email/emailTypes";
import { sendEmail, createEmailIdempotencyKey } from "../email/emailService";
import { loadEmailConfig } from "../email/templateConfig";
import { logger } from "../utils/logger";
import type { defineSecret } from "firebase-functions/params";
type Secret = ReturnType<typeof defineSecret>;

const APP_URL = process.env.APP_URL || "https://chesstourneys.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "hello@chesstourneys.com";

export function createWelcomeEmailTrigger(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.firestore.onDocumentCreated(
    {
      document: "users/{userId}",
      secrets: [sendGridApiKey],
    },
    async (event) => {
      const userId = event.params.userId;
      if (!event.data?.data()) {
        logger.warn("User doc created with no data", { userId });
        return;
      }
      const data = event.data.data() as { email?: string; firstName?: string; displayName?: string };
      const email = data.email;
      if (!email) {
        logger.warn("User doc created without email, skipping welcome email", {
          userId,
        });
        return;
      }

      try {
        const config = await loadEmailConfig(db);
        const apiKey = sendGridApiKey.value();
        const firstName = data.firstName ?? data.displayName?.split(" ")[0];

        const idempotencyKey = createEmailIdempotencyKey(
          EmailType.WELCOME_EMAIL,
          userId
        );

        const result = await sendEmail(
          db,
          apiKey,
          config,
          EmailType.WELCOME_EMAIL,
          email,
          {
            firstName,
            appUrl: APP_URL,
            supportEmail: SUPPORT_EMAIL,
          },
          idempotencyKey,
          { uid: userId }
        );

        if (!result.ok) {
          logger.error("Failed to send welcome email", undefined, {
            uid: userId,
            email,
            error: result.error,
          });
        } else {
          logger.info("Welcome email sent", {
            uid: userId,
            email,
            status: result.status,
          });
        }
      } catch (error) {
        logger.error("Error in welcome email trigger", error, {
          uid: userId,
          email,
        });
      }
    }
  );
}
