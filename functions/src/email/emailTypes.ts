/**
 * Email Types and Status Enums
 * Centralized type definitions for email system
 */

export enum EmailType {
  WELCOME_EMAIL = "WELCOME_EMAIL",
  CREATOR_SUBMISSION_RECEIPT = "CREATOR_SUBMISSION_RECEIPT",
  CREATOR_APPROVAL_EMAIL = "CREATOR_APPROVAL_EMAIL",
  TOURNAMENT_REGISTRATION_CONFIRMATION = "TOURNAMENT_REGISTRATION_CONFIRMATION",
  REMINDER_24H = "REMINDER_24H",
  REMINDER_2H = "REMINDER_2H",
  TOURNAMENT_UPDATED_NOTIFICATION = "TOURNAMENT_UPDATED_NOTIFICATION",
  PAYMENT_RECEIPT = "PAYMENT_RECEIPT",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  ADMIN_REQUEST_APPROVED = "ADMIN_REQUEST_APPROVED",
  ADMIN_REQUEST_REJECTED = "ADMIN_REQUEST_REJECTED",
  ADMIN_REQUEST_SUBMITTED = "ADMIN_REQUEST_SUBMITTED", // Notify Super Admin that someone requested admin
  PASSWORD_RESET = "PASSWORD_RESET",
}

export enum EmailStatus {
  QUEUED = "queued",
  SENT = "sent",
  FAILED = "failed",
  SKIPPED = "skipped",
}

export enum EmailErrorCode {
  CONFIG_MISSING = "CONFIG_MISSING",
  SECRET_MISSING = "SECRET_MISSING",
  INVALID_INPUT = "INVALID_INPUT",
  USER_NO_EMAIL = "USER_NO_EMAIL",
  TEMPLATE_NOT_CONFIGURED = "TEMPLATE_NOT_CONFIGURED",
  SENDGRID_AUTH = "SENDGRID_AUTH",
  SENDGRID_RATE_LIMIT = "SENDGRID_RATE_LIMIT",
  SENDGRID_BAD_REQUEST = "SENDGRID_BAD_REQUEST",
  SENDGRID_SERVER_ERROR = "SENDGRID_SERVER_ERROR",
  FIRESTORE_READ_FAILED = "FIRESTORE_READ_FAILED",
  FIRESTORE_WRITE_FAILED = "FIRESTORE_WRITE_FAILED",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface EmailDynamicData {
  [key: string]: string | number | boolean | undefined;
}

export interface EmailSendResult {
  ok: boolean;
  status: EmailStatus;
  error?: NormalizedEmailError;
  providerMessageId?: string;
}

export interface NormalizedEmailError {
  code: EmailErrorCode;
  message: string;
  details?: string;
  httpStatus?: number;
  retryable: boolean;
}

export interface EmailLogDocument {
  emailType: EmailType;
  to: string;
  templateId: string;
  status: EmailStatus;
  idempotencyKey: string;
  createdAt: FirebaseFirestore.Timestamp;
  sentAt?: FirebaseFirestore.Timestamp;
  failedAt?: FirebaseFirestore.Timestamp;
  providerMessageId?: string;
  error?: NormalizedEmailError;
  context?: Record<string, unknown>;
}

export interface EmailConfig {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  templateIds: Record<EmailType, string>;
}




