import type { Response as ExpressResponse } from 'express';

import { HTTP_STATUS } from '../constants/http_status.js';

interface SuccessOptions<T> {
  readonly message?: string;
  readonly data?: T | null;
  readonly statusCode?: number;
}

interface ErrorOptions<T> {
  readonly message?: string;
  readonly statusCode?: number;
  readonly errors?: T | null;
}

class ApiResponse {
  // ===========================================================================
  // Success Responses
  // ===========================================================================

  static success<T>(
    res: ExpressResponse,
    {
      message = 'Success',
      data = null,
      statusCode = HTTP_STATUS.OK,
    }: SuccessOptions<T> = {},
  ): ExpressResponse {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created<T>(
    res: ExpressResponse,
    {
      message = 'Created successfully',
      data = null,
    }: SuccessOptions<T> = {},
  ): ExpressResponse {
    return this.success(res, {
      message,
      data,
      statusCode: HTTP_STATUS.CREATED,
    });
  }

  static noContent(
    res: ExpressResponse,
  ): ExpressResponse {
    return res
      .status(HTTP_STATUS.NO_CONTENT)
      .send();
  }

  // ===========================================================================
  // Error Responses
  // ===========================================================================

  static error<T>(
    res: ExpressResponse,
    {
      message = 'Something went wrong',
      statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
      errors = null,
    }: ErrorOptions<T> = {},
  ): ExpressResponse {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static badRequest<T>(
    res: ExpressResponse,
    message = 'Bad request',
    errors: T | null = null,
  ): ExpressResponse {
    return this.error(res, {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message,
      errors,
    });
  }

  static unauthorized(
    res: ExpressResponse,
    message = 'Unauthorized',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message,
    });
  }

  static forbidden(
    res: ExpressResponse,
    message = 'Forbidden',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: HTTP_STATUS.FORBIDDEN,
      message,
    });
  }

  static notFound(
    res: ExpressResponse,
    message = 'Resource not found',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: HTTP_STATUS.NOT_FOUND,
      message,
    });
  }

  static conflict(
    res: ExpressResponse,
    message = 'Conflict',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: HTTP_STATUS.CONFLICT,
      message,
    });
  }

  static tooManyRequests(
    res: ExpressResponse,
    message = 'Too many requests',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
      message,
    });
  }
}

export default ApiResponse;