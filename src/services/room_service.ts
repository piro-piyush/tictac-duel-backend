
import { GameConstants } from "../core/constants/game_constants.js";
import SocketError from "../core/errors/socket_error.js";
import {
  PlayerSymbol,
  RoomStatus,
  type CreateRoomData,
  type JoinRoomData,
  type Room,
  type RoomPlayer,
} from "../types/room.js";

export class RoomService {
  private readonly rooms = new Map<string, Room>();

  createRoom(
    socketId: string,
    data: CreateRoomData,
  ): Room {
    const roomCode = this._generateRoomCode();

    const host: RoomPlayer = {
      id: socketId,
      name: data.name,
      symbol: data.symbol,
      points: 0,
      isReady: true,
    };

    const room: Room = {
      roomCode,
      host,
      guest: null,
      turnSocketId: null,
      currentRound: 0,
      maxRounds: data.maxRounds,
      roundStatus: RoomStatus.WAITING,
      theme: data.theme,
      isPrivate: data.isPrivate,
    };

    this.rooms.set(roomCode, room);

    return room;
  }

  joinRoom(
    socketId: string,
    data: JoinRoomData,
  ): Room {
    const room = this._requireRoom(data.roomCode);

    if (room.guest) {
      throw new SocketError("Room is full");
    }

    if (room.roundStatus !== RoomStatus.WAITING) {
      throw new SocketError("Game has already started");
    }

    const guestSymbol =
      room.host.symbol === PlayerSymbol.X
        ? PlayerSymbol.O
        : PlayerSymbol.X;

    room.guest = {
      id: socketId,
      name: data.name,
      symbol: guestSymbol,
      points: 0,
      isReady: true,
    };

    return room;
  }

  startRound(
    roomCode: string,
    socketId: string,
  ): Room {
    const room = this._requireRoom(roomCode);

    if (room.host.id !== socketId) {
      throw new SocketError(
        "Only the host can start the game",
      );
    }

    if (!room.guest) {
      throw new SocketError(
        "Waiting for an opponent",
      );
    }

    if (
      !room.host.isReady ||
      !room.guest.isReady
    ) {
      throw new SocketError(
        "Both players must be ready",
      );
    }

    if (room.currentRound >= room.maxRounds) {
      throw new SocketError(
        "Maximum rounds reached",
      );
    }

    room.currentRound += 1;
    room.roundStatus = RoomStatus.PLAYING;
    room.turnSocketId = room.host.id;
    room.host.isReady = false;
    room.guest.isReady = false;

    return room;
  }

  getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(
      roomCode.trim().toUpperCase(),
    );
  }

  getPublicRooms(): Room[] {
    return Array.from(
      this.rooms.values(),
    ).filter(
      (room) =>
        !room.isPrivate &&
        room.roundStatus === RoomStatus.WAITING &&
        room.guest === null,
    );
  }

  getPlayer(
    room: Room,
    socketId: string,
  ): RoomPlayer | null {
    if (room.host.id === socketId) {
      return room.host;
    }

    if (room.guest?.id === socketId) {
      return room.guest;
    }

    return null;
  }

  setReady(
    roomCode: string,
    socketId: string,
  ): Room {
    const room = this._requireRoom(roomCode);
    const player = this.getPlayer(room, socketId);

    if (!player) {
      throw new SocketError(
        "Player is not in the room",
      );
    }

    player.isReady = !player.isReady;

    return room;
  }

  makeMove(
    roomCode: string,
    socketId: string,
    index: number,
  ): Room {
    const room = this._requireRoom(roomCode);

    if (room.roundStatus !== RoomStatus.PLAYING) {
      throw new SocketError("Round is not active");
    }

    if (room.turnSocketId !== socketId) {
      throw new SocketError("Not your turn");
    }

    if (
      index < 0 ||
      index >= GameConstants.totalCells
    ) {
      throw new SocketError("Invalid board index");
    }

    const player = this.getPlayer(
      room,
      socketId,
    );

    if (!player) {
      throw new SocketError(
        "Player is not in the room",
      );
    }

    const opponent =
      room.host.id === socketId
        ? room.guest
        : room.host;

    room.turnSocketId =
      opponent?.id ?? null;

    return room;
  }

  removeRoom(roomCode: string): boolean {
    return this.rooms.delete(
      roomCode.trim().toUpperCase(),
    );
  }


  removeBySocketId(
    socketId: string,
  ): {
    room: Room;
    player: RoomPlayer;
    opponent: RoomPlayer | null;
    roomClosed: boolean;
  } | null {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.host.id === socketId) {
        const player = room.host;
        const opponent = room.guest;

        if (room.roundStatus === RoomStatus.WAITING) {
          this.rooms.delete(roomCode);

          return {
            room,
            player,
            opponent,
            roomClosed: true,
          };
        }

        room.roundStatus = RoomStatus.ROUND_RESULT;

        return {
          room,
          player,
          opponent,
          roomClosed: false,
        };
      }

      if (room.guest?.id === socketId) {
        const player = room.guest;
        const opponent = room.host;

        if (room.roundStatus === RoomStatus.WAITING) {
          room.guest = null;

          return {
            room,
            player,
            opponent,
            roomClosed: false,
          };
        }

        room.roundStatus = RoomStatus.ROUND_RESULT;

        return {
          room,
          player,
          opponent,
          roomClosed: false,
        };
      }
    }

    return null;
  }


  private _requireRoom(
    roomCode: string,
  ): Room {
    const room = this.getRoom(roomCode);

    if (!room) {
      throw new SocketError("Room not found");
    }

    return room;
  }

  private _generateRoomCode(): string {
    let roomCode = "";

    do {
      roomCode = Array.from(
        {
          length:
            GameConstants.roomCodeLength,
        },
        () =>
          GameConstants.roomCodeCharacters[
          Math.floor(
            Math.random() *
            GameConstants
              .roomCodeCharacters.length,
          )
          ],
      ).join("");
    } while (this.rooms.has(roomCode));

    return roomCode;
  }
}

export const roomService = new RoomService();

