/**
 * Centralized Logger
 * Production-ready logging with structured output
 */

import { envConfig } from '../config/environment';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      service: 'nftsol',
      environment: envConfig.nodeEnv,
      ...context,
    };

    if (envConfig.isProduction) {
      // Structured JSON logging for production
      console.log(JSON.stringify(logEntry));
    } else {
      // Human-readable logging for development
      const emoji = {
        [LogLevel.DEBUG]: '🔍',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌',
      }[level];

      console.log(
        `${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`,
        context ? JSON.stringify(context, null, 2) : ''
      );
    }
  }

  debug(message: string, context?: LogContext) {
    if (!envConfig.isProduction) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext: LogContext = {
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: envConfig.isDevelopment ? error.stack : undefined,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.log(LogLevel.ERROR, message, errorContext);
  }
}

export const logger = new Logger();

// Request logging middleware helper
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context?: LogContext
) {
  logger.info('Request', {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    ...context,
  });
}

// Error logging helper
export function logError(error: Error | unknown, context?: LogContext) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error(message, error, context);
}

