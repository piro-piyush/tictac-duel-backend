import type { Server as HttpServer } from 'http';
import {
  Server,
  type Socket,
} from 'socket.io';
import { SOCKET_EVENTS } from '../core/constants/socket_events.js';
import Logger from '../core/utils/logger.js';
import registerRoomSocket from './room_socket.js';

class SocketService {
  private readonly io: Server;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: true,
        methods: ['GET', 'POST'],
      },
    });

    this._registerConnection();
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  private _registerConnection(): void {
    this.io.on(
      SOCKET_EVENTS.CONNECT,
      (socket: Socket) => {
        Logger.info(
          `Player connected: ${socket.id}`,
        );

        this._registerSocketError(socket);

        registerRoomSocket(
          this.io,
          socket,
        );
      },
    );
  }

  // ===========================================================================
  // Socket Error
  // ===========================================================================

  private _registerSocketError(
    socket: Socket,
  ): void {
    socket.on(
      SOCKET_EVENTS.ERROR,
      (error: Error) => {
        Logger.error(
          `Socket error: ${socket.id}`,
          error,
        );
      },
    );
  }

  // ===========================================================================
  // Get Socket.IO Server
  // ===========================================================================

  getIO(): Server {
    return this.io;
  }

  // ===========================================================================
  // Close
  // ===========================================================================

  async close(): Promise<void> {
    await new Promise<void>(
      (resolve, reject) => {
        this.io.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      },
    );
  }
}

export default SocketService;