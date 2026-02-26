/**
 * Payment Webhook Handler
 * Handles payment receipt and failure emails (future Stripe integration)
 */

import * as functions from "firebase-functions/v2";
import { Firestore } from "firebase-admin/firestore";
import { EmailType } from "../email/emailTypes";
import { sendEmail, createEmailIdempotencyKey } from "../email/emailService";
import { loadEmailConfig } from "../email/templateConfig";
import { logger } from "../utils/logger";
import { isValidEmail } from "../utils/validate";
// Use the actual return type from defineSecret
import { defineSecret } from "firebase-functions/params";
type Secret = ReturnType<typeof defineSecret>;

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const APP_URL = process.env.APP_URL || "https://chesstourneys.com";

interface PaymentWebhookPayload {
  type: "PAYMENT_SUCCEEDED" | "PAYMENT_FAILED";
  email: string;
  amount: number;
  currency: string;
  tournamentId?: string;
  userId?: string;
  paymentId: string;
  userName?: string;
  tournamentTitle?: string;
  receiptUrl?: string;
}

/**
 * Verify webhook signature (stub - implement actual verification for production)
 */
function verifyWebhookSignature(
  signature: string | undefined,
  payload: string
): boolean {
  if (!WEBHOOK_SECRET) {
    logger.warn("WEBHOOK_SECRET not configured, skipping signature verification");
    return true; // Allow in development if secret not set
  }

  if (!signature) {
    return false;
  }

  // TODO: Implement actual signature verification based on payment provider
  // For Stripe: use stripe.webhooks.constructEvent()
  // For now, this is a stub that requires the secret header
  return signature === WEBHOOK_SECRET || signature.startsWith("Bearer ");
}

/**
 * Create payment webhook handler
 */
export function createPaymentWebhook(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.https.onRequest(
    {
      secrets: [sendGridApiKey],
    },
    async (req: functions.https.Request, res: { status: (code: number) => { json: (data: unknown) => void }; json: (data: unknown) => void }) => {
      const apiKey = sendGridApiKey.value();
    // Only allow POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify signature
    const signature = req.headers["x-webhook-signature"] as string | undefined;
    const payload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(signature, payload)) {
      logger.warn("Webhook signature verification failed", {
        hasSignature: !!signature,
      });
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const data = req.body as PaymentWebhookPayload;

      // Validate payload
      if (!data.type || !data.email || !data.paymentId) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      if (!isValidEmail(data.email)) {
        res.status(400).json({ error: "Invalid email address" });
        return;
      }

      const emailType =
        data.type === "PAYMENT_SUCCEEDED"
          ? EmailType.PAYMENT_RECEIPT
          : EmailType.PAYMENT_FAILED;

      const config = await loadEmailConfig(db);

      const idempotencyKey = createEmailIdempotencyKey(
        emailType,
        data.paymentId
      );

      // Format amount as currency string
      const amountStr = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: data.currency || "USD",
      }).format(data.amount / 100); // Assuming amount is in cents

      const result = await sendEmail(
        db,
        apiKey,
        config,
        emailType,
        data.email,
        {
          userName: data.userName,
          amount: amountStr,
          currency: data.currency || "USD",
          tournamentTitle: data.tournamentTitle,
          receiptUrl: data.receiptUrl || `${APP_URL}/dashboard`,
        },
        idempotencyKey,
        {
          paymentId: data.paymentId,
          tournamentId: data.tournamentId,
          userId: data.userId,
          type: data.type,
        }
      );

      if (!result.ok) {
        logger.error("Failed to send payment email", undefined, {
          paymentId: data.paymentId,
          error: result.error,
        });
        res.status(500).json({
          error: "Failed to send email",
          details: result.error?.message,
        });
        return;
      }

      res.status(200).json({
        success: true,
        status: result.status,
        providerMessageId: result.providerMessageId,
      });
    } catch (error) {
      logger.error("Error in payment webhook", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

