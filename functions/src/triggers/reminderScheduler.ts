/**
 * Event Reminder Scheduler
 * Sends 24h and 2h reminders before tournament start
 */

import * as functions from "firebase-functions/v2";
import { Firestore, Timestamp } from "firebase-admin/firestore";
import { EmailType } from "../email/emailTypes";
import { sendEmail, createEmailIdempotencyKey } from "../email/emailService";
import { loadEmailConfig } from "../email/templateConfig";
import { logger } from "../utils/logger";
import { formatTimestampToISO, addHours, addMinutes } from "../utils/time";
import { getAllSubcollectionDocs } from "../utils/firestorePaging";
// Use the actual return type from defineSecret
import { defineSecret } from "firebase-functions/params";
type Secret = ReturnType<typeof defineSecret>;

const EVENTS_COLLECTION = "events";
const REGISTRATIONS_COLLECTION = "tournamentRegistrations";
const APP_URL = process.env.APP_URL || "https://chesstourneys.com";

// Configuration limits to prevent runaway costs
const MAX_TOURNAMENTS_PER_RUN = parseInt(
  process.env.MAX_TOURNAMENTS_PER_RUN || "50",
  10
);
const MAX_REGISTRATIONS_PER_TOURNAMENT = parseInt(
  process.env.MAX_REGISTRATIONS_PER_TOURNAMENT || "500",
  10
);

interface TournamentDoc {
  id: string;
  title?: string;
  name?: string;
  startTime?: Timestamp | Date | string;
  startDate?: Timestamp | Date | string;
  timezone?: string;
  location?: string;
  venue?: string;
  status?: string;
}

interface RegistrationDoc {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  displayName?: string;
  tournamentId: string;
}

/**
 * Get tournament start time as Date
 */
