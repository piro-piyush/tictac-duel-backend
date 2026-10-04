import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { GameConstants } from "../core/constants/game_constants.js";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export const PlayerSymbol = {
  X: "x",
  O: "o",
} as const;

export const RoomTheme = {
  CLASSIC: "classic",
  INFERNO: "inferno",
  CYBER: "cyber",
} as const;

export const RoomStatus = {
  WAITING: "waiting",
  PLAYING: "playing",
  RESULT: "result",
} as const;

export const playerSymbolEnum = pgEnum("player_symbol", [
  PlayerSymbol.X,
  PlayerSymbol.O,
]);

export const roomThemeEnum = pgEnum("room_theme", [
  RoomTheme.CLASSIC,
  RoomTheme.INFERNO,
  RoomTheme.CYBER,
]);

export const roomStatusEnum = pgEnum("room_status", [
  RoomStatus.WAITING,
  RoomStatus.PLAYING,
  RoomStatus.RESULT,
]);

// ─────────────────────────────────────────────
// TypeScript Types
// ─────────────────────────────────────────────

export type PlayerSymbol =
  (typeof PlayerSymbol)[keyof typeof PlayerSymbol];

export type RoomTheme =
  (typeof RoomTheme)[keyof typeof RoomTheme];

export type RoomStatus =
  (typeof RoomStatus)[keyof typeof RoomStatus];

// ─────────────────────────────────────────────
// Players
// ─────────────────────────────────────────────

export const players = pgTable("players", {
  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// ─────────────────────────────────────────────
// Rooms
// ─────────────────────────────────────────────

export const rooms = pgTable("rooms", {
  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  roomCode: varchar("room_code", {
    length: GameConstants.roomCodeLength,
  })
    .notNull()
    .unique(),

  isPrivate: boolean("is_private")
    .notNull()
    .default(true),

  hostPlayerId: uuid("host_player_id")
    .notNull()
    .references(() => players.id),

  theme: roomThemeEnum("theme")
    .notNull(),


  maxRounds: integer("max_rounds")
    .notNull()
    .default(GameConstants.roundOptions[1]),

  currentRound: integer("current_round")
    .notNull()
    .default(0),

  roundStatus: roomStatusEnum("round_status")
    .notNull()
    .default(RoomStatus.WAITING),

  turnPlayerId: uuid("turn_player_id")
    .references(() => players.id),

  turnIndex: integer("turn_index")
    .notNull()
    .default(0),



  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

// ─────────────────────────────────────────────
// Room Players
// ─────────────────────────────────────────────

export const roomPlayers = pgTable(
  "room_players",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, {
        onDelete: "cascade",
      }),

    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: GameConstants.maxPlayerNameLength,
    })
      .notNull(),

    symbol: playerSymbolEnum("symbol")
      .notNull(),

    points: integer("points")
      .notNull()
      .default(0),

    isReady: boolean("is_ready")
      .notNull()
      .default(true),

    joinedAt: timestamp("joined_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("room_players_room_player_unique").on(
      table.roomId,
      table.playerId,
    ),
  ],
);