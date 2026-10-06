
export const PlayerSymbol = {
  X: "x",
  O: "o",
} as const;

export type PlayerSymbol =
  (typeof PlayerSymbol)[keyof typeof PlayerSymbol];

export const RoomTheme = {
  CLASSIC: "classic",
  INFERNO: "inferno",
  CYBER: "cyber",
} as const;

export type RoomTheme =
  (typeof RoomTheme)[keyof typeof RoomTheme];

export const RoomStatus = {
  WAITING: "waiting",
  PLAYING: "playing",
  ROUND_RESULT: "roundResult",
  FINISHED: "finished",
} as const;

export type RoomStatus =
  (typeof RoomStatus)[keyof typeof RoomStatus];

export type RoomPlayer = {
  id: string;
  name: string;
  symbol: PlayerSymbol;
  points: number;
  isReady: boolean;
};

export type Room = {
  roomCode: string;
  host: RoomPlayer;
  guest: RoomPlayer | null;

  turnSocketId: string | null;
  currentRound: number;
  maxRounds: number;
  roundStatus: RoomStatus;
  theme: RoomTheme;
  isPrivate: boolean;
};

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
