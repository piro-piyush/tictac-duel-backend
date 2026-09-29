import type {
  Response as ExpressResponse
} from "express";
interface SuccessOptions<T = null> {
  message?: string;
  data?: T;
  statusCode?: number;
}

interface ErrorOptions<T = null> {
  message?: string;
  statusCode?: number;
  errors?: T;
}

class Response {
  static success<T = null>(
    res: ExpressResponse,
    {
      message = 'Success',
      data = null as T,
      statusCode = 200,
    }: SuccessOptions<T> = {},
  ): ExpressResponse {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static created<T = null>(
    res: ExpressResponse,
    {
      message = 'Created successfully',
      data = null as T,
    }: SuccessOptions<T> = {},
  ): ExpressResponse {
    return this.success(res, {
      message,
      data,
      statusCode: 201,
    });
  }

  static error<T = null>(
    res: ExpressResponse,
    {
      message = 'Something went wrong',
      statusCode = 500,
      errors = null as T,
    }: ErrorOptions<T> = {},
  ): ExpressResponse {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static badRequest<T = null>(
    res: ExpressResponse,
    message = 'Bad request',
    errors: T | null = null,
  ): ExpressResponse {
    return this.error(res, {
      statusCode: 400,
      message,
      errors,
    });
  }

  static unauthorized(
    res: ExpressResponse,
    message = 'Unauthorized',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: 401,
      message,
    });
  }

  static forbidden(
    res: ExpressResponse,
    message = 'Forbidden',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: 403,
      message,
    });
  }

  static notFound(
    res: ExpressResponse,
    message = 'Resource not found',
  ): ExpressResponse {
    return this.error(res, {
      statusCode: 404,
      message,
    });
  }
}

export default Response;