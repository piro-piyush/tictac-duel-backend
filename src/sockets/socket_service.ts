
import type { Server as HttpServer } from "http";

import { Server, type Socket } from "socket.io";

import { SOCKET_EVENTS } from "../core/constants/socket_events.js";
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
        registerRoomSocket(
          this.io,
          socket,
        );
      },
    );
  }

  getIO(): Server {
    return this.io;
  }

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
