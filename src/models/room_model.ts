import type {
  PlayerSymbol,
  RoomStatus,
  RoomTheme,
} from "../db/schema.js";

export type UUID = string;

export interface PlayerModel {
  id: UUID;
  name: string;
  symbol: PlayerSymbol;
  points: number;
  isReady: boolean;
}

export interface RoomModel {
  id: UUID;
  roomCode: string;
  isPrivate: boolean;
  hostPlayerId: UUID;
  theme: RoomTheme;
  maxPlayers: number;
  maxRounds: number;
  currentRound: number;
  roundStatus: RoomStatus;
  turnPlayerId: UUID | null;
  turnIndex: number;
  boardSize: number;
  players: PlayerModel[];
  createdAt: Date;
  updatedAt: Date;
}