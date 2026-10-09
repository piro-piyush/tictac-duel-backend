
import { NODE_ENV } from "../../config/env.js";

const LOG_LEVEL = {
  INFO: "INFO",
  SUCCESS: "SUCCESS",
  WARN: "WARN",
  ERROR: "ERROR",
  DEBUG: "DEBUG",
} as const;

type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

class Logger {
  static info(message: string, data?: unknown): void {
    this.log(LOG_LEVEL.INFO, message, data);
  }

  static success(message: string, data?: unknown): void {
    this.log(LOG_LEVEL.SUCCESS, message, data);
  }

  static warn(message: string, data?: unknown): void {
    this.log(LOG_LEVEL.WARN, message, data);
  }

  static error(message: string, error?: unknown): void {
    this.log(LOG_LEVEL.ERROR, message, error);
  }

  static debug(message: string, data?: unknown): void {
    this.log(LOG_LEVEL.DEBUG, message, data);
  }

  private static log(
    level: LogLevel,
    message: string,
    data?: unknown,
  ): void {
    if (NODE_ENV === "production" && level === LOG_LEVEL.DEBUG) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    const method =
      level === LOG_LEVEL.ERROR
        ? console.error
        : level === LOG_LEVEL.WARN
          ? console.warn
          : level === LOG_LEVEL.DEBUG
            ? console.debug
            : console.log;

    if (data === undefined) {
      method(formattedMessage);
    } else {
      method(formattedMessage, data);
    }
  }
}

export default Logger;
