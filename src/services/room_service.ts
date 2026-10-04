import {
  and,
  eq,
  sql,
} from "drizzle-orm";
import { GameConstants } from "../core/constants/game_constants.js";
import { db } from "../db/index.js";
import {
  players,
  roomPlayers,
  rooms,
  RoomStatus,
} from "../db/schema.js";
import type { NewRoom } from "../db/types.js";
import type {
  CreateRoomParams,
  GameResult,
  JoinRoomParams,
  MakeMoveParams,
  MoveResult,
  Room,
  RoomPlayer,
  SubmitGameResultParams,
} from "../validators/room_validator.js";


// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Database = Pick<
  typeof db,
  "select" | "insert" | "update" | "delete"
>;

type AddRoomPlayerParams = {
  roomId: string;
  playerId: string;
  name: string;
  symbol: "x" | "o";
};

// -----------------------------------------------------------------------------
// Room Service
// -----------------------------------------------------------------------------

class RoomService {
  // ---------------------------------------------------------------------------
  // Create Room
  // ---------------------------------------------------------------------------

  async createRoom({
    playerId,
    playerName,
    symbol,
    theme,
    maxRounds,
    isPrivate,
  }: CreateRoomParams): Promise<Room> {
    const roomCode = await this._generateUniqueRoomCode();

    const newRoom: NewRoom = {
      roomCode,
      hostPlayerId: playerId,
      theme,
      maxRounds,
      isPrivate,
      currentRound: 0,
      roundStatus: RoomStatus.WAITING,
      turnPlayerId: playerId,
      turnIndex: 0,

    };

    return db.transaction(async (tx) => {
      await this._ensurePlayer(playerId, tx);

      const [room] = await tx
        .insert(rooms)
        .values(newRoom)
        .returning();

      if (!room) {
        throw new Error("Failed to create room");
      }

      await this._addRoomPlayer(
        {
          roomId: room.id,
          playerId,
          name: playerName,
          symbol,
        },
        tx,
      );

      return this._getRoom(room.id, tx);
    });
  }

  // ---------------------------------------------------------------------------
  // Join Room
  // ---------------------------------------------------------------------------

  async joinRoom({
    playerId,
    playerName,
    roomCode,
  }: JoinRoomParams): Promise<Room> {
    const room = await this.getRoomByCode(roomCode);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.roundStatus === RoomStatus.PLAYING) {
      throw new Error("Game is already in progress");
    }

    if (room.players.length >= GameConstants.maxPlayers) {
      throw new Error("Room is full");
    }

    if (
      room.players.some(
        (player) => player.id === playerId,
      )
    ) {
      throw new Error("Player is already in this room");
    }

    const hostPlayer = room.players.find(
      (player) => player.id === room.hostPlayerId,
    );

    if (!hostPlayer) {
      throw new Error("Room has no host player");
    }

    const guestSymbol =
      hostPlayer.symbol === "x" ? "o" : "x";

