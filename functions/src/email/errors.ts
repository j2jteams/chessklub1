/**
 * Error Handling and Normalization
 * Maps SendGrid errors to normalized error codes
 */

import { EmailErrorCode, NormalizedEmailError } from "./emailTypes";

// Re-export for convenience
export { EmailErrorCode } from "./emailTypes";

export class EmailError extends Error {
  constructor(
    public code: EmailErrorCode,
    message: string,
    public details?: string,
    public httpStatus?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = "EmailError";
  }

  toNormalizedError(): NormalizedEmailError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      httpStatus: this.httpStatus,
      retryable: this.retryable,
    };
  }
}

/**
 * Maps SendGrid HTTP status codes to normalized error codes
 */
export function mapSendGridError(
  statusCode: number,
  body?: unknown
): NormalizedEmailError {
  const bodyStr = body ? JSON.stringify(body) : undefined;

  switch (statusCode) {
    case 401:
    case 403:
      return {
        code: EmailErrorCode.SENDGRID_AUTH,
        message: "SendGrid authentication failed",
        details: bodyStr,
        httpStatus: statusCode,
        retryable: false,
      };

    case 429:
      return {
        code: EmailErrorCode.SENDGRID_RATE_LIMIT,
        message: "SendGrid rate limit exceeded",
        details: bodyStr,
        httpStatus: statusCode,
        retryable: true,
      };

    case 400:
    case 404:
    case 405:
    case 413:
      return {
        code: EmailErrorCode.SENDGRID_BAD_REQUEST,
        message: "SendGrid bad request",
        details: bodyStr,
        httpStatus: statusCode,
        retryable: false,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        code: EmailErrorCode.SENDGRID_SERVER_ERROR,
        message: "SendGrid server error",
        details: bodyStr,
        httpStatus: statusCode,
        retryable: true,
      };

    default:
      return {
        code: EmailErrorCode.UNKNOWN_ERROR,
        message: `Unexpected SendGrid error: ${statusCode}`,
        details: bodyStr,
        httpStatus: statusCode,
        retryable: statusCode >= 500,
      };
  }
}

/**
 * Creates normalized error from generic Error
 */
export function normalizeError(error: unknown): NormalizedEmailError {
  if (error instanceof EmailError) {
    return error.toNormalizedError();
  }

  if (error instanceof Error) {
    return {
      code: EmailErrorCode.UNKNOWN_ERROR,
      message: error.message,
      details: error.stack,
      retryable: false,
    };
  }

  return {
    code: EmailErrorCode.UNKNOWN_ERROR,
    message: "Unknown error occurred",
    details: String(error),
    retryable: false,
  };
}

