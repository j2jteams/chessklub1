/**
 * Password Reset Request Handler
 * Generates a Firebase password reset link and sends it via SendGrid.
 */

import * as functions from "firebase-functions/v2";
import { Firestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { EmailType } from "../email/emailTypes";
import { sendEmail, createEmailIdempotencyKey } from "../email/emailService";
import { loadEmailConfig } from "../email/templateConfig";
import { logger } from "../utils/logger";
import { isValidEmail } from "../utils/validate";
import type { defineSecret } from "firebase-functions/params";
type Secret = ReturnType<typeof defineSecret>;

const APP_URL = process.env.APP_URL || "https://chesstourneys.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "hello@chesstourneys.com";

interface PasswordResetRequestBody {
  email?: string;
}

export function createPasswordResetRequestHandler(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.https.onRequest(
    {
      secrets: [sendGridApiKey],
    },
    async (req, res) => {
      // Only allow POST
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      const apiKey = sendGridApiKey.value();

      try {
        const body = (req.body || {}) as PasswordResetRequestBody;
        const email = (body.email || "").trim().toLowerCase();

        if (!email) {
          res.status(400).json({ error: "Email is required" });
          return;
        }

        if (!isValidEmail(email)) {
          // For security, don't reveal too much – treat as success
          logger.warn("Password reset requested with invalid email format", {
            email,
          });
          res.status(200).json({ success: true });
          return;
        }

        // Try to look up the user; do NOT surface existence to caller
        let userRecord: admin.auth.UserRecord | null = null;
        try {
          userRecord = await admin.auth().getUserByEmail(email);
        } catch (err: any) {
          if (err?.code === "auth/user-not-found") {
            logger.info("Password reset requested for non-existent email", {
              email,
            });
            // Respond success without sending email
            res.status(200).json({ success: true });
            return;
          }

          logger.error("Error looking up user for password reset", err, {
            email,
          });
          // Fail closed for unexpected errors
          res.status(500).json({ error: "Unable to process request" });
          return;
        }

        if (!userRecord.email) {
          logger.warn("User record has no email for password reset", {
            uid: userRecord.uid,
          });
          res.status(200).json({ success: true });
          return;
        }

        const resetLink = await admin
          .auth()
          .generatePasswordResetLink(userRecord.email, {
            url: `${APP_URL}/reset-password`,
            handleCodeInApp: true,
          });

        const config = await loadEmailConfig(db);

        const userName =
          userRecord.displayName ||
          userRecord.email.split("@")[0] ||
          "there";

        const idempotencyKey = createEmailIdempotencyKey(
          EmailType.PASSWORD_RESET,
          userRecord.uid
        );

        const result = await sendEmail(
          db,
          apiKey,
          config,
          EmailType.PASSWORD_RESET,
          userRecord.email,
          {
            userName,
            userEmail: userRecord.email,
            resetUrl: resetLink,
            appName: "Chess Tourneys",
            appUrl: APP_URL,
            supportEmail: SUPPORT_EMAIL,
          },
          idempotencyKey,
          { uid: userRecord.uid }
        );

        if (!result.ok) {
          logger.error("Failed to send password reset email", undefined, {
            uid: userRecord.uid,
            email: userRecord.email,
            error: result.error,
          });
        } else {
          logger.info("Password reset email sent", {
            uid: userRecord.uid,
            email: userRecord.email,
            status: result.status,
          });
        }

        // Always respond success to avoid leaking user existence
        res.status(200).json({ success: true });
      } catch (error) {
        logger.error("Error in password reset request handler", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );
}

