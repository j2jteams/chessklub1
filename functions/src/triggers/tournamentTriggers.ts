/**
 * Tournament-related Email Triggers
 * Handles tournament creation, approval, registration, and updates
 */

import * as functions from "firebase-functions/v2";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import { EmailType } from "../email/emailTypes";
// Use the actual return type from defineSecret
import { defineSecret } from "firebase-functions/params";
type Secret = ReturnType<typeof defineSecret>;
import { sendEmail, createEmailIdempotencyKey } from "../email/emailService";
import { loadEmailConfig } from "../email/templateConfig";
import { logger } from "../utils/logger";
import {
  formatTimestampToISO,
  formatDateForDisplay,
  getTimestampMillis,
} from "../utils/time";
import { getAllSubcollectionDocs } from "../utils/firestorePaging";
import { validateOptionalStringField } from "../utils/validate";

const EVENTS_COLLECTION = "events";
const REGISTRATIONS_COLLECTION = "tournamentRegistrations";
const APP_URL = process.env.APP_URL || "https://chesstourneys.com";

interface TournamentDoc {
  title?: string;
  name?: string;
  startTime?: Timestamp | Date | string;
  startDate?: Timestamp | Date | string;
  endTime?: Timestamp | Date | string;
  endDate?: Timestamp | Date | string;
  time?: string;
  timezone?: string;
  location?: string;
  venue?: string;
  status?: string;
  createdByUid?: string;
  createdBy?: string;
  createdByEmail?: string;
  createdByName?: string;
  updatedAt?: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp | Date;
}

interface RegistrationDoc {
  userId: string;
  userEmail: string;
  userName?: string;
  displayName?: string;
  tournamentId: string;
  createdAt?: Timestamp;
}

/**
 * Get tournament title (supports both title and name fields)
 */
function getTournamentTitle(doc: TournamentDoc): string {
  return doc.title || doc.name || "Tournament";
}

/**
 * Get the date part (day) from tournament doc as Date (start of day).
 */
