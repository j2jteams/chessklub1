/**
 * Time Formatting Utilities
 * ISO string formatting and timezone helpers
 */

import { Timestamp } from "firebase-admin/firestore";

export function formatTimestampToISO(
  timestamp: Timestamp | Date | string | undefined
): string {
  if (!timestamp) {
    return "";
  }

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }

  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }

  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return "";
}

/**
 * Human-readable date/time for emails (e.g. "Feb 20, 2025 at 2:00 PM").
 * Returns emptyPlaceholder when date is null/undefined/invalid.
 */
export function formatDateForDisplay(
  date: Date | null | undefined,
  emptyPlaceholder = "—"
): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return emptyPlaceholder;
  }
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} at ${timeStr}`;
}

export function getTimestampMillis(
  timestamp: Timestamp | Date | string | undefined
): number {
  if (!timestamp) {
    return Date.now();
  }

  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  return Date.now();
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

export function isWithinTimeWindow(
  targetTime: Date,
  windowStartMinutes: number,
  windowEndMinutes: number
): boolean {
  const now = new Date();
  const windowStart = addMinutes(targetTime, -windowStartMinutes);
  const windowEnd = addMinutes(targetTime, -windowEndMinutes);

  return now >= windowStart && now <= windowEnd;
}




