import type { Server, Socket } from "socket.io";
import { GameConstants } from "../core/constants/game_constants.js";

import {
  ROOM_SOCKET_EVENTS,
  SOCKET_EVENTS,
} from "../core/constants/socket_events.js";
import Logger from "../core/utils/logger.js";
import SocketResponse from "../core/utils/socket_response.js";
import { RoomStatus } from "../db/schema.js";
import RoomService from "../services/room_service.js";
import {
  connectRoomValidator,
  GameDismissReason,
  makeMoveValidator,
  submitGameResultValidator,
} from "../validators/room_validator.js";

function registerRoomSocket(
  io: Server,
  socket: Socket,
): void {
  // ===========================================================================
  // CONNECT ROOM
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.CONNECT_ROOM,
    async (data: unknown): Promise<void> => {
      try {
        const parsed =
          connectRoomValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            "Invalid room connection data",
          );
          return;
        }

        const { roomCode, playerId } = parsed.data;

        Logger.info("Connect room request received", {
          roomCode,
          playerId,
          socketId: socket.id,
        });

        const room =
          await RoomService.getRoomByCode(roomCode);

        if (!room) {
          throw new Error("Room not found");
        }

        const player = room.players.find(
          (roomPlayer) => roomPlayer.id === playerId,
        );

        if (!player) {
          throw new Error(
            "Player is not a member of this room",
          );
        }

        const isAlreadyConnected =
          socket.rooms.has(roomCode);

        if (!isAlreadyConnected) {
          leaveOtherRooms(socket, roomCode);
          await socket.join(roomCode);

          Logger.success(
            `Player connected to room: ${roomCode}`,
          );
        }

        socket.data.playerId = playerId;
        socket.data.roomCode = roomCode;

        Logger.info("Room socket joined", {
          roomCode,
          roomId: room.id,
          playerId,
          socketId: socket.id,
        });

        socket.emit(
          ROOM_SOCKET_EVENTS.ROOM_CONNECTED,
          SocketResponse.success(room),
        );

        if (!isAlreadyConnected) {
          socket.to(roomCode).emit(
            ROOM_SOCKET_EVENTS.PLAYER_JOINED,
            SocketResponse.success(player),
          );

          Logger.info("PLAYER_JOINED emitted", {
            roomCode,
            playerId,
          });
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

  // ===========================================================================
  // MAKE MOVE
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.MAKE_MOVE,
    async (data: unknown): Promise<void> => {
      try {
        const parsed =
          makeMoveValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            "Invalid move data",
          );
          return;
        }

        const {
          roomCode,
          playerId,
          index,
        } = parsed.data;

        Logger.info("Make move request received", {
          socketId: socket.id,
          roomCode,
          playerId,
          index,
        });

        validateSocketPlayer(socket, playerId);
        validateSocketRoom(socket, roomCode);

        const moveResult =
          await RoomService.makeMove({
            roomCode,
            playerId,
            index,
          });

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.MOVE_MADE,
          SocketResponse.success(moveResult),
        );

        Logger.success("Move made", {
          roomCode,
          playerId,
          index,
        });
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

  // ===========================================================================
  // SUBMIT GAME RESULT
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.SUBMIT_GAME_RESULT,
    async (data: unknown): Promise<void> => {
      try {
        const parsed =
          submitGameResultValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            "Invalid game result data",
          );
          return;
        }

        const {
          roomCode,
          playerId,
          winningIndexes,
        } = parsed.data;

        Logger.info(
          "Submit game result request received",
          {
            socketId: socket.id,
            roomCode,
            playerId,
            winningIndexes,
          },
        );

        validateSocketPlayer(socket, playerId);
        validateSocketRoom(socket, roomCode);

        const gameResult =
          await RoomService.submitGameResult({
            roomCode,
            playerId,
            winningIndexes,
          });

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.ROUND_RESULT,
          SocketResponse.success(gameResult),
        );

        Logger.success("Round result emitted", {
          roomCode,
          winnerId: gameResult.winnerId,
          gameFinished: gameResult.gameFinished,
        });
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

  // ===========================================================================
  // SET READY
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.SET_READY,
    async (): Promise<void> => {
      try {
        const playerId = getSocketPlayerId(socket);
        const roomCode = getSocketRoomCode(socket);

        const room =
          await RoomService.getRoomByCode(roomCode);

        if (!room) {
          throw new Error("Room not found");
        }

        const player = room.players.find(
          (roomPlayer) => roomPlayer.id === playerId,
        );

        if (!player) {
          throw new Error(
            "Player is not a member of this room",
          );
        }

        if (player.isReady) {
          return;
        }

        const updatedRoom =
          await RoomService.setPlayerReady(
            room.id,
            playerId,
            true,
          );

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.READY_UPDATED,
          SocketResponse.success({
            playerId,
            isReady: true,
          }),
        );

        const allReady =
          updatedRoom.players.length ===
          GameConstants.maxPlayers &&
          updatedRoom.players.every(
            (roomPlayer) => roomPlayer.isReady,
          );

        if (!allReady) {
          return;
        }

        const startedRoom =
          await RoomService.startRound(
            room.id,
            playerId,
          );

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.ROUND_STARTED,
          SocketResponse.success({
            room: startedRoom,
            playerOneReady: false,
            playerTwoReady: false,
            turnPlayerId: startedRoom.turnPlayerId,
            turnIndex: startedRoom.turnIndex,
          }),
        );
      } catch (error: unknown) {
        handleSocketError(
          socket,
          "Failed to set player ready",
          error,
          "Failed to set player ready",
        );
      }
    },
  );

  // ===========================================================================
  // START GAME
  // ===========================================================================


  socket.on(
    ROOM_SOCKET_EVENTS.START_GAME,
    async (): Promise<void> => {
      try {
        const playerId = getSocketPlayerId(socket);
        const roomCode = getSocketRoomCode(socket);

        const room =
          await RoomService.getRoomByCode(roomCode);

        if (!room) {
          throw new Error("Room not found");
        }

        const startedRoom =
          await RoomService.startRound(
            room.id,
            playerId,
          );

        const playerOne = startedRoom.players[0];
        const playerTwo = startedRoom.players[1];

        if (!playerOne || !playerTwo) {
          throw new Error(
            "Room must have exactly two players",
          );
        }

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.ROUND_STARTED,
          SocketResponse.success({
            room: startedRoom,
            playerOneReady: playerOne.isReady,
            playerTwoReady: playerTwo.isReady,
            turnPlayerId: startedRoom.turnPlayerId,
            turnIndex: startedRoom.turnIndex,
          }),
        );
      } catch (error: unknown) {
        handleSocketError(
          socket,
          "Failed to start game",
          error,
          "Failed to start game",
        );
      }
    },
  );


  // ===========================================================================
  // QUIT GAME
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.QUIT_GAME,
    async (): Promise<void> => {
      try {
        const playerId = getSocketPlayerId(socket);
        const roomCode = getSocketRoomCode(socket);

        Logger.info("Quit game request received", {
          socketId: socket.id,
          roomCode,
          playerId,
        });

        const room =
          await RoomService.getRoomByCode(roomCode);

        if (!room) {
          return;
        }

        const isHost =
          room.hostPlayerId === playerId;

        // =========================================================================
        // PLAYING → REMAINING PLAYER WINS
        // =========================================================================

        if (
          room.roundStatus === RoomStatus.PLAYING
        ) {
          const remainingPlayer =
            room.players.find(
              (player) => player.id !== playerId,
            );

          await RoomService.deleteRoom(room.id);

          if (!remainingPlayer) {
            Logger.info(
              `Room deleted because no player remained: ${roomCode}`,
            );
            return;
          }

          socket.to(roomCode).emit(
            ROOM_SOCKET_EVENTS.GAME_DISMISSED,
            SocketResponse.success({
              winnerPlayerId: remainingPlayer.id,
              disconnectedPlayerId: playerId,
              reason: GameDismissReason.OPPONENT_QUIT,
            }),
          );

          Logger.success(
            `Game dismissed: ${remainingPlayer.id} won because ${playerId} quit`,
          );

          return;
        }

        // =========================================================================
        // WAITING / RESULT →   HOST LEAVES
        // =========================================================================

        if (isHost) {
          await RoomService.deleteRoom(room.id);

          socket.to(roomCode).emit(
            ROOM_SOCKET_EVENTS.ROOM_CLOSED,
            SocketResponse.success({
              reason: "The host has left the room.",
            }),
          );

          Logger.info(
            `Room closed because host ${playerId} quit: ${roomCode}`,
          );

          return;
        }

        // =========================================================================
        // WAITING / RESULT → GUEST LEAVES
        // =========================================================================

        await RoomService.removePlayer(
          room.id,
          playerId,
        );

        socket.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.PLAYER_LEFT,
          SocketResponse.success({
            playerId,
          }),
        );

        Logger.info(
          `PLAYER_LEFT emitted because player ${playerId} quit: ${roomCode}`,
        );
      } catch (error: unknown) {
        handleSocketError(
          socket,
          "Failed to quit game",
          error,
          "Failed to quit game",
        );
      }
    },
  );

  // ===========================================================================
  // DISCONNECT
  // ===========================================================================

  socket.on(
    SOCKET_EVENTS.DISCONNECT,
    async (reason: string): Promise<void> => {
      const roomCode = socket.data.roomCode;
      const playerId = socket.data.playerId;

      Logger.info(
        `Player disconnected: ${socket.id}`,
        {
          reason,
          roomCode,
          playerId,
        },
      );

      if (!roomCode || !playerId) {
        return;
      }

      try {
        const room =
          await RoomService.getRoomByCode(roomCode);

        if (!room) {
          Logger.info(
            `Room already deleted: ${roomCode}`,
          );
          return;
        }

        const isHost =
          room.hostPlayerId === playerId;

        // =========================================================================
        // PLAYING → REMAINING PLAYER WINS
        // =========================================================================

        if (
          room.roundStatus === RoomStatus.PLAYING
        ) {
          const remainingSockets = await io
            .in(roomCode)
            .fetchSockets();

          const remainingPlayerId =
            remainingSockets
              .map(
                (connectedSocket) =>
                  connectedSocket.data.playerId,
              )
              .find(
                (id): id is string =>
                  typeof id === "string" &&
                  id !== playerId,
              );

          await RoomService.deleteRoom(room.id);

          if (!remainingPlayerId) {
            Logger.info(
              `Room deleted because no player remained: ${roomCode}`,
            );
            return;
          }

          socket.to(roomCode).emit(
            ROOM_SOCKET_EVENTS.GAME_DISMISSED,
            SocketResponse.success({
              winnerPlayerId: remainingPlayerId,
              disconnectedPlayerId: playerId,
              reason:
                GameDismissReason.OPPONENT_DISCONNECTED,
            }),
          );

          Logger.success(
            `Game dismissed: ${remainingPlayerId} won because ${playerId} disconnected`,
          );

          return;
        }

        // =========================================================================
        // WAITING / RESULT → HOST LEAVES
        // =========================================================================

        if (isHost) {
          await RoomService.deleteRoom(room.id);

          socket.to(roomCode).emit(
            ROOM_SOCKET_EVENTS.ROOM_CLOSED,
            SocketResponse.success({
              reason: "The host has left the room.",
            }),
          );

          Logger.info(
            `Room closed because host ${playerId} left: ${roomCode}`,
          );

          return;
        }

        // =========================================================================
        // WAITING / RESULT → GUEST LEAVES
        // =========================================================================

        await RoomService.removePlayer(
          room.id,
          playerId,
        );

        socket.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.PLAYER_LEFT,
          SocketResponse.success({
            playerId,
          }),
        );

        Logger.info(
          `PLAYER_LEFT emitted for player ${playerId} in room ${roomCode}`,
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

// =============================================================================
// Helpers
// =============================================================================

function getSocketPlayerId(
  socket: Socket,
): string {
  const playerId = socket.data.playerId;

  if (!playerId) {
    throw new Error(
      "Player is not connected to a room",
    );
  }

  return playerId;
}

function getSocketRoomCode(
  socket: Socket,
): string {
  const roomCode = socket.data.roomCode;

  if (!roomCode) {
    throw new Error(
      "Socket is not connected to a room",
    );
  }

  return roomCode;
}

function leaveOtherRooms(
  socket: Socket,
  roomCode: string,
): void {
  for (const roomName of socket.rooms) {
    if (
      roomName === socket.id ||
      roomName === roomCode
    ) {
      continue;
    }

    socket.leave(roomName);
  }
}

function validateSocketPlayer(
  socket: Socket,
  playerId: string,
): void {
  const connectedPlayerId =
    getSocketPlayerId(socket);

  if (connectedPlayerId !== playerId) {
    throw new Error(
      "Player identity does not match the connected socket",
    );
  }
}

function validateSocketRoom(
  socket: Socket,
  roomCode: string,
): void {
  const connectedRoomCode =
    getSocketRoomCode(socket);

  if (connectedRoomCode !== roomCode) {
    throw new Error(
      "Socket room does not match the requested room",
    );
  }

  if (!socket.rooms.has(roomCode)) {
    throw new Error(
      "Socket is no longer connected to the room",
    );
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

  const message =
    error instanceof Error
      ? error.message
      : fallbackMessage;

  socket.emit(
    ROOM_SOCKET_EVENTS.ROOM_ERROR,
    SocketResponse.error(message),
  );
}

export default registerRoomSocket;