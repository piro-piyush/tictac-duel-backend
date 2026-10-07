
import {
  Server,
  type Socket,
} from "socket.io";

import { HTTP_STATUS } from "../core/constants/http_status.js";
import {
  ROOM_SOCKET_EVENTS,
  SOCKET_EVENTS,
} from "../core/constants/socket_events.js";
import ApiError from "../core/errors/api_error.js";
import SocketError from "../core/errors/socket_error.js";
import Logger from "../core/utils/logger.js";
import { roomService } from "../services/room_service.js";
import { RoomStatus } from "../types/room.js";
import {
  createRoomValidator,
  GameDismissReason,
  joinRoomValidator,
  makeMoveValidator,
  sendReactionValidator,
  submitGameResultValidator,
} from "../validators/room_validator.js";

function registerRoomSocket(
  io: Server,
  socket: Socket,
): void {
  socket.on(
    ROOM_SOCKET_EVENTS.CREATE_ROOM,
    withSocketErrorHandling(
      socket,
      "Failed to create room",
      async (data) => {
        const parsed = createRoomValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            "Invalid room data",
          );
          return;
        }

        const room = roomService.createRoom(
          socket.id,
          parsed.data,
        );

        await socket.join(room.roomCode);

        socket.data.roomCode = room.roomCode;

        socket.emit(
          ROOM_SOCKET_EVENTS.ROOM_CREATED,
          room,
        );
      },
    ),
  );


  socket.on(
    ROOM_SOCKET_EVENTS.JOIN_ROOM,
    withSocketErrorHandling(
      socket,
      "Failed to join room",
      async (data) => {
        const parsed = joinRoomValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            "Invalid room data",
          );
          return;
        }

        const room = roomService.joinRoom(
          socket.id,
          parsed.data,
        );

        await socket.join(room.roomCode);

        socket.data.roomCode = room.roomCode;

        socket.emit(
          ROOM_SOCKET_EVENTS.ROOM_JOINED,
          room,
        );

        socket.to(room.roomCode).emit(
          ROOM_SOCKET_EVENTS.PLAYER_JOINED,
          {
            player: room.guest,
            points: room.guestPoints,
            isReady: room.guestReady,
          },
        );
      },
    ),
  );

  socket.on(
    ROOM_SOCKET_EVENTS.START_GAME,
    withSocketErrorHandling(
      socket,
      "Failed to start game",
      async () => {
        const roomCode = getSocketRoomCode(socket);

        validateSocketRoom(
          socket,
          roomCode,
        );

        const room = roomService.startRound(
          roomCode,
          socket.id,
        );

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.ROUND_STARTED,
          {
            currentRound: room.currentRound,
            status: room.status,
            hostReady: room.hostReady,
            guestReady: room.guestReady,
            turnPlayerId: room.turnPlayerId,
          },
        );
      },
    ),
  );

  socket.on(
    ROOM_SOCKET_EVENTS.MAKE_MOVE,
    withSocketErrorHandling(
      socket,
      "Failed to make move",
      async (data) => {
        const parsed = makeMoveValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            "Invalid move data",
          );
          return;
        }

        const roomCode = getSocketRoomCode(socket);

        validateSocketRoom(
          socket,
          roomCode,
        );

        const room = roomService.makeMove(
          roomCode,
          socket.id,
          parsed.data.index,
        );

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.MOVE_MADE,
          room,
        );
      },
    ),
  );

  socket.on(
    ROOM_SOCKET_EVENTS.SUBMIT_GAME_RESULT,
    withSocketErrorHandling(
      socket,
      "Failed to submit game result",
      async (data) => {
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

        const roomCode = getSocketRoomCode(socket);
        validateSocketRoom(
          socket,
          roomCode
        );

        const gameResult =
          roomService.submitGameResult(
            roomCode,
            socket.id,
            parsed.data.winningIndexes,
          );

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.ROUND_RESULT,
          gameResult,
        );

        Logger.success(
          "Round result emitted",
          {
            roomCode,
            winnerId: gameResult.winnerId,
            gameFinished:
              gameResult.gameFinished,
            turnPlayerId:
              gameResult.turnPlayerId,
          },
        );
      },
    ),
  );

  socket.on(
    ROOM_SOCKET_EVENTS.SET_READY,
    withSocketErrorHandling(
      socket,
      "Failed to set player ready",
      async () => {
        const roomCode = getSocketRoomCode(socket);

        validateSocketRoom(
          socket,
          roomCode,
        );

        const room = roomService.setReady(
          roomCode,
          socket.id,
        );

        const isHost =
          room.host.id === socket.id;

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.READY_UPDATED,
          {
            playerId: socket.id,
            isReady: isHost
              ? room.hostReady
              : room.guestReady,
          },
        );

        if (
          room.hostReady &&
          room.guestReady &&
          room.status === RoomStatus.ROUND_RESULT
        ) {
          const startedRoom =
            roomService.startRound(
              roomCode,
              room.host.id,
            );

          io.to(roomCode).emit(
            ROOM_SOCKET_EVENTS.ROUND_STARTED,
            {
              currentRound:
                startedRoom.currentRound,
              status: startedRoom.status,
              hostReady:
                startedRoom.hostReady,
              guestReady:
                startedRoom.guestReady,
              turnPlayerId:
                startedRoom.turnPlayerId,
            },
          );
        }
      },
    ),
  );

  socket.on(
    ROOM_SOCKET_EVENTS.SEND_REACTION,
    withSocketErrorHandling(
      socket,
      "Failed to send reaction",
      async (data) => {
        const parsed =
          sendReactionValidator.safeParse(data);

        if (!parsed.success) {
          emitValidationError(
            socket,
            parsed.error.issues[0]?.message ??
            "Invalid reaction data",
          );
          return;
        }

        const roomCode =
          getSocketRoomCode(socket);

        validateSocketRoom(
          socket,
          roomCode,
        );

        const room =
          roomService.getRoom(roomCode);

        if (!room) {
          throw new ApiError(
            "Room not found",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        const sender =
          roomService.getPlayer(
            room,
            socket.id,
          );

        if (!sender) {
          throw new ApiError(
            "Player is not in the room",
            HTTP_STATUS.FORBIDDEN,
          );
        }

        const target =
          room.host.id === socket.id
            ? room.guest
            : room.host;

        if (!target) {
          throw new ApiError(
            "Opponent is not available",
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        io.to(roomCode).emit(
          ROOM_SOCKET_EVENTS.REACTION_RECEIVED,
          {
            senderId: sender.id,
            targetPlayerId: target.id,
            reaction: parsed.data.reaction,
          },
        );
      },
    ),
  );

  socket.on(
    ROOM_SOCKET_EVENTS.QUIT_GAME,
    withSocketErrorHandling(
      socket,
      "Failed to quit game",
      async () => {
        handleSocketExit(
          io,
          socket,
          GameDismissReason.OPPONENT_QUIT,
        );
      },
    ),
  );

  socket.on(
    SOCKET_EVENTS.DISCONNECT,
    () => {
      handleSocketExit(
        io,
        socket,
        GameDismissReason.OPPONENT_DISCONNECTED,
      );
    },
  );
}

function withSocketErrorHandling(
  socket: Socket,
  fallbackMessage: string,
  handler: (
    data: unknown,
  ) => Promise<void>,
): (data: unknown) => Promise<void> {
  return async (data: unknown) => {
    try {
      await handler(data);
    } catch (error: unknown) {
      handleSocketError(
        socket,
        error,
        fallbackMessage,
      );
    }
  };
}

function handleSocketError(
  socket: Socket,
  error: unknown,
  fallbackMessage: string,
): void {
  if (error instanceof SocketError) {
    socket.emit(
      ROOM_SOCKET_EVENTS.ROOM_ERROR,
      error.message,
    );
    return;
  }

  socket.emit(
    ROOM_SOCKET_EVENTS.ROOM_ERROR,
    fallbackMessage,
  );
}

function emitValidationError(
  socket: Socket,
  message: string,
): void {
  socket.emit(
    ROOM_SOCKET_EVENTS.ROOM_ERROR,
    message,
  );
}

function getSocketRoomCode(
  socket: Socket,
): string {
  const roomCode = socket.data.roomCode;

  if (!roomCode) {
    throw new ApiError(
      "Socket is not connected to a room",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return roomCode;
}

function validateSocketRoom(
  socket: Socket,
  roomCode: string,
): void {
  if (!socket.rooms.has(roomCode)) {
    throw new ApiError(
      "Socket is no longer connected to the room",
      HTTP_STATUS.FORBIDDEN,
    );
  }
}

function handleSocketExit(
  io: Server,
  socket: Socket,
  reason: GameDismissReason,
): void {
  const roomCode = socket.data.roomCode;

  if (!roomCode) {
    return;
  }

  delete socket.data.roomCode;

  const result =
    roomService.removeBySocketId(socket.id);

  if (!result) {
    return;
  }

  const {
    room,
    player,
    opponent,
    roomClosed,
  } = result;

  Logger.info(
    "Player exited room",
    {
      socketId: socket.id,
      roomCode,
      playerId: player.id,
      reason,
      status: room.status,
      roomClosed,
    },
  );

  if (roomClosed) {
    if (opponent) {
      io.to(roomCode).emit(
        ROOM_SOCKET_EVENTS.ROOM_CLOSED,
        reason,
      );
    }

    Logger.info(
      "Room closed after host exit",
      {
        roomCode,
        hostId: player.id,
        reason,
      },
    );

    socket.leave(roomCode);

    return;
  }

  if (
    room.status === RoomStatus.WAITING &&
    opponent
  ) {
    io.to(roomCode).emit(
      ROOM_SOCKET_EVENTS.PLAYER_LEFT,
      player.id,
    );

    Logger.info(
      "Player left waiting room",
      {
        roomCode,
        playerId: player.id,
      },
    );
  }

  if (
    room.status === RoomStatus.ROUND_RESULT &&
    opponent
  ) {
    io.to(roomCode).emit(
      ROOM_SOCKET_EVENTS.GAME_DISMISSED,
      {
        currentRound: room.currentRound,
        status: room.status,
        winnerPlayerId: opponent.id,
        exitedPlayerId: player.id,
        reason,
        hostPoints: room.hostPoints,
        guestPoints: room.guestPoints,
      },
    );

    Logger.success(
      "Game dismissed after player exit",
      {
        roomCode,
        currentRound: room.currentRound,
        winnerPlayerId: opponent.id,
        exitedPlayerId: player.id,
        reason,
        hostPoints: room.hostPoints,
        guestPoints: room.guestPoints,
      },
    );
  }

  socket.leave(roomCode);
}

export default registerRoomSocket;
