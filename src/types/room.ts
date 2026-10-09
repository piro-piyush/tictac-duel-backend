
// =============================================================================
// PLAYER SYMBOL
// =============================================================================

export const PlayerSymbol = {
  X: "x",
  O: "o",
} as const;

export type PlayerSymbol =
  (typeof PlayerSymbol)[keyof typeof PlayerSymbol];

// =============================================================================
// ROOM THEME
// =============================================================================

export const RoomTheme = {
  CLASSIC: "classic",
  INFERNO: "inferno",
  CYBER: "cyber",
} as const;

export type RoomTheme =
  (typeof RoomTheme)[keyof typeof RoomTheme];

// =============================================================================
// ROOM STATUS
// =============================================================================

export const RoomStatus = {
  WAITING: "waiting",
  PLAYING: "playing",
  RESULT: "result",
  FINISHED: "finished",
} as const;

export type RoomStatus =
  (typeof RoomStatus)[keyof typeof RoomStatus];

// =============================================================================
// ROOM MODELS
// =============================================================================

export type RoomPlayer = {
  id: string;
  name: string;
  symbol: PlayerSymbol;
};

export type Room = {
  roomCode: string;

  host: RoomPlayer;
  guest: RoomPlayer | null;

  hostPoints: number;
  guestPoints: number;

  hostReady: boolean;
  guestReady: boolean;

  turnPlayerId: string | null;
  nextTurnPlayerId: string | null;

  currentRound: number;
  maxRounds: number;

  status: RoomStatus;
  theme: RoomTheme;
  isPrivate: boolean;
};

// =============================================================================
// ROOM REQUEST DATA
// =============================================================================

export type CreateRoomData = {
  name: string;
  symbol: PlayerSymbol;
  maxRounds: number;
  theme: RoomTheme;
  isPrivate: boolean;
};

export type JoinRoomData = {
  roomCode: string;
  name: string;
};

// =============================================================================
// GAME RESULT
// =============================================================================

export type GameResult = {
  winnerId: string | null;
  status: RoomStatus;
  winningIndexes: number[];
  gameFinished: boolean;
};

// =============================================================================
// MOVE RESULT
// =============================================================================

export type MoveResult = {
  index: number;
  playerId: string;
  turnPlayerId: string | null;
};
