import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

import { SOCKET_EVENTS } from "../core/constants/socket_events.js";
import Logger from "../core/utils/logger.js";
import registerRoomSocket from "./room_socket.js";

class SocketService {
  private readonly io: Server;

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
      },
    });

    this._registerConnection();
  }

  private _registerConnection(): void {
    this.io.on(
      SOCKET_EVENTS.CONNECT,
      (socket: Socket) => {
        Logger.info(`Player connected: ${socket.id}`);

        registerRoomSocket(this.io, socket);

        // socket.on(
        //   SOCKET_EVENTS.DISCONNECT,
        //   (reason: string) => {
        //     Logger.info(
        //       `Player disconnected: ${socket.id}`,
        //       { reason }
        //     );
        //   },
        // );

        socket.on(
          SOCKET_EVENTS.ERROR,
          (error: Error) => {
            Logger.error(
              `Socket error: ${socket.id}`,
              error,
            );
          },
        );
      },
    );
  }

  getIO(): Server {
    return this.io;
  }

  async close(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.io.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

export default SocketService;