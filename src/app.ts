import cors from 'cors';
import express, {
  type Response as ExpressResponse,
  type Request,
} from 'express';
import helmet from 'helmet';


import { APP_NAME, APP_VERSION } from './config/app.js';
import { NODE_ENV } from './config/env.js';
import { HTTP_STATUS } from './core/constants/http_status.js';
import ApiError from './core/errors/api_error.js';
import Logger from './core/utils/logger.js';
import Response from './core/utils/response.js';
import roomRoutes from './routes/room_routes.js';

const app = express();

// ============================================================================
// Middleware
// ============================================================================

app.use(
  cors()
);
app.use(helmet());
app.use(express.json());

// ============================================================================
// Request Logging
// ============================================================================

app.use(
  (
    req: Request,
    res: ExpressResponse,
    next,
  ): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  },
);

// ============================================================================
// Health & Information
// ============================================================================
app.get("/", (_req: Request, res: ExpressResponse) => {
  return Response.success(res, {
    message: `${APP_NAME} is running`,
  });
});

app.get("/health", (_req: Request, res: ExpressResponse) => {
  return Response.success(res, {
    message: `${APP_NAME} is healthy`,
    data: {
      service: APP_NAME,
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    },
  });
});

app.get("/api", (_req: Request, res: ExpressResponse) => {
  return Response.success(res, {
    message: `Welcome to ${APP_NAME}`,
    data: {
      name: APP_NAME,
      version: APP_VERSION,
      description: "Real-time multiplayer Tic-Tac-Toe game API",
      environment: NODE_ENV,
      endpoints: {
        root: "/",
        health: "/health",
        rooms: "/api/rooms",
        socket: "/socket.io/",
      },
    },
  });
});



// ============================================================================
// Routes
// ============================================================================

app.use('/api/rooms', roomRoutes);

// ============================================================================
// 404 Handler
// ============================================================================

app.use(
  (
    _req: Request,
    res: ExpressResponse,
  ) => {
    return Response.notFound(res, 'Route not found');
  },
);

// ============================================================================
// Error Handler
// ============================================================================

app.use(
  (
    error: unknown,
    _req: Request,
    res: ExpressResponse,
    _next: unknown,
  ) => {
    if (error instanceof ApiError) {
      Logger.warn(
        `API error: ${error.message} (${error.statusCode})`,
      );

      return Response.error(res, {
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
      });
    }

    Logger.error(
      'Unhandled server error',
      error,
    );

    return Response.error(res, {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  },
);
export default app;