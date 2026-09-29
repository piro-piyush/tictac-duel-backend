import type { Server, Socket } from "socket.io";

import {
  ROOM_SOCKET_EVENTS,
  SOCKET_EVENTS,
} from "../core/constants/socket_events.js";
import Logger from "../core/utils/logger.js";
import SocketResponse from "../core/utils/socket_response.js";
import RoomService from "../services/room_service.js";
import {
  connectRoomValidator,
  makeMoveValidator,
  submitGameResultValidator,
} from "../validators/room_validator.js";

function registerRoomSocket(
  io: Server,
  socket: Socket,
): void {
  // ---------------------------------------------------------------------------
  // Connect Player To Room
  // ---------------------------------------------------------------------------

  socket.on(
    ROOM_SOCKET_EVENTS.CONNECT_ROOM,
    async (data: unknown): Promise<void> => {
      try {
        const result = connectRoomValidator.safeParse(data);

        if (!result.success) {
          emitValidationError(
            socket,
            result.error.issues[0]?.message ??
            "Invalid room connection data",
          );
          return;
        }

        const { roomCode, playerId } = result.data;

        Logger.info("Connect room request received", {
          roomCode,
          playerId,
          socketId: socket.id,
        });

        const room = await RoomService.getRoomByCode(roomCode);

        if (!room) {
          throw new Error("Room not found");
        }

        const player = room.players.find(
          (player) => player.id === playerId,
        );

        if (!player) {
          throw new Error(
            "Player is not a member of this room",
          );
        }

        const isAlreadyConnected = socket.rooms.has(
          room.id,
        );

        if (!isAlreadyConnected) {
          leaveOtherRooms(socket);

          await socket.join(room.id);

          Logger.success(
            `Player connected to room: ${room.roomCode}`,
          );
        }

        // Store socket identity on the server.
        socket.data.playerId = playerId;
        socket.data.roomId = room.id;

        Logger.info("Room socket joined", {
          roomId: room.id,
          roomCode: room.roomCode,
          playerId: player.id,
          socketId: socket.id,
        });

        // Send the current room state to the player who connected.
        socket.emit(
          ROOM_SOCKET_EVENTS.ROOM_CONNECTED,
          SocketResponse.success(room),
        );

        // Notify existing players only when this socket
        // actually joined the room for the first time.
        if (!isAlreadyConnected) {
          socket.to(room.id).emit(
            ROOM_SOCKET_EVENTS.PLAYER_JOINED,
            SocketResponse.success(room),
          );
        }
      } catch (error: unknown) {
        handleSocketError(
          socket,
          "Failed to connect player to room",
          error,
          "Failed to connect to room",
        );
      }
    },
  );

  // ---------------------------------------------------------------------------
  // Make Move
  // ---------------------------------------------------------------------------

  socket.on(
    ROOM_SOCKET_EVENTS.MAKE_MOVE,
    async (data: unknown): Promise<void> => {
      try {
        const result = makeMoveValidator.safeParse(data);

        if (!result.success) {
          emitValidationError(
            socket,
            result.error.issues[0]?.message ??
            "Invalid move data",
          );
          return;
        }

        const { roomCode, playerId, index } = result.data;

        Logger.info("Make move request received", {
          roomCode,
          playerId,
          index,
          socketId: socket.id,
        });

        validateSocketPlayer(socket, playerId);
        validateSocketRoom(socket, roomCode);

        const moveResult = await RoomService.makeMove({
          roomCode,
          playerId,
          index,
        });

        Logger.success(
          `Move made in room: ${moveResult.room.roomCode}`,
        );

        Logger.info("Move details", {
          roomCode: moveResult.room.roomCode,
          playerId,
          index: moveResult.move.index,
          symbol: moveResult.move.symbol,
          turnPlayerId: moveResult.room.turnPlayerId,
          turnIndex: moveResult.room.turnIndex,
        });

        io.to(moveResult.room.id).emit(
          ROOM_SOCKET_EVENTS.MOVE_MADE,
          SocketResponse.success(moveResult),
        );
      } catch (error: unknown) {
        handleSocketError(
          socket,
          "Failed to make move",
          error,
          "Failed to make move",
        );
      }
    },
  );

  // ---------------------------------------------------------------------------
  // Submit Game Result
  // ---------------------------------------------------------------------------

  socket.on(
    ROOM_SOCKET_EVENTS.SUBMIT_GAME_RESULT,
    async (data: unknown): Promise<void> => {
      try {
        const result =
          submitGameResultValidator.safeParse(data);

        if (!result.success) {
          emitValidationError(
            socket,
            result.error.issues[0]?.message ??
            "Invalid game result data",
          );
          return;
        }

        const {
          roomCode,
          playerId,
          winnerPlayerId,
          winningIndexes,
        } = result.data;

        Logger.info(
          "Submit game result request received",
          {
            roomCode,
            playerId,
            winnerPlayerId,
            winningIndexes,
            socketId: socket.id,
          },
        );

        validateSocketPlayer(socket, playerId);
        validateSocketRoom(socket, roomCode);

        const gameResult =
          await RoomService.submitGameResult({
            roomCode,
            playerId,
            winnerPlayerId,
            winningIndexes,
          });

        Logger.success(
          `Round result submitted for room: ${gameResult.room.roomCode}`,
        );

        Logger.info("Round result", {
          roomCode: gameResult.room.roomCode,
          round: gameResult.completedRound,
          roundStatus: gameResult.room.roundStatus,
          playerId,
          winnerPlayerId: gameResult.winnerPlayerId,
          winningIndexes: gameResult.winningIndexes,
          gameFinished: gameResult.gameFinished,
        });

        io.to(gameResult.room.id).emit(
          ROOM_SOCKET_EVENTS.ROUND_RESULT,
          SocketResponse.success(gameResult),
        );
      } catch (error: unknown) {
        handleSocketError(
          socket,
          "Failed to submit game result",
          error,
          "Failed to submit game result",
        );
      }
    },
  );




  socket.on(
    ROOM_SOCKET_EVENTS.SET_READY,
    async (): Promise<void> => {
      try {
        const playerId = socket.data.playerId;
        const roomId = socket.data.roomId;

        if (!playerId || !roomId) {
          throw new Error("Player is not connected to a room");
        }

        const room = await RoomService.getRoom(roomId);

        if (!room) {
          throw new Error("Room not found");
        }

        const player = room.players.find(
          (player) => player.id === playerId,
        );

        if (!player) {
          throw new Error("Player is not a member of this room");
        }

        if (player.isReady) {
          return;
        }

        await RoomService.setPlayerReady(
          roomId,
          playerId,
          true,
        );

        const updatedRoom = await RoomService.getRoom(roomId);

        if (!updatedRoom) {
          throw new Error("Room not found");
        }

        io.to(roomId).emit(
          ROOM_SOCKET_EVENTS.READY_UPDATED,
          SocketResponse.success(updatedRoom),
        );

        const allReady = updatedRoom.players.length === 2 &&
          updatedRoom.players.every(
            (player) => player.isReady,
          );

        if (!allReady) {
          return;
        }

        const startedRoom = await RoomService.startRound(roomId);

        io.to(roomId).emit(
          ROOM_SOCKET_EVENTS.ROUND_STARTED,
          SocketResponse.success(startedRoom),
        );
      } catch (error: unknown) {
        socket.emit(
          ROOM_SOCKET_EVENTS.ROOM_ERROR,
          SocketResponse.error(
            error instanceof Error
              ? error.message
              : "Failed to set player ready",
          ),
        );
      }
    },
  );

  socket.on(
    ROOM_SOCKET_EVENTS.START_GAME,
    async (): Promise<void> => {
      try {
        const playerId = socket.data.playerId;
        const roomId = socket.data.roomId;

        if (!playerId || !roomId) {
          throw new Error("Player is not connected to a room");
        }

        const room = await RoomService.getRoom(roomId);

        if (!room) {
          throw new Error("Room not found");
        }

        if (room.hostPlayerId !== playerId) {
          throw new Error("Only the host can start the game");
        }

        if (room.players.length !== 2) {
          throw new Error("Two players are required to start the game");
        }

        if (!room.players.every((player) => player.isReady)) {
          throw new Error("Both players must be ready");
        }

        const startedRoom = await RoomService.startRound(roomId);

        io.to(roomId).emit(
          ROOM_SOCKET_EVENTS.ROUND_STARTED,
          SocketResponse.success(startedRoom),
        );
      } catch (error: unknown) {
        socket.emit(
          ROOM_SOCKET_EVENTS.ROOM_ERROR,
          SocketResponse.error(
            error instanceof Error
              ? error.message
              : "Failed to start game",
          ),
        );
      }
    },
  );
  // ---------------------------------------------------------------------------
  // Disconnect Player
  // ---------------------------------------------------------------------------

  socket.on(
    SOCKET_EVENTS.DISCONNECT,
    async (reason: string): Promise<void> => {
      const roomId = socket.data.roomId;
      const playerId = socket.data.playerId;

      Logger.info(`Player disconnected: ${socket.id}`, {
        reason,
        roomId,
        playerId,
      });

      if (!roomId || !playerId) {
        return;
      }

      try {
        const room = await RoomService.getRoom(roomId);

        if (!room) {
          Logger.info(`Room already deleted: ${roomId}`);
          return;
        }

        const isHost = room.hostPlayerId === playerId;

        // =========================================================================
        // PLAYING → REMAINING PLAYER WINS
        // =========================================================================

        if (room.roundStatus === "playing") {
          const remainingSockets = await io
            .in(roomId)
            .fetchSockets();

          const remainingPlayerId = remainingSockets
            .map((connectedSocket) => connectedSocket.data.playerId)
            .find(
              (id): id is string =>
                typeof id === "string" && id !== playerId,
            );

          await RoomService.deleteRoom(roomId);

          if (!remainingPlayerId) {
            Logger.info(
              `Room deleted because no player remained: ${roomId}`,
            );
            return;
          }

          socket.to(roomId).emit(
            ROOM_SOCKET_EVENTS.GAME_DISMISSED,
            SocketResponse.success({
              winnerPlayerId: remainingPlayerId,
              disconnectedPlayerId: playerId,
              reason: "opponent_disconnected",
            }),
          );

          Logger.success(
            `Game dismissed: ${remainingPlayerId} won because ${playerId} disconnected`,
          );

          return;
        }

        // =========================================================================
        // WAITING → HOST LEAVES
        // =========================================================================

        if (isHost) {
          socket.to(roomId).emit(
            ROOM_SOCKET_EVENTS.ROOM_CLOSED,
            SocketResponse.success({
              reason: "The host has left the room.",
            }),
          );

          await RoomService.deleteRoom(roomId);

          Logger.info(
            `Room closed because host ${playerId} left: ${roomId}`,
          );

          return;
        }

        // =========================================================================
        // WAITING → GUEST LEAVES
        // =========================================================================

        await RoomService.removePlayer(roomId, playerId);

        const updatedRoom = await RoomService.getRoom(roomId);

        if (!updatedRoom) {
          Logger.info(
            `Room was deleted after player ${playerId} left: ${roomId}`,
          );
          return;
        }

        socket.to(roomId).emit(
          ROOM_SOCKET_EVENTS.PLAYER_LEFT,
          SocketResponse.success(updatedRoom),
        );

        Logger.info(
          `Player ${playerId} left room: ${roomId}`,
        );
      } catch (error: unknown) {
        Logger.error(
          "Failed to handle player disconnect",
          error,
        );
      }
    },
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function leaveOtherRooms(socket: Socket): void {
  for (const roomId of socket.rooms) {
    if (roomId !== socket.id) {
      socket.leave(roomId);
    }
  }
}

function validateSocketPlayer(
  socket: Socket,
  playerId: string,
): void {
  const connectedPlayerId = socket.data.playerId;

  if (
    connectedPlayerId &&
    connectedPlayerId !== playerId
  ) {
    throw new Error(
      "Player identity does not match the connected socket",
    );
  }
}

function validateSocketRoom(
  socket: Socket,
  roomCode: string,
): void {
  const roomId = socket.data.roomId;

  if (!roomId) {
    throw new Error(
      "Socket is not connected to a room",
    );
  }

  if (!socket.rooms.has(roomId)) {
    throw new Error(
      "Socket is no longer connected to the room",
    );
  }

  const normalizedRoomCode = roomCode
    .trim()
    .toUpperCase();

  if (normalizedRoomCode.length !== 6) {
    throw new Error("Invalid room code");
  }
}

function emitValidationError(
  socket: Socket,
  message: string,
): void {
  socket.emit(
    ROOM_SOCKET_EVENTS.ROOM_ERROR,
    SocketResponse.error(message),
  );
}

function handleSocketError(
  socket: Socket,
  logMessage: string,
  error: unknown,
  fallbackMessage: string,
): void {
  Logger.error(logMessage, error);

  socket.emit(
    ROOM_SOCKET_EVENTS.ROOM_ERROR,
    SocketResponse.error(
      error instanceof Error
        ? error.message
        : fallbackMessage,
    ),
  );
}

export default registerRoomSocket;