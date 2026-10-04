import type {
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";

import {
  players,
  roomPlayers,
  rooms,
} from "./schema.js";

// -----------------------------------------------------------------------------
// Player
// -----------------------------------------------------------------------------

export type Player = InferSelectModel<typeof players>;

export type NewPlayer = InferInsertModel<typeof players>;

// -----------------------------------------------------------------------------
// Room
// -----------------------------------------------------------------------------

export type Room = InferSelectModel<typeof rooms>;

export type NewRoom = InferInsertModel<typeof rooms>;

// -----------------------------------------------------------------------------
// Room Player
// -----------------------------------------------------------------------------

export type RoomPlayer =
  InferSelectModel<typeof roomPlayers>;

export type NewRoomPlayer =
  InferInsertModel<typeof roomPlayers>;