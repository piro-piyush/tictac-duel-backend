
import "dotenv/config";
import http from "http";

import app from "./app.js";
import { APP_NAME } from "./config/app.js";
import { HOST, NODE_ENV, PORT } from "./config/env.js";
import Logger from "./core/utils/logger.js";
import SocketService from "./sockets/socket_service.js";

const server = http.createServer(app);
const socketService = new SocketService(server);

const SHUTDOWN_TIMEOUT = 10_000;
let isShuttingDown = false;

// Server
server.on("error", (error: NodeJS.ErrnoException) => {
    if (isShuttingDown) return;

    if (error.code === "EADDRINUSE") {
        Logger.error(`Port ${PORT} is already in use. Stop the other process or configure a different port.`);
    } else {
        Logger.error("HTTP server error", error);
    }

    process.exitCode = 1;
});

server.listen(PORT, HOST, () => {
    const hostname = process.env.RENDER_EXTERNAL_HOSTNAME;
    const baseUrl = hostname
        ? `https://${hostname}`
        : `http://localhost:${PORT}`;

    Logger.success(`${APP_NAME} server started`);
    Logger.info(`Environment : ${NODE_ENV}`);
    Logger.info(`Server      : ${baseUrl}`);
    Logger.info(`Health      : ${baseUrl}/health`);
    Logger.info(`API         : ${baseUrl}/api`);
    Logger.info(`Rooms       : ${baseUrl}/api/rooms`);
    Logger.info(`Socket.IO   : ${baseUrl}/socket.io/`);
});

// Graceful shutdown
for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        Logger.info(`${signal} received. Shutting down...`);

        const timeout = setTimeout(() => {
            Logger.error("Shutdown timed out. Forcing exit.");
            process.exit(1);
        }, SHUTDOWN_TIMEOUT);

        timeout.unref();

        void (async () => {
            try {
                await socketService.close();

                if (server.listening) {
                    await new Promise<void>((resolve, reject) => {
                        server.close((error) => {
                            if (!error) {
                                resolve();
                            } else if (
                                (error as NodeJS.ErrnoException).code ===
                                "ERR_SERVER_NOT_RUNNING"
                            ) {
                                resolve();
                            } else {
                                reject(error);
                            }
                        });
                    });
                }

                Logger.success("Server shut down successfully");
            } catch (error: unknown) {
                Logger.error("Shutdown failed", error);
                process.exitCode = 1;
            } finally {
                clearTimeout(timeout);
            }
        })();
    });
}
