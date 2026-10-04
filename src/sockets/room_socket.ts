import type {
  Server,
  Socket,
} from 'socket.io';
import { GameConstants } from '../core/constants/game_constants.js';
import { HTTP_STATUS } from '../core/constants/http_status.js';
import {
  ROOM_SOCKET_EVENTS,
  SOCKET_EVENTS,
} from '../core/constants/socket_events.js';
import ApiError from '../core/errors/api_error.js';
import Logger from '../core/utils/logger.js';
import SocketResponse from '../core/utils/socket_response.js';
import { RoomStatus } from '../db/schema.js';
import RoomService from '../services/room_service.js';
import {
  connectRoomValidator,
  GameDismissReason,
  makeMoveValidator,
  submitGameResultValidator,
} from '../validators/room_validator.js';

function registerRoomSocket(
  io: Server,
  socket: Socket,
): void {
  // ===========================================================================
  // CONNECT ROOM
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.CONNECT_ROOM,
    withSocketErrorHandling(
      socket,
      'Failed to connect player to room',
      'Failed to connect to room',
      async (data: unknown) => {
        const parsed =
          connectRoomValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            'Invalid room connection data',
          );
          return;
        }

        const {
          roomCode,
          playerId,
        } = parsed.data;

        Logger.info(
          'Connect room request received',
          {
            roomCode,
            playerId,
            socketId: socket.id,
          },
        );

        const room =
          await RoomService.getRoomByCode(
            roomCode,
          );

        if (!room) {
          throw new ApiError(
            'Room not found',
            HTTP_STATUS.NOT_FOUND,
          );
        }

        const player = room.players.find(
          (roomPlayer) =>
            roomPlayer.id === playerId,
        );

        if (!player) {
          throw new ApiError(
            'Player is not a member of this room',
            HTTP_STATUS.FORBIDDEN,
          );
        }

        const isAlreadyConnected =
          socket.rooms.has(roomCode);

        if (!isAlreadyConnected) {
          leaveOtherRooms(
            socket,
            roomCode,
          );

          await socket.join(roomCode);

          Logger.success(
            `Player connected to room: ${roomCode}`,
          );
        }

        socket.data.playerId = playerId;
        socket.data.roomCode = roomCode;

        Logger.info(
          'Room socket joined',
          {
            roomCode,
            roomId: room.id,
            playerId,
            socketId: socket.id,
          },
        );

        socket.emit(
          ROOM_SOCKET_EVENTS.ROOM_CONNECTED,
          SocketResponse.success(room),
        );

        if (!isAlreadyConnected) {
          socket.to(roomCode).emit(
            ROOM_SOCKET_EVENTS.PLAYER_JOINED,
            SocketResponse.success(player),
          );

          Logger.info(
            'PLAYER_JOINED emitted',
            {
              roomCode,
              playerId,
            },
          );
        }
      },
    ),
  );

  // ===========================================================================
  // MAKE MOVE
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.MAKE_MOVE,
    withSocketErrorHandling(
      socket,
      'Failed to make move',
      'Failed to make move',
      async (data: unknown) => {
        const parsed =
          makeMoveValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            'Invalid move data',
          );
          return;
        }

        const {
          roomCode,
          playerId,
          index,
        } = parsed.data;

        Logger.info(
          'Make move request received',
          {
            socketId: socket.id,
            roomCode,
            playerId,
            index,
          },
        );

        validateSocketPlayer(
          socket,
          playerId,
        );

        validateSocketRoom(
          socket,
          roomCode,
        );

        const moveResult =
          await RoomService.makeMove({
            roomCode,
            playerId,
            index,
          });

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.MOVE_MADE,
          SocketResponse.success(
            moveResult,
          ),
        );

        Logger.success(
          'Move made',
          {

            playerId,
            index,
            turnPlayerId: moveResult.turnPlayerId,
            turnIndex: moveResult.turnIndex,
          },
        );
      },
    ),
  );

  // ===========================================================================
  // SUBMIT GAME RESULT
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.SUBMIT_GAME_RESULT,
    withSocketErrorHandling(
      socket,
      'Failed to submit game result',
      'Failed to submit game result',
      async (data: unknown) => {
        const parsed =
          submitGameResultValidator.safeParse(
            data,
          );

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            'Invalid game result data',
          );
          return;
        }

        const {
          roomCode,
          playerId,
          winningIndexes,
        } = parsed.data;

        Logger.info(
          'Submit game result request received',
          {
            socketId: socket.id,
            roomCode,
            playerId,
            winningIndexes,
          },
        );

        validateSocketPlayer(
          socket,
          playerId,
        );

        validateSocketRoom(
          socket,
          roomCode,
        );

        const gameResult =
          await RoomService.submitGameResult({
            roomCode,
            playerId,
            winningIndexes,
          });

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.ROUND_RESULT,
          SocketResponse.success(
            gameResult,
          ),
        );

        Logger.success(
          'Round result emitted',
          {
            roomCode,
            winnerId:
              gameResult.winnerId,
            gameFinished:
              gameResult.gameFinished,
            turnPlayerId:
              gameResult.turnPlayerId,
            turnIndex:
              gameResult.turnIndex,
          },
        );
      },
    ),
  );

  // ===========================================================================
  // SET READY
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.SET_READY,
    withSocketErrorHandling(
      socket,
      'Failed to set player ready',
      'Failed to set player ready',
      async () => {
        const playerId =
          getSocketPlayerId(socket);

        const roomCode =
          getSocketRoomCode(socket);

        validateSocketRoom(
          socket,
          roomCode,
        );

        const room =
          await RoomService.getRoomByCode(
            roomCode,
          );

        if (!room) {
          throw new ApiError(
            'Room not found',
            HTTP_STATUS.NOT_FOUND,
          );
        }

        const player = room.players.find(
          (roomPlayer) =>
            roomPlayer.id === playerId,
        );

        if (!player) {
          throw new ApiError(
            'Player is not a member of this room',
            HTTP_STATUS.FORBIDDEN,
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
            (roomPlayer) =>
              roomPlayer.isReady,
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
            turnPlayerId:
              startedRoom.turnPlayerId,
            turnIndex:
              startedRoom.turnIndex,
          }),
        );

        Logger.success(
          'Round started',
          {
            roomCode,
            round:
              startedRoom.currentRound,
          },
        );
      },
    ),
  );

  // ===========================================================================
  // START GAME
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.START_GAME,
    withSocketErrorHandling(
      socket,
      'Failed to start game',
      'Failed to start game',
      async () => {
        const playerId =
          getSocketPlayerId(socket);

        const roomCode =
          getSocketRoomCode(socket);

        validateSocketRoom(
          socket,
          roomCode,
        );

        const room =
          await RoomService.getRoomByCode(
            roomCode,
          );

        if (!room) {
          throw new ApiError(
            'Room not found',
            HTTP_STATUS.NOT_FOUND,
          );
        }

        const startedRoom =
          await RoomService.startRound(
            room.id,
            playerId,
          );

        const playerOne =
          startedRoom.players[0];

        const playerTwo =
          startedRoom.players[1];

        if (!playerOne || !playerTwo) {
          throw new ApiError(
            'Room must have exactly two players',
            HTTP_STATUS.CONFLICT,
          );
        }

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.ROUND_STARTED,
          SocketResponse.success({
            room: startedRoom,
            playerOneReady:
              playerOne.isReady,
            playerTwoReady:
              playerTwo.isReady,
            turnPlayerId:
              startedRoom.turnPlayerId,
            turnIndex:
              startedRoom.turnIndex,
          }),
        );

        Logger.success(
          'Game started',
          {
            roomCode,
            playerId,
            round:
              startedRoom.currentRound,
          },
        );
      },
    ),
  );

  // ===========================================================================
  // QUIT GAME
  // ===========================================================================

  socket.on(
    ROOM_SOCKET_EVENTS.QUIT_GAME,
    withSocketErrorHandling(
      socket,
      'Failed to quit game',
      'Failed to quit game',
      async () => {
        const playerId =
          getSocketPlayerId(socket);

        const roomCode =
          getSocketRoomCode(socket);

        Logger.info(
          'Quit game request received',
          {
            socketId: socket.id,
            roomCode,
            playerId,
          },
        );

        await handlePlayerExit({
          io,
          socket,
          roomCode,
          playerId,
          reason:
            GameDismissReason.OPPONENT_QUIT,
        });
      },
    ),
  );

  // ===========================================================================
  // DISCONNECT
  // ===========================================================================

  socket.on(
    SOCKET_EVENTS.DISCONNECT,
    async (reason: string) => {
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
        await handlePlayerExit({
          io,
          socket,
          roomCode,
          playerId,
          reason:
            GameDismissReason.OPPONENT_DISCONNECTED,
        });
      } catch (error: unknown) {
        Logger.error(
          'Failed to handle player disconnect',
          error,
        );
      }
    },
  );
}

