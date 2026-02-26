/**
 * Structured Logger
 * Wrapper for consistent logging format
 */

import * as functions from "firebase-functions";

export interface LogContext {
  [key: string]: unknown;
}

export const logger = {
  info: (message: string, context?: LogContext) => {
    functions.logger.info(message, context || {});
  },

  warn: (message: string, context?: LogContext) => {
    functions.logger.warn(message, context || {});
  },

  error: (message: string, error?: unknown, context?: LogContext) => {
    const errorContext = error instanceof Error
      ? { error: error.message, stack: error.stack, ...context }
      : { error: String(error), ...context };
    functions.logger.error(message, errorContext);
  },

  debug: (message: string, context?: LogContext) => {
    functions.logger.debug(message, context || {});
  },
};




