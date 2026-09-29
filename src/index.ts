import "dotenv/config";
import http from "http";

import app from "./app.js";
import { HOST, NODE_ENV, PORT } from "./config/env.js";
import Logger from "./core/utils/logger.js";
import SocketService from "./sockets/socket_service.js";

const server = http.createServer(app);
const socketService = new SocketService(server);

function startServer(): void {
    server.listen(PORT, HOST, () => {
        const baseUrl = `http://localhost:${PORT}`;

        Logger.success("Tic Tac Duel server started");
        Logger.info("Server Information");
        Logger.info(`  Environment : ${NODE_ENV}`);
        Logger.info(`  Host        : ${HOST}`);
        Logger.info(`  Port        : ${PORT}`);

        Logger.info("HTTP");
        Logger.info(`  Server      : ${baseUrl}`);
        Logger.info(`  Health      : ${baseUrl}/health`);
        Logger.info(`  API         : ${baseUrl}/api`);
        Logger.info(`  Rooms       : ${baseUrl}/api/rooms`);

        Logger.info("Socket.IO");
        Logger.info(`  Endpoint    : ${baseUrl}/socket.io/`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
        Logger.error("HTTP server error", error);
        process.exit(1);
    });
}

async function shutdown(signal: string): Promise<void> {
    Logger.info(`${signal} received. Shutting down...`);

    try {
        await socketService.close();

        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });

        Logger.success("Server shut down successfully");
        process.exit(0);
    } catch (error: unknown) {
        Logger.error("Error during shutdown", error);
        process.exit(1);
    }
}

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});

startServer();