    return db.transaction(async (tx) => {
      await this._ensurePlayer(playerId, tx);

      await this._addRoomPlayer(
        {
          roomId: room.id,
          playerId,
          name: playerName,
          symbol: guestSymbol,
        },
        tx,
      );

      return this._getRoom(room.id, tx);
    });
  }

  // ---------------------------------------------------------------------------
  // Make Move
  // ---------------------------------------------------------------------------

  async makeMove({
    roomCode,
    index,
    playerId,
  }: MakeMoveParams): Promise<MoveResult> {
    const room =
      await this._requireRoomByCode(roomCode);

    if (room.roundStatus !== RoomStatus.PLAYING) {
      throw new Error("Round is not active");
    }

    if (
      index < 0 ||
      index >= GameConstants.totalCells
    ) {
      throw new Error("Invalid board position");
    }

    const player =
      this._getRoomPlayer(room, playerId);

    if (room.turnPlayerId !== player.id) {
      throw new Error("Not your turn");
    }

    const nextTurnIndex =
      room.turnIndex === 0 ? 1 : 0;

    const nextPlayer =
      room.players[nextTurnIndex];

    if (!nextPlayer) {
      throw new Error(
        "Unable to determine next player",
      );
    }

    await db
      .update(rooms)
      .set({
        turnIndex: nextTurnIndex,
        turnPlayerId: nextPlayer.id,
        updatedAt: new Date(),
      })
      .where(eq(rooms.id, room.id));

    return {
      index,
      playerId: player.id,
      symbol: player.symbol,
      turnPlayerId: nextPlayer.id,
      turnIndex: nextTurnIndex,
    };
  }

  // ---------------------------------------------------------------------------
  // Submit Game Result
  // ---------------------------------------------------------------------------

  async submitGameResult({
    roomCode,
    playerId,
    winningIndexes,
  }: SubmitGameResultParams): Promise<GameResult> {
    const room =
      await this._requireRoomByCode(roomCode);

    if (room.roundStatus !== RoomStatus.PLAYING) {
      throw new Error("Round is not active");
    }

    if (room.players.length !== GameConstants.maxPlayers) {
      throw new Error(
        `Exactly ${GameConstants.maxPlayers} players are required`,
      );
    }

    const submittingPlayer =
      this._getRoomPlayer(room, playerId);

    const isDraw = winningIndexes.length === 0;

    const winnerIndex = isDraw
      ? 0
      : room.players.findIndex(
        (player) => player.id === submittingPlayer.id,
      );

    if (!isDraw && winnerIndex === -1) {
      throw new Error("Winner not found");
    }

    const gameFinished =
      room.currentRound >= room.maxRounds;

    await db.transaction(async (tx) => {
      if (!isDraw) {
        await tx
          .update(roomPlayers)
          .set({
            points: sql`${roomPlayers.points} + 1`,
          })
          .where(
            and(
              eq(roomPlayers.roomId, room.id),
              eq(roomPlayers.playerId, submittingPlayer.id),
            ),
          );
      }

      await this._resetPlayersReady(
        room.id,
        tx,
      );

      await tx
        .update(rooms)
        .set({
          roundStatus: RoomStatus.RESULT,
          turnPlayerId: isDraw
            ? null
            : submittingPlayer.id,
          turnIndex: isDraw ? 0 : winnerIndex,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, room.id));
    });

    return {
      winnerId: isDraw
        ? null
        : submittingPlayer.id,
      roundStatus: RoomStatus.RESULT,
      winningIndexes,
      gameFinished,
    };
  }
  // ---------------------------------------------------------------------------
  // Get Room By ID
  // ---------------------------------------------------------------------------

  async getRoom(
    roomId: string,
  ): Promise<Room | null> {
    return this._getRoom(roomId, db);
  }

  // ---------------------------------------------------------------------------
  // Get Room By Code
  // ---------------------------------------------------------------------------

  async getRoomByCode(
    roomCode: string,
  ): Promise<Room | null> {
    const result = await db
      .select({
        room: rooms,
        roomPlayer: roomPlayers,
      })
      .from(rooms)
      .leftJoin(
        roomPlayers,
        eq(roomPlayers.roomId, rooms.id),
      )
      .where(
        eq(
          rooms.roomCode,
          roomCode.trim().toUpperCase(),
        ),
      );

    return this._mapRoomResult(result);
  }

  // ---------------------------------------------------------------------------
  // Get Rooms
  // ---------------------------------------------------------------------------

  async getRooms(): Promise<Room[]> {
    const result = await db
      .select({
        room: rooms,
        roomPlayer: roomPlayers,
      })
      .from(rooms)
      .leftJoin(
        roomPlayers,
        eq(roomPlayers.roomId, rooms.id),
      );

    return this._mapRooms(result);
  }

  // ---------------------------------------------------------------------------
  // Get Public Rooms
  // ---------------------------------------------------------------------------

  async getPublicRooms(): Promise<Room[]> {
    const result = await db
      .select({
        room: rooms,
        roomPlayer: roomPlayers,
      })
      .from(rooms)
      .leftJoin(
        roomPlayers,
        eq(roomPlayers.roomId, rooms.id),
      )
      .where(eq(rooms.isPrivate, false));

    return this._mapRooms(result);
  }

  // ---------------------------------------------------------------------------
  // Delete Room
  // ---------------------------------------------------------------------------

  async deleteRoom(
    roomId: string,
  ): Promise<boolean> {
    const [deletedRoom] = await db
      .delete(rooms)
      .where(eq(rooms.id, roomId))
      .returning({
        id: rooms.id,
      });

    return deletedRoom !== undefined;
  }

  // ---------------------------------------------------------------------------
  // Set Player Ready
  // ---------------------------------------------------------------------------

  async setPlayerReady(
    roomId: string,
    playerId: string,
    isReady: boolean,
  ): Promise<Room> {
    return db.transaction(async (tx) => {
      const room = await this._getRoom(roomId, tx);

      const player = room.players.find(
        (roomPlayer) => roomPlayer.id === playerId,
      );

      if (!player) {
        throw new Error(
          "Player is not a member of this room",
        );
      }

      if (player.isReady === isReady) {
        return room;
      }

      await tx
        .update(roomPlayers)
        .set({ isReady })
        .where(
          and(
            eq(roomPlayers.roomId, roomId),
            eq(roomPlayers.playerId, playerId),
          ),
        );

      return this._getRoom(roomId, tx);
    });
  }
  // ---------------------------------------------------------------------------
  // Start Round
  // ---------------------------------------------------------------------------
  async startRound(
    roomId: string,
    playerId: string,
  ): Promise<Room> {
    return db.transaction(async (tx) => {
      const room = await this._getRoom(roomId, tx);

      if (
        room.roundStatus !== RoomStatus.WAITING &&
        room.roundStatus !== RoomStatus.RESULT
      ) {
        throw new Error(
          "Round cannot be started in the current state",
        );
      }

      if (
        room.roundStatus === RoomStatus.WAITING &&
        room.hostPlayerId !== playerId
      ) {
        throw new Error(
          "Only the host can start the game",
        );
      }

      if (
        room.players.length !== GameConstants.maxPlayers
      ) {
        throw new Error(
          `Exactly ${GameConstants.maxPlayers} players are required to start the round`,
        );
      }

      if (!room.players.every((player) => player.isReady)) {
        throw new Error("Both players must be ready");
      }

      if (room.currentRound >= room.maxRounds) {
        throw new Error(
          "Maximum rounds have already been completed",
        );
      }

      const nextRound = room.currentRound + 1;

      await tx
        .update(rooms)
        .set({
          currentRound: nextRound,
          roundStatus: RoomStatus.PLAYING,
          turnPlayerId: room.hostPlayerId,
          turnIndex: 0,
          updatedAt: new Date(),
        })
        .where(eq(rooms.id, roomId));

      await tx
        .update(roomPlayers)
        .set({
          isReady: false,
        })
        .where(eq(roomPlayers.roomId, roomId));

      return this._getRoom(roomId, tx);
    });
  }
  // ---------------------------------------------------------------------------
  // Remove Player
  // ---------------------------------------------------------------------------

  async removePlayer(
    roomId: string,
    playerId: string,
  ): Promise<boolean> {
    const [deletedPlayer] = await db
      .delete(roomPlayers)
      .where(
        and(
          eq(roomPlayers.roomId, roomId),
          eq(roomPlayers.playerId, playerId),
        ),
      )
      .returning({
        id: roomPlayers.id,
      });

    return deletedPlayer !== undefined;
  }

  // ---------------------------------------------------------------------------
  // Private: Get Room By ID
  // ---------------------------------------------------------------------------

  private async _getRoom(
    roomId: string,
    database: Database,
  ): Promise<Room> {
    const result = await database
      .select({
        room: rooms,
        roomPlayer: roomPlayers,
      })
      .from(rooms)
      .leftJoin(
        roomPlayers,
        eq(roomPlayers.roomId, rooms.id),
      )
      .where(eq(rooms.id, roomId));

    const room =
      this._mapRoomResult(result);

    if (!room) {
      throw new Error("Room not found");
    }

    return room;
  }

  // ---------------------------------------------------------------------------
  // Private: Require Room By Code
  // ---------------------------------------------------------------------------

  private async _requireRoomByCode(
    roomCode: string,
  ): Promise<Room> {
    const room =
      await this.getRoomByCode(roomCode);

    if (!room) {
      throw new Error("Room not found");
    }

    return room;
  }

  // ---------------------------------------------------------------------------
  // Private: Map Rooms
  // ---------------------------------------------------------------------------

  private _mapRooms(
    result: Array<{
      room: typeof rooms.$inferSelect;
      roomPlayer:
      | typeof roomPlayers.$inferSelect
      | null;
    }>,
  ): Room[] {
    const groupedRooms = new Map<
      string,
      {
        room: typeof rooms.$inferSelect;
        players: Array<
          typeof roomPlayers.$inferSelect
        >;
      }
    >();

    for (const row of result) {
      const existing = groupedRooms.get(
        row.room.id,
      );

      if (existing) {
        if (row.roomPlayer) {
          existing.players.push(
            row.roomPlayer,
          );
        }

        continue;
      }

      groupedRooms.set(row.room.id, {
        room: row.room,
        players: row.roomPlayer
          ? [row.roomPlayer]
          : [],
      });
    }

    return Array.from(
      groupedRooms.values(),
    ).map(({ room, players }) =>
      this._mapRoom(room, players),
    );
  }

  // ---------------------------------------------------------------------------
  // Private: Map Query Result
  // ---------------------------------------------------------------------------

  private _mapRoomResult(
    result: Array<{
      room: typeof rooms.$inferSelect;
      roomPlayer:
      | typeof roomPlayers.$inferSelect
      | null;
    }>,
  ): Room | null {
    if (result.length === 0) {
      return null;
    }

    const first = result[0];

    if (!first) {
      return null;
    }

    const players = result
      .map((row) => row.roomPlayer)
      .filter(
        (
          player,
        ): player is typeof roomPlayers.$inferSelect =>
          player !== null,
      );

    return this._mapRoom(
      first.room,
      players,
    );
  }

  // ---------------------------------------------------------------------------
  // Private: Ensure Player
  // ---------------------------------------------------------------------------

  private async _ensurePlayer(
    playerId: string,
    database: Database,
  ): Promise<void> {
    await database
      .insert(players)
      .values({
        id: playerId,
      })
      .onConflictDoNothing({
        target: players.id,
      });
  }

  // ---------------------------------------------------------------------------
  // Private: Add Room Player
  // ---------------------------------------------------------------------------

  private async _addRoomPlayer(
    {
      roomId,
      playerId,
      name,
      symbol,
    }: AddRoomPlayerParams,
    database: Database,
  ): Promise<void> {
    await database
      .insert(roomPlayers)
      .values({
        roomId,
        playerId,
        name,
        symbol,
        points: 0,
        isReady: true,
      });
  }

  // ---------------------------------------------------------------------------
  // Private: Get Room Player
  // ---------------------------------------------------------------------------

  private _getRoomPlayer(
    room: Room,
    playerId: string,
  ): RoomPlayer {
    const player = room.players.find(
      (roomPlayer) =>
        roomPlayer.id === playerId,
    );

    if (!player) {
      throw new Error(
        "Player is not part of this room",
      );
    }

    return player;
  }

  // ---------------------------------------------------------------------------
  // Private: Reset Players Ready
  // ---------------------------------------------------------------------------

  private async _resetPlayersReady(
    roomId: string,
    database: Database,
  ): Promise<void> {
    await database
      .update(roomPlayers)
      .set({
        isReady: false,
      })
      .where(
        eq(roomPlayers.roomId, roomId),
      );
  }

  // ---------------------------------------------------------------------------
  // Private: Build Game Result
  // ---------------------------------------------------------------------------

  // private async _buildGameResult(
  //   // roomId: string,
  //   winnerPlayerId: string | null,
  //   winningIndexes: number[],
  //   completedRound: number,
  //   maxRounds: number,
  // ): Promise<GameResult> {
  //   // const room =
  //   //   await this._getRoom(roomId, db);

  //   return {
  //     // room,
  //     winnerPlayerId,
  //     winningIndexes,
  //     completedRound,
  //     gameFinished:
  //       completedRound >= maxRounds,
  //   };
  // }

  // ---------------------------------------------------------------------------
  // Private: Map Room
  // ---------------------------------------------------------------------------

  private _mapRoom(
    room: typeof rooms.$inferSelect,
    playerRows: Array<
      typeof roomPlayers.$inferSelect
    >,
  ): Room {
    const players: RoomPlayer[] =
      playerRows.map((player) => ({
        id: player.playerId,
        name: player.name,
        symbol: player.symbol,
        points: player.points,
        isReady: player.isReady,
      }));

    return {
      id: room.id,
      roomCode: room.roomCode,
      isPrivate: room.isPrivate,
      hostPlayerId: room.hostPlayerId,
      theme: room.theme,

      maxRounds: room.maxRounds,
      currentRound: room.currentRound,
      roundStatus: room.roundStatus,
      turnPlayerId: room.turnPlayerId,
      turnIndex: room.turnIndex,

      players,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // Private: Generate Unique Room Code
  // ---------------------------------------------------------------------------

  private async _generateUniqueRoomCode(): Promise<string> {
    const maxAttempts = 10;

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {
      const roomCode =
        this._generateRoomCode();

      const [existingRoom] = await db
        .select({
          id: rooms.id,
        })
        .from(rooms)
        .where(
          eq(rooms.roomCode, roomCode),
        )
        .limit(1);

      if (!existingRoom) {
        return roomCode;
      }
    }

    throw new Error(
      "Unable to generate a unique room code. Please try again.",
    );
  }

  // ---------------------------------------------------------------------------
  // Private: Generate Room Code
  // ---------------------------------------------------------------------------

  private _generateRoomCode(): string {
    const { roomCodeLength, roomCodeCharacters } =
      GameConstants;

    return Array.from(
      { length: roomCodeLength },
      () =>
        roomCodeCharacters[
        Math.floor(
          Math.random() * roomCodeCharacters.length,
        )
        ],
    ).join("");
  }
}

export default new RoomService();