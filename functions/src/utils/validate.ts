/**
 * Input Validation Utilities
 * Email and field validators
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

export function validateRequiredField<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined || value === "") {
    throw new Error(`Required field missing: ${fieldName}`);
  }
  return value;
}

export function validateStringField(
  value: unknown,
  fieldName: string
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid string field: ${fieldName}`);
  }
  return value.trim();
}

export function validateOptionalStringField(
  value: unknown,
  fieldName: string
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Invalid optional string field: ${fieldName}`);
  }
  return value.trim() || undefined;
}




