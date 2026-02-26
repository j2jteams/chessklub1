/**
 * Firebase Cloud Functions Entry Point
 * Exports all email triggers and webhooks
 */

import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { createWelcomeEmailTrigger } from "./triggers/welcomeEmail";
import {
  createSubmissionReceiptTrigger,
  createRegistrationConfirmationTrigger,
  createTournamentUpdatedTrigger,
} from "./triggers/tournamentTriggers";
import { createReminderScheduler } from "./triggers/reminderScheduler";
import { createPaymentWebhook } from "./triggers/paymentWebhook";
import { createPasswordResetRequestHandler } from "./triggers/passwordReset";
import {
  createAdminRequestDecidedTrigger,
  createAdminRequestSubmittedTrigger,
} from "./triggers/adminRequestTriggers";
import { logger } from "./utils/logger";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// Define secrets
const sendGridApiKey = defineSecret("SENDGRID_API_KEY");

// Export all triggers
export const onUserCreated = createWelcomeEmailTrigger(db, sendGridApiKey);

export const onTournamentCreated = createSubmissionReceiptTrigger(
  db,
  sendGridApiKey
);

export const onRegistrationCreated = createRegistrationConfirmationTrigger(
  db,
  sendGridApiKey
);

export const onTournamentUpdated = createTournamentUpdatedTrigger(
  db,
  sendGridApiKey
);

export const sendEventReminders = createReminderScheduler(
  db,
  sendGridApiKey
);

export const paymentWebhook = createPaymentWebhook(db, sendGridApiKey);

export const onAdminRequestDecided = createAdminRequestDecidedTrigger(
  db,
  sendGridApiKey
);

export const onAdminRequestSubmitted = createAdminRequestSubmittedTrigger(
  db,
  sendGridApiKey
);

export const requestPasswordReset = createPasswordResetRequestHandler(
  db,
  sendGridApiKey
);

// Log initialization
logger.info("Firebase Functions initialized", {
  functions: [
    "onUserCreated",
    "onTournamentCreated",
    "onRegistrationCreated",
    "onTournamentUpdated",
    "sendEventReminders",
    "paymentWebhook",
    "onAdminRequestDecided",
    "onAdminRequestSubmitted",
    "requestPasswordReset",
  ],
});