function getTournamentStartDateOnly(doc: TournamentDoc): Date | null {
  if (!doc.startDate) return null;
  if (doc.startDate instanceof Timestamp) return doc.startDate.toDate();
  if (doc.startDate instanceof Date) return doc.startDate;
  if (typeof doc.startDate === "string") {
    const d = new Date(doc.startDate);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Parse time-only string (e.g. "14:00", "10:30") to [hours, minutes]. Returns null if invalid.
 */
function parseTimeString(s: string): [number, number] | null {
  const trimmed = String(s || "").trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return [h, m];
  }
  return null;
}

/**
 * Get tournament start time as Date (combines startDate + startTime when both exist so time-only updates are reflected).
 */
function getTournamentStartTime(doc: TournamentDoc): Date | null {
  const dateOnly = getTournamentStartDateOnly(doc);
  const timeStr = typeof doc.startTime === "string" ? doc.startTime.trim() : "";
  if (dateOnly && timeStr) {
    const parsed = parseTimeString(timeStr);
    if (parsed) {
      const [h, m] = parsed;
      const d = new Date(dateOnly);
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  if (doc.startTime) {
    if (doc.startTime instanceof Timestamp) return doc.startTime.toDate();
    if (doc.startTime instanceof Date) return doc.startTime;
    if (typeof doc.startTime === "string") {
      const date = new Date(doc.startTime);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  if (dateOnly) return dateOnly;
  if (doc.startDate) {
    if (doc.startDate instanceof Timestamp) return doc.startDate.toDate();
    if (doc.startDate instanceof Date) return doc.startDate;
    if (typeof doc.startDate === "string") {
      const date = new Date(doc.startDate);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

/**
 * Get the date part for end (day) from tournament doc as Date (start of day).
 */
function getTournamentEndDateOnly(doc: TournamentDoc): Date | null {
  if (!doc.endDate) return null;
  if (doc.endDate instanceof Timestamp) return doc.endDate.toDate();
  if (doc.endDate instanceof Date) return doc.endDate;
  if (typeof doc.endDate === "string") {
    const d = new Date(doc.endDate);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Get tournament end time as Date (combines endDate + endTime when both exist).
 */
function getTournamentEndTime(doc: TournamentDoc): Date | null {
  const dateOnly = getTournamentEndDateOnly(doc);
  const timeStr = typeof doc.endTime === "string" ? doc.endTime.trim() : "";
  if (dateOnly && timeStr) {
    const parsed = parseTimeString(timeStr);
    if (parsed) {
      const [h, m] = parsed;
      const d = new Date(dateOnly);
      d.setHours(h, m, 0, 0);
      return d;
    }
  }
  if (doc.endTime) {
    if (doc.endTime instanceof Timestamp) return doc.endTime.toDate();
    if (doc.endTime instanceof Date) return doc.endTime;
    if (typeof doc.endTime === "string") {
      const date = new Date(doc.endTime);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  if (dateOnly) return dateOnly;
  if (doc.endDate) {
    if (doc.endDate instanceof Timestamp) return doc.endDate.toDate();
    if (doc.endDate instanceof Date) return doc.endDate;
    if (typeof doc.endDate === "string") {
      const date = new Date(doc.endDate);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

/**
 * Creator Submission Receipt Trigger
 */
export function createSubmissionReceiptTrigger(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.firestore.onDocumentCreated(
    {
      document: `${EVENTS_COLLECTION}/{tournamentId}`,
      secrets: [sendGridApiKey],
    },
    async (event) => {
      const tournamentId = event.params.tournamentId;
      if (!event.data) {
        logger.warn("Tournament creation event missing data", { tournamentId });
        return;
      }
      const data = event.data.data() as TournamentDoc;
      const apiKey = sendGridApiKey.value();

      if (!data.createdByEmail) {
        logger.warn("Tournament created without creator email", {
          tournamentId,
        });
        return;
      }

      try {
        const config = await loadEmailConfig(db);

        const tournamentTitle = getTournamentTitle(data);
        const creatorName = data.createdByName || validateOptionalStringField(data.createdBy, "createdBy");

        const idempotencyKey = createEmailIdempotencyKey(
          EmailType.CREATOR_SUBMISSION_RECEIPT,
          tournamentId
        );

        const result = await sendEmail(
          db,
          apiKey,
          config,
          EmailType.CREATOR_SUBMISSION_RECEIPT,
          data.createdByEmail,
          {
            creatorName,
            tournamentTitle,
            dashboardUrl: `${APP_URL}/dashboard`,
            submissionId: tournamentId,
          },
          idempotencyKey,
          {
            tournamentId,
            createdByUid: data.createdByUid || data.createdBy,
          }
        );

        if (!result.ok) {
          logger.error("Failed to send submission receipt", undefined, {
            tournamentId,
            error: result.error,
          });
        }
      } catch (error) {
        logger.error("Error in submission receipt trigger", error, {
          tournamentId,
        });
      }
    }
  );
}

/**
 * Tournament Registration Confirmation Trigger
 */
export function createRegistrationConfirmationTrigger(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.firestore.onDocumentCreated(
    {
      document: `${REGISTRATIONS_COLLECTION}/{registrationId}`,
      secrets: [sendGridApiKey],
    },
    async (event) => {
      const registrationId = event.params.registrationId;
      if (!event.data) {
        logger.warn("Registration creation event missing data", { registrationId });
        return;
      }
      const registration = event.data.data() as RegistrationDoc;
      const apiKey = sendGridApiKey.value();

      if (!registration.userEmail || !registration.tournamentId) {
        logger.warn("Registration missing required fields", {
          registrationId,
        });
        return;
      }

      try {
        // Fetch tournament document
        const tournamentDoc = await db
          .collection(EVENTS_COLLECTION)
          .doc(registration.tournamentId)
          .get();

        if (!tournamentDoc.exists) {
          logger.warn("Tournament not found for registration", {
            registrationId,
            tournamentId: registration.tournamentId,
          });
          return;
        }

        const tournament = tournamentDoc.data() as TournamentDoc;
        const config = await loadEmailConfig(db);

        const tournamentTitle = getTournamentTitle(tournament);
        const userName = registration.userName || registration.displayName;
        const startTime = getTournamentStartTime(tournament);
        const startTimeISO = startTime ? formatTimestampToISO(startTime) : "";
        const timezone = tournament.timezone || "UTC";
        const location = tournament.location || tournament.venue || "TBD";

        const idempotencyKey = createEmailIdempotencyKey(
          EmailType.TOURNAMENT_REGISTRATION_CONFIRMATION,
          registration.tournamentId,
          registrationId
        );

        const result = await sendEmail(
          db,
          apiKey,
          config,
          EmailType.TOURNAMENT_REGISTRATION_CONFIRMATION,
          registration.userEmail,
          {
            userName,
            tournamentTitle,
            startTimeISO,
            timezone,
            location,
            manageRegistrationUrl: `${APP_URL}/dashboard`,
          },
          idempotencyKey,
          {
            registrationId,
            tournamentId: registration.tournamentId,
            userId: registration.userId,
          }
        );

        if (!result.ok) {
          logger.error("Failed to send registration confirmation", undefined, {
            registrationId,
            error: result.error,
          });
        }
      } catch (error) {
        logger.error("Error in registration confirmation trigger", error, {
          registrationId,
        });
      }
    }
  );
}

/**
 * Tournament Updated Notification Trigger
 */
export function createTournamentUpdatedTrigger(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.firestore.onDocumentUpdated(
    {
      document: `${EVENTS_COLLECTION}/{tournamentId}`,
      secrets: [sendGridApiKey],
    },
    async (event) => {
      const tournamentId = event.params.tournamentId;
      if (!event.data) {
        logger.warn("Tournament update event missing data", { tournamentId });
        return;
      }
      const before = event.data.before.data() as TournamentDoc;
      const after = event.data.after.data() as TournamentDoc;
      const apiKey = sendGridApiKey.value();

      // Only notify if tournament is approved
      if (after.status !== "approved") {
        return;
      }

      // Check if start time or location changed (use raw fields so time-only updates are detected)
      const beforeStartTime = getTournamentStartTime(before);
      const afterStartTime = getTournamentStartTime(after);
      const beforeLocation = before.location || before.venue || "";
      const afterLocation = after.location || after.venue || "";

      const derivedStartChanged =
        beforeStartTime?.getTime() !== afterStartTime?.getTime();
      const rawStartTimeChanged =
        String(before.startTime || "") !== String(after.startTime || "");
      const beforeStartMs =
        before.startDate instanceof Timestamp
          ? before.startDate.toMillis()
          : before.startDate instanceof Date
            ? before.startDate.getTime()
            : typeof before.startDate === "string"
              ? new Date(before.startDate).getTime()
              : NaN;
      const afterStartMs =
        after.startDate instanceof Timestamp
          ? after.startDate.toMillis()
          : after.startDate instanceof Date
            ? after.startDate.getTime()
            : typeof after.startDate === "string"
              ? new Date(after.startDate).getTime()
              : NaN;
      const rawStartDateChanged =
        !Number.isNaN(beforeStartMs) || !Number.isNaN(afterStartMs)
          ? beforeStartMs !== afterStartMs
          : String(before.startDate ?? "") !== String(after.startDate ?? "");
      const rawTimeDisplayChanged =
        String(before.time || "") !== String(after.time || "");

      const startTimeChanged =
        derivedStartChanged ||
        rawStartTimeChanged ||
        rawStartDateChanged ||
        rawTimeDisplayChanged;
      const locationChanged = beforeLocation !== afterLocation;

      // End time/date change
      const beforeEndTime = getTournamentEndTime(before);
      const afterEndTime = getTournamentEndTime(after);
      const derivedEndChanged =
        beforeEndTime?.getTime() !== afterEndTime?.getTime();
      const rawEndTimeChanged =
        String(before.endTime || "") !== String(after.endTime || "");
      const beforeEndMs =
        before.endDate instanceof Timestamp
          ? before.endDate.toMillis()
          : before.endDate instanceof Date
            ? before.endDate.getTime()
            : typeof before.endDate === "string"
              ? new Date(before.endDate).getTime()
              : NaN;
      const afterEndMs =
        after.endDate instanceof Timestamp
          ? after.endDate.toMillis()
          : after.endDate instanceof Date
            ? after.endDate.getTime()
            : typeof after.endDate === "string"
              ? new Date(after.endDate).getTime()
              : NaN;
      const rawEndDateChanged =
        !Number.isNaN(beforeEndMs) || !Number.isNaN(afterEndMs)
          ? beforeEndMs !== afterEndMs
          : String(before.endDate ?? "") !== String(after.endDate ?? "");
      const endTimeChanged =
        derivedEndChanged || rawEndTimeChanged || rawEndDateChanged;

      if (!startTimeChanged && !locationChanged && !endTimeChanged) {
        return;
      }

      try {
        // Fetch all registrations
        const registrations = await getAllSubcollectionDocs<RegistrationDoc>(
          db,
          EVENTS_COLLECTION,
          tournamentId,
          "registrations",
          100
        );

        // If no subcollection, try main registrations collection
        let allRegistrations = registrations;
        if (allRegistrations.length === 0) {
          const registrationsQuery = await db
            .collection(REGISTRATIONS_COLLECTION)
            .where("tournamentId", "==", tournamentId)
            .get();

          allRegistrations = registrationsQuery.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId || "",
              userEmail: data.userEmail || "",
              userName: data.userName || data.displayName,
              displayName: data.displayName,
              tournamentId: data.tournamentId || tournamentId,
              createdAt: data.createdAt,
            } as RegistrationDoc;
          });
        }

        if (allRegistrations.length === 0) {
          logger.debug("No registrations found for tournament update", {
            tournamentId,
          });
          return;
        }

        const config = await loadEmailConfig(db);
        const tournamentTitle = getTournamentTitle(after);
        const updateVersion = getTimestampMillis(after.updatedAt);

        let sentCount = 0;
        let failedCount = 0;

        for (const registration of allRegistrations) {
          if (!registration.userEmail) {
            continue;
          }

          const userName = registration.userName || registration.displayName;
          const oldStartTimeISO = beforeStartTime
            ? formatTimestampToISO(beforeStartTime)
            : undefined;
          const newStartTimeISO = afterStartTime
            ? formatTimestampToISO(afterStartTime)
            : undefined;
          const oldStartTimeDisplay = formatDateForDisplay(beforeStartTime);
          const newStartTimeDisplay = formatDateForDisplay(afterStartTime);
          const oldEndTimeISO = beforeEndTime
            ? formatTimestampToISO(beforeEndTime)
            : undefined;
          const newEndTimeISO = afterEndTime
            ? formatTimestampToISO(afterEndTime)
            : undefined;
          const oldEndTimeDisplay = formatDateForDisplay(beforeEndTime);
          const newEndTimeDisplay = formatDateForDisplay(afterEndTime);
          const oldLocation = beforeLocation || undefined;
          const newLocation = afterLocation || undefined;

          const registrationId = (registration as any).id || registration.userId;
          const idempotencyKey = createEmailIdempotencyKey(
            EmailType.TOURNAMENT_UPDATED_NOTIFICATION,
            tournamentId,
            registrationId,
            updateVersion
          );

          const result = await sendEmail(
            db,
            apiKey,
            config,
            EmailType.TOURNAMENT_UPDATED_NOTIFICATION,
            registration.userEmail,
            {
              userName,
              tournamentTitle,
              oldStartTimeISO,
              newStartTimeISO,
              oldStartTimeDisplay,
              newStartTimeDisplay,
              oldEndTimeISO,
              newEndTimeISO,
              oldEndTimeDisplay,
              newEndTimeDisplay,
              oldLocation,
              newLocation,
              tournamentUrl: `${APP_URL}/events/${tournamentId}`,
            },
            idempotencyKey,
            {
              tournamentId,
              registrationId: (registration as any).id || registration.userId,
              userId: registration.userId,
            }
          );

          if (result.ok) {
            sentCount++;
          } else {
            failedCount++;
          }
        }

        logger.info("Tournament update notifications sent", {
          tournamentId,
          sentCount,
          failedCount,
          total: allRegistrations.length,
        });
      } catch (error) {
        logger.error("Error in tournament updated trigger", error, {
          tournamentId,
        });
      }
    }
  );
}

