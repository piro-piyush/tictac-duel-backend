import { NODE_ENV } from '../../config/env.js';

const LOG_LEVEL = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
} as const;

type LogLevel =
  (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

class Logger {
  static info(
    message: string,
    data?: unknown,
  ): void {
    this.log(LOG_LEVEL.INFO, message, data);
  }

  static success(
    message: string,
    data?: unknown,
  ): void {
    this.log(LOG_LEVEL.SUCCESS, message, data);
  }

  static warn(
    message: string,
    data?: unknown,
  ): void {
    this.log(LOG_LEVEL.WARN, message, data);
  }

  static error(
    message: string,
    error?: unknown,
  ): void {
    this.log(LOG_LEVEL.ERROR, message, error);
  }

  static debug(
    message: string,
    data?: unknown,
  ): void {
    if (NODE_ENV !== 'development') {
      return;
    }

    this.log(LOG_LEVEL.DEBUG, message, data);
  }

  private static log(
    level: LogLevel,
    message: string,
    data?: unknown,
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    const formattedMessage = `${prefix} ${message}`;

    this.write(level, formattedMessage, data);
  }

  private static write(
    level: LogLevel,
    message: string,
    data?: unknown,
  ): void {
    if (data === undefined) {
      switch (level) {
        case LOG_LEVEL.ERROR:
          console.error(message);
          break;

        case LOG_LEVEL.WARN:
          console.warn(message);
          break;

        case LOG_LEVEL.DEBUG:
          console.debug(message);
          break;

        default:
          console.log(message);
      }

      return;
    }

    switch (level) {
      case LOG_LEVEL.ERROR:
        console.error(message, data);
        break;

      case LOG_LEVEL.WARN:
        console.warn(message, data);
        break;

      case LOG_LEVEL.DEBUG:
        console.debug(message, data);
        break;

      default:
        console.log(message, data);
    }
  }
}

export default Logger;