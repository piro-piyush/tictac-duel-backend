import { z } from "zod";

import { GameConstants, RoomCodePattern } from "../core/constants/game_constants.js";
import {
    playerSymbolEnum,
    roomStatusEnum,
    roomThemeEnum,
} from "../db/schema.js";

// -----------------------------------------------------------------------------
// Common Constants
// -----------------------------------------------------------------------------

export const GameDismissReason = {
    OPPONENT_DISCONNECTED: "opponentDisconnected",
    OPPONENT_QUIT: "opponentQuit",
} as const;

export type GameDismissReason =
    (typeof GameDismissReason)[keyof typeof GameDismissReason];

// -----------------------------------------------------------------------------
// Common Validators
// -----------------------------------------------------------------------------

export const uuidValidator = z.uuid();

export const playerIdValidator = uuidValidator;

export const playerSymbolValidator = z.enum(
    playerSymbolEnum.enumValues,
);

export const roomThemeValidator = z.enum(
    roomThemeEnum.enumValues,
);

export const roomStatusValidator = z.enum(
    roomStatusEnum.enumValues,
);

export const gameDismissReasonValidator = z.enum(
    Object.values(GameDismissReason),
);

export const playerNameValidator = z
    .string()
    .trim()
    .min(
        GameConstants.minPlayerNameLength,
        `Player name must be at least ${GameConstants.minPlayerNameLength} characters`,
    )
    .max(
        GameConstants.maxPlayerNameLength,
        `Player name must not exceed ${GameConstants.maxPlayerNameLength} characters`,
    );

export const roomCodeValidator = z
    .string()
    .trim()
    .toUpperCase()
    .regex(
        RoomCodePattern,
        "Invalid room code",
    );

export const roundsValidator = z
    .number()
    .int("Maximum rounds must be an integer")
    .refine(
        (rounds) =>
            GameConstants.roundOptions.includes(
                rounds as (typeof GameConstants.roundOptions)[number],
            ),
        `Rounds must be one of ${GameConstants.roundOptions.join(", ")}`,
    );

// -----------------------------------------------------------------------------
// Socket Validators
// -----------------------------------------------------------------------------

export const connectRoomValidator = z.object({
    roomCode: roomCodeValidator,
    playerId: playerIdValidator,
});

// -----------------------------------------------------------------------------
// Request Validators
// -----------------------------------------------------------------------------

export const createRoomValidator = z.object({
    playerId: playerIdValidator,
    playerName: playerNameValidator,
    symbol: playerSymbolValidator,
    theme: roomThemeValidator,
    maxRounds: roundsValidator,
    isPrivate: z.boolean(),
});

export const joinRoomValidator = z.object({
    playerId: playerIdValidator,
    playerName: playerNameValidator,
    roomCode: roomCodeValidator,
});

export const makeMoveValidator = z.object({
    roomCode: roomCodeValidator,
    index: z
        .number()
        .int("Move index must be an integer")
        .nonnegative("Move index cannot be negative")
        .max(
            GameConstants.totalCells - 1,
            "Move index is outside the board",
        ),
    playerId: playerIdValidator,
});

export const submitGameResultValidator = z.object({
    roomCode: roomCodeValidator,
    winningIndexes: z.array(
        z
            .number()
            .int("Winning index must be an integer")
            .nonnegative("Winning index cannot be negative")
            .max(
                GameConstants.totalCells - 1,
                "Winning index is outside the board",
            ),
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
    points: z.number().int().nonnegative(),
    isReady: z.boolean(),
});

export const roomModel = z.object({
    id: uuidValidator,
    roomCode: roomCodeValidator,
    isPrivate: z.boolean(),
    hostPlayerId: playerIdValidator,
    theme: roomThemeValidator,
    maxRounds: roundsValidator,
    currentRound: z.number().int().nonnegative(),
    roundStatus: roomStatusValidator,
    turnPlayerId: playerIdValidator.nullable(),
    turnIndex: z
        .number()
        .int()
        .nonnegative(),
    players: z.array(roomPlayerModel),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const moveResultModel = z.object({
    index: z
        .number()
        .int()
        .nonnegative()
        .max(GameConstants.totalCells - 1),
    playerId: playerIdValidator,
    symbol: playerSymbolValidator,
    turnPlayerId: playerIdValidator,
    turnIndex: z.number().int().nonnegative(),
});

export const gameResultModel = z.object({
    winnerId: playerIdValidator.nullable(),

    roundStatus: roomStatusValidator.nullable(),

    winningIndexes: z.array(
        z
            .number()
            .int()
            .nonnegative()
            .max(GameConstants.totalCells - 1),
    ),

    gameFinished: z.boolean(),

    turnPlayerId: playerIdValidator,

    turnIndex: z.number().int().nonnegative(),
});

export const roundStartedResponseModel = z.object({
    room: roomModel,
    playerOneReady: z.boolean(),
    playerTwoReady: z.boolean(),
    turnPlayerId: playerIdValidator,
    turnIndex: z.number().int().nonnegative(),
});

export const gameDismissedResponseModel = z.object({
    winnerPlayerId: playerIdValidator,
    disconnectedPlayerId: playerIdValidator,
    reason: gameDismissReasonValidator,
});

// -----------------------------------------------------------------------------
// Response Types
// -----------------------------------------------------------------------------

export type RoundStartedResponse = z.infer<
    typeof roundStartedResponseModel
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

export type GameDismissedResponse = z.infer<
    typeof gameDismissedResponseModel
>;

// -----------------------------------------------------------------------------
// Request Types
// -----------------------------------------------------------------------------

export type ConnectRoomParams = z.infer<
    typeof connectRoomValidator
>;

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