function getTournamentStartTime(doc: TournamentDoc): Date | null {
  if (doc.startTime) {
    if (doc.startTime instanceof Timestamp) {
      return doc.startTime.toDate();
    }
    if (doc.startTime instanceof Date) {
      return doc.startTime;
    }
    if (typeof doc.startTime === "string") {
      const date = new Date(doc.startTime);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  if (doc.startDate) {
    if (doc.startDate instanceof Timestamp) {
      return doc.startDate.toDate();
    }
    if (doc.startDate instanceof Date) {
      return doc.startDate;
    }
    if (typeof doc.startDate === "string") {
      const date = new Date(doc.startDate);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

/**
 * Check if tournament is in reminder window
 */
function isInReminderWindow(
  startTime: Date,
  reminderHours: number,
  windowMinutes: number = 30
): boolean {
  const now = new Date();
  const reminderTime = addHours(startTime, -reminderHours);
  const windowStart = addMinutes(reminderTime, -windowMinutes);
  const windowEnd = addMinutes(reminderTime, windowMinutes);

  return now >= windowStart && now <= windowEnd;
}

/**
 * Send reminders for a tournament
 */
async function sendRemindersForTournament(
  db: Firestore,
  sendGridApiKey: string,
  config: any,
  tournament: TournamentDoc,
  reminderType: EmailType,
  reminderHours: number
): Promise<{ sent: number; failed: number; skipped: number }> {
  const startTime = getTournamentStartTime(tournament);
  if (!startTime) {
    logger.warn("Tournament missing start time", {
      tournamentId: tournament.id,
    });
    return { sent: 0, failed: 0, skipped: 1 };
  }

  if (!isInReminderWindow(startTime, reminderHours)) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // Fetch registrations
  let registrations: RegistrationDoc[] = [];

  // Try subcollection first
  try {
    registrations = await getAllSubcollectionDocs<RegistrationDoc>(
      db,
      EVENTS_COLLECTION,
      tournament.id,
      "registrations",
      MAX_REGISTRATIONS_PER_TOURNAMENT
    );
  } catch (error) {
    logger.debug("No registrations subcollection, trying main collection", {
      tournamentId: tournament.id,
    });
  }

  // Fallback to main registrations collection
  if (registrations.length === 0) {
    const registrationsQuery = await db
      .collection(REGISTRATIONS_COLLECTION)
      .where("tournamentId", "==", tournament.id)
      .limit(MAX_REGISTRATIONS_PER_TOURNAMENT)
      .get();

    registrations = registrationsQuery.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistrationDoc[];
  }

  if (registrations.length === 0) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const tournamentTitle = tournament.title || tournament.name || "Tournament";
  const timezone = tournament.timezone || "UTC";
  const location = tournament.location || tournament.venue || "TBD";
  const startTimeISO = formatTimestampToISO(startTime);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const registration of registrations) {
    if (!registration.userEmail) {
      skipped++;
      continue;
    }

    const userName = registration.userName || registration.displayName;
    const idempotencyKey = createEmailIdempotencyKey(
      reminderType,
      tournament.id,
      registration.id || registration.userId
    );

    const result = await sendEmail(
      db,
      sendGridApiKey,
      config,
      reminderType,
      registration.userEmail,
      {
        userName,
        tournamentTitle,
        startTimeISO,
        timezone,
        location,
        checkInUrl: `${APP_URL}/events/${tournament.id}`,
      },
      idempotencyKey,
      {
        tournamentId: tournament.id,
        registrationId: registration.id,
        userId: registration.userId,
        reminderHours,
      }
    );

    if (result.ok && result.status === "sent") {
      sent++;
    } else if (result.ok && result.status === "skipped") {
      skipped++;
    } else {
      failed++;
    }
  }

  return { sent, failed, skipped };
}

/**
 * Create reminder scheduler function
 */
export function createReminderScheduler(
  db: Firestore,
  sendGridApiKey: Secret
) {
  return functions.scheduler.onSchedule(
    {
      schedule: "0,15,30,45 * * * *", // Every 15 minutes
      secrets: [sendGridApiKey],
      timeZone: "UTC",
    },
    async () => {
      try {
        const config = await loadEmailConfig(db);

        // Query tournaments with startTime or startDate in windows
        // Note: Firestore queries require indexes for compound queries
        // We'll query by status first, then filter in memory for time windows
        const allApprovedTournaments = await db
          .collection(EVENTS_COLLECTION)
          .where("status", "==", "approved")
          .limit(MAX_TOURNAMENTS_PER_RUN * 2) // Get more to filter
          .get();

        // Filter tournaments in memory for time windows
        const tournaments24h: TournamentDoc[] = [];
        const tournaments2h: TournamentDoc[] = [];

        allApprovedTournaments.docs.forEach((doc) => {
          const tournament = { id: doc.id, ...doc.data() } as TournamentDoc;
          const startTime = getTournamentStartTime(tournament);

          if (!startTime) {
            return;
          }

          // Check 24h window
          if (isInReminderWindow(startTime, 24, 30)) {
            tournaments24h.push(tournament);
          }

          // Check 2h window
          if (isInReminderWindow(startTime, 2, 30)) {
            tournaments2h.push(tournament);
          }
        });

        // Combine both lists, deduplicate by ID
        const allTournaments = new Map<string, TournamentDoc>();

        tournaments24h.forEach((tournament) => {
          allTournaments.set(tournament.id, tournament);
        });

        tournaments2h.forEach((tournament) => {
          allTournaments.set(tournament.id, tournament);
        });

        let totalSent24h = 0;
        let totalFailed24h = 0;
        let totalSkipped24h = 0;
        let totalSent2h = 0;
        let totalFailed2h = 0;
        let totalSkipped2h = 0;

        for (const tournament of allTournaments.values()) {
          // Send 24h reminders
          const result24h = await sendRemindersForTournament(
            db,
            sendGridApiKey.value(),
            config,
            tournament,
            EmailType.REMINDER_24H,
            24
          );
          totalSent24h += result24h.sent;
          totalFailed24h += result24h.failed;
          totalSkipped24h += result24h.skipped;

          // Send 2h reminders
          const result2h = await sendRemindersForTournament(
            db,
            sendGridApiKey.value(),
            config,
            tournament,
            EmailType.REMINDER_2H,
            2
          );
          totalSent2h += result2h.sent;
          totalFailed2h += result2h.failed;
          totalSkipped2h += result2h.skipped;
        }

        logger.info("Reminder scheduler completed", {
          tournamentsProcessed: allTournaments.size,
          reminders24h: {
            sent: totalSent24h,
            failed: totalFailed24h,
            skipped: totalSkipped24h,
          },
          reminders2h: {
            sent: totalSent2h,
            failed: totalFailed2h,
            skipped: totalSkipped2h,
          },
        });
      } catch (error) {
        logger.error("Error in reminder scheduler", error);
        throw error;
      }
    }
  );
}

