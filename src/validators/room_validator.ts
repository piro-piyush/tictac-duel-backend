import { z } from "zod";
import {
    playerSymbolEnum,
    roomStatusEnum,
    roomThemeEnum,
} from "../db/schema.js";

// -----------------------------------------------------------------------------
// Common Validators
// -----------------------------------------------------------------------------

export const uuidValidator = z.uuid();

export const playerSymbolValidator = z.enum(
    playerSymbolEnum.enumValues,
);

export const roomThemeValidator = z.enum(
    roomThemeEnum.enumValues,
);

export const roomStatusValidator = z.enum(
    roomStatusEnum.enumValues,
);

export const playerIdValidator = uuidValidator;

export const roomCodeValidator = z
    .string()
    .trim()
    .toUpperCase()
    .length(6, "Room code must be 6 characters");

// -----------------------------------------------------------------------------
// Socket Validators
// -----------------------------------------------------------------------------

export const connectRoomValidator = z.object({
    roomCode: roomCodeValidator,
    playerId: playerIdValidator,
});

export type ConnectRoomParams = z.infer<
    typeof connectRoomValidator
>;

// -----------------------------------------------------------------------------
// Request Validators
// -----------------------------------------------------------------------------

export const createRoomValidator = z.object({
    playerId: playerIdValidator,

    playerName: z
        .string()
        .trim()
        .min(2, "Player name must be at least 2 characters")
        .max(20, "Player name must not exceed 20 characters"),

    symbol: playerSymbolValidator,
    theme: roomThemeValidator,

    maxRounds: z
        .number()
        .int("Maximum rounds must be an integer")
        .positive("Maximum rounds must be greater than 0"),

    isPrivate: z.boolean(),
});

export const joinRoomValidator = z.object({
    playerId: playerIdValidator,

    playerName: z
        .string()
        .trim()
        .min(2, "Player name must be at least 2 characters")
        .max(20, "Player name must not exceed 20 characters"),

    roomCode: roomCodeValidator,
});

export const makeMoveValidator = z.object({
    roomCode: roomCodeValidator,
    index: z
        .number()
        .int("Move index must be an integer")
        .nonnegative("Move index cannot be negative"),
    playerId: playerIdValidator,
});

export const submitGameResultValidator = z.object({
    roomCode: roomCodeValidator,
    winnerPlayerId: playerIdValidator.nullable(),
    winningIndexes: z.array(
        z.number().int().nonnegative(),
    ),
    playerId: playerIdValidator,
});

export const setPlayerReadyValidator = z.object({
    roomCode: roomCodeValidator,
    playerId: playerIdValidator,
});

// -----------------------------------------------------------------------------
// Response Models
// -----------------------------------------------------------------------------

export const roomPlayerModel = z.object({
    id: playerIdValidator,
    name: z.string(),
    symbol: playerSymbolValidator,
    points: z.number(),
    isReady: z.boolean(),
});

export const roomModel = z.object({
    id: uuidValidator,
    roomCode: z.string(),
    isPrivate: z.boolean(),
    hostPlayerId: playerIdValidator,
    theme: roomThemeValidator,
    maxPlayers: z.number(),
    maxRounds: z.number(),
    currentRound: z.number(),
    roundStatus: roomStatusValidator,
    turnPlayerId: playerIdValidator.nullable(),
    turnIndex: z.number(),
    boardSize: z.number(),
    players: z.array(roomPlayerModel),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const moveResultModel = z.object({
    room: roomModel,

    move: z.object({
        index: z.number(),
        symbol: playerSymbolValidator,
    }),
});

export const gameResultModel = z.object({
    room: roomModel,
    winnerPlayerId: playerIdValidator.nullable(),
    winningIndexes: z.array(
        z.number().int().nonnegative(),
    ),
    completedRound: z.number(),
    gameFinished: z.boolean(),
});

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type CreateRoomParams = z.infer<
    typeof createRoomValidator
>;

export type JoinRoomParams = z.infer<
    typeof joinRoomValidator
>;

export type MakeMoveParams = z.infer<
    typeof makeMoveValidator
>;

export type SubmitGameResultParams = z.infer<
    typeof submitGameResultValidator
>;

export type SetPlayerReadyParams = z.infer<
    typeof setPlayerReadyValidator
>;

export type RoomPlayer = z.infer<
    typeof roomPlayerModel
>;

export type Room = z.infer<
    typeof roomModel
>;

export type MoveResult = z.infer<
    typeof moveResultModel
>;

export type GameResult = z.infer<
    typeof gameResultModel
>;