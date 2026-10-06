import 'dotenv/config';

import http from 'http';

import app from './app.js';
import { HOST, NODE_ENV, PORT } from './config/env.js';
import Logger from './core/utils/logger.js';
import SocketService from './sockets/socket_service.js';

const server = http.createServer(app);
const socketService = new SocketService(server);

const SHUTDOWN_TIMEOUT = 10_000;

let isShuttingDown = false;

// ============================================================================
// Server
// ============================================================================

function startServer(): void {
    server.on('error', handleServerError);

    server.listen(PORT, HOST, () => {
        const baseUrl = `http://${HOST}:${PORT}`;

        Logger.success('Tic Tac Duel server started');
        Logger.info('Server Information');
        Logger.info(`  Environment : ${NODE_ENV}`);
        Logger.info(`  Host        : ${HOST}`);
        Logger.info(`  Port        : ${PORT}`);

        Logger.info('HTTP');
        Logger.info(`  Server      : ${baseUrl}`);
        Logger.info(`  Health      : ${baseUrl}/health`);
        Logger.info(`  API         : ${baseUrl}/api`);
        Logger.info(`  Rooms       : ${baseUrl}/api/rooms`);

        Logger.info('Socket.IO');
        Logger.info(`  Endpoint    : ${baseUrl}/socket.io/`);
    });
}

// ============================================================================
// Server Error
// ============================================================================

function handleServerError(error: NodeJS.ErrnoException): void {
    if (isShuttingDown) {
        return;
    }

    Logger.error('HTTP server error', error);

    if (error.code === 'EADDRINUSE') {
        Logger.error(`Port ${PORT} is already in use`);
    }

    process.exitCode = 1;
}

// ============================================================================
// Shutdown
// ============================================================================

async function shutdown(signal: NodeJS.Signals): Promise<void> {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    Logger.info(`${signal} received. Shutting down...`);

    const forceShutdownTimer = setTimeout(() => {
        Logger.error('Shutdown timeout exceeded. Forcing process exit.');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    forceShutdownTimer.unref();

    try {
        // Stop accepting new HTTP connections.
        if (server.listening) {
            await closeHttpServer();
        }

        // Close Socket.IO connections.
        await socketService.close();


        clearTimeout(forceShutdownTimer);

        Logger.success('Server shut down successfully');
    } catch (error: unknown) {
        clearTimeout(forceShutdownTimer);

        Logger.error('Error during shutdown', error);

        process.exitCode = 1;
    }
}

// ============================================================================
// HTTP Server Close
// ============================================================================

function closeHttpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (!error) {
                resolve();
                return;
            }

            if (
                (error as NodeJS.ErrnoException).code ===
                'ERR_SERVER_NOT_RUNNING'
            ) {
                resolve();
                return;
            }

            reject(error);
        });
    });
}

// ============================================================================
// Process Signals
// ============================================================================

process.once('SIGINT', () => {
    void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
});

// ============================================================================
// Start
// ============================================================================

startServer();