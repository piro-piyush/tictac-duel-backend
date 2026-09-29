import { NODE_ENV } from '../../config/env.js';

type LogLevel =
  | 'INFO'
  | 'SUCCESS'
  | 'WARN'
  | 'ERROR'
  | 'DEBUG';

class Logger {
  static info(
    message: string,
    data?: unknown,
  ): void {
    this._log('INFO', message, data);
  }

  static success(
    message: string,
    data?: unknown,
  ): void {
    this._log('SUCCESS', message, data);
  }

  static warn(
    message: string,
    data?: unknown,
  ): void {
    this._log('WARN', message, data);
  }

  static error(
    message: string,
    error?: unknown,
  ): void {
    this._log('ERROR', message, error);
  }

  static debug(
    message: string,
    data?: unknown,
  ): void {
    if (NODE_ENV === 'development') {
      this._log('DEBUG', message, data);
    }
  }

  private static _log(
    level: LogLevel,
    message: string,
    data?: unknown,
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
      return;
    }

    console.log(`${prefix} ${message}`);
  }
}

export default Logger;