// =============================================================================
// Socket Event Error Handling
// =============================================================================

function withSocketErrorHandling(
  socket: Socket,
  logMessage: string,
  fallbackMessage: string,
  handler: (
    data: unknown,
  ) => Promise<void>,
): (data: unknown) => Promise<void> {
  return async (
    data: unknown,
  ): Promise<void> => {
    try {
      await handler(data);
    } catch (error: unknown) {
      handleSocketError(
        socket,
        logMessage,
        error,
        fallbackMessage,
      );
    }
  };
}

function handleSocketError(
  socket: Socket,
  logMessage: string,
  error: unknown,
  fallbackMessage: string,
): void {
  if (error instanceof ApiError) {
    Logger.warn(
      `Socket API error: ${error.message} (${error.statusCode})`,
    );

    socket.emit(
      ROOM_SOCKET_EVENTS.ROOM_ERROR,
      SocketResponse.error(
        error.message,
        error.statusCode,
        error.errors,
      ),
    );

    return;
  }

  Logger.error(
    logMessage,
    error,
  );

  socket.emit(
    ROOM_SOCKET_EVENTS.ROOM_ERROR,
    SocketResponse.error(
      fallbackMessage,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ),
  );
}

// =============================================================================
// Socket Validation
// =============================================================================

function getSocketPlayerId(
  socket: Socket,
): string {
  const playerId =
    socket.data.playerId;

  if (!playerId) {
    throw new ApiError(
      'Player is not connected to a room',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return playerId;
}

function getSocketRoomCode(
  socket: Socket,
): string {
  const roomCode =
    socket.data.roomCode;

  if (!roomCode) {
    throw new ApiError(
      'Socket is not connected to a room',
      HTTP_STATUS.BAD_REQUEST,
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
    throw new ApiError(
      'Player identity does not match the connected socket',
      HTTP_STATUS.FORBIDDEN,
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
    throw new ApiError(
      'Socket room does not match the requested room',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (!socket.rooms.has(roomCode)) {
    throw new ApiError(
      'Socket is no longer connected to the room',
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

// =============================================================================
// Validation Error
// =============================================================================

function emitValidationError(
  socket: Socket,
  message: string,
): void {
  socket.emit(
    ROOM_SOCKET_EVENTS.ROOM_ERROR,
    SocketResponse.error(
      message,
      HTTP_STATUS.BAD_REQUEST,
    ),
  );
}

// =============================================================================
// Player Exit
// =============================================================================

async function handlePlayerExit({
  io,
  socket,
  roomCode,
  playerId,
  reason,
}: {
  io: Server;
  socket: Socket;
  roomCode: string;
  playerId: string;
  reason: GameDismissReason;
}): Promise<void> {
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

  // ===========================================================================
  // WAITING
  // ===========================================================================

  if (room.roundStatus === RoomStatus.WAITING) {
    if (isHost) {
      socket.to(roomCode).emit(
        ROOM_SOCKET_EVENTS.ROOM_CLOSED,
        SocketResponse.success({
          reason: 'The host has left the room.',
        }),
      );

      const deleted =
        await RoomService.deleteRoom(room.id);

      Logger.info(
        `Room ${deleted ? 'deleted' : 'was not deleted'} after host exit: ${roomCode}`,
        {
          roomId: room.id,
          playerId,
          deleted,
        },
      );

      return;
    }

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
      `Player ${playerId} left waiting room: ${roomCode}`,
    );

    return;
  }

  // ===========================================================================
  // ACTIVE GAME / RESULT
  // ===========================================================================

  const remainingPlayer =
    room.players.find(
      (player) => player.id !== playerId,
    );

  socket.to(roomCode).emit(
    ROOM_SOCKET_EVENTS.GAME_DISMISSED,
    SocketResponse.success({
      winnerPlayerId:
        remainingPlayer?.id ?? null,
      exitedPlayerId: playerId,
      reason,
    }),
  );

  const deleted =
    await RoomService.deleteRoom(room.id);

  Logger.success(
    `Game dismissed because player ${playerId} exited: ${roomCode}`,
    {
      roomId: room.id,
      winnerPlayerId:
        remainingPlayer?.id ?? null,
      reason,
      deleted,
    },
  );
}

export default registerRoomSocket;