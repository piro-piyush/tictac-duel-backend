import cors from "cors";
import express, {
  type Response as ExpressResponse,
  type Request,
} from "express";

import {
  HOST,
  NODE_ENV,
  PORT,
} from "./config/env.js";

import Logger from "./core/utils/logger.js";
import Response from "./core/utils/response.js";
import playerRoutes from "./routes/player_routes.js";
import roomRoutes from "./routes/room_routes.js";

const app = express();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// ─────────────────────────────────────────────
// Request Logging
// ─────────────────────────────────────────────

app.use(
  (
    req: Request,
    res: ExpressResponse,
    next,
  ) => {
    const startTime = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - startTime;

      Logger.info(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`,
      );
    });

    next();
  },
);

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

app.get(
  "/",
  (_req: Request, res: ExpressResponse) => {
    return Response.success(res, {
      message: "Tic Tac Duel server is running",
    });
  },
);

app.get(
  "/health",
  (_req: Request, res: ExpressResponse) => {
    return Response.success(res, {
      message: "Server is healthy",
    });
  },
);

app.get(
  "/api",
  (_req: Request, res: ExpressResponse) => {
    return Response.success(res, {
      message: "Tic Tac Duel API",
    });
  },
);

app.use("/api/rooms", roomRoutes);
app.use("/api/players", playerRoutes);

// ─────────────────────────────────────────────
// Available URLs
// ─────────────────────────────────────────────

function logAvailableUrls(): void {
  const baseUrl = `http://localhost:${PORT}`;

  Logger.success("Available URLs:");
  Logger.info(`  Server      : ${baseUrl}`);
  Logger.info(`  Health      : ${baseUrl}/health`);
  Logger.info(`  API         : ${baseUrl}/api`);
  Logger.info(`  Rooms       : ${baseUrl}/api/rooms`);
  Logger.info(`  Environment : ${NODE_ENV}`);
  Logger.info(`  Host        : ${HOST}`);
  Logger.info(`  Port        : ${PORT}`);
}

logAvailableUrls();

export default app;