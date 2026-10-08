
import { z } from "zod";
import {
    GameConstants,
    RoomCodePattern,
} from "../core/constants/game_constants.js";
import {
    PlayerSymbol,
    RoomStatus,
    RoomTheme,
} from "../types/room.js";

export const GameDismissReason = {
    OPPONENT_DISCONNECTED: "opponentDisconnected",
    OPPONENT_QUIT: "opponentQuit",
} as const;

export type GameDismissReason =
    (typeof GameDismissReason)[keyof typeof GameDismissReason];

export const GameReaction = {
    LAUGH: "laugh",
    LOVE: "love",
    ANGRY: "angry",
    WOW: "wow",
    FIRE: "fire",
    CLAP: "clap",
    PARTY: "party",
    COOL: "cool",
} as const;

export type GameReaction =
    (typeof GameReaction)[keyof typeof GameReaction];

export const playerSymbolValidator = z.enum(
    Object.values(PlayerSymbol) as [
        PlayerSymbol,
        ...PlayerSymbol[],
    ],
);

export const roomThemeValidator = z.enum(
    Object.values(RoomTheme) as [
        RoomTheme,
        ...RoomTheme[],
    ],
);

export const roomStatusValidator = z.enum(
    Object.values(RoomStatus) as [
        RoomStatus,
        ...RoomStatus[],
    ],
);

export const gameDismissReasonValidator = z.enum(
    Object.values(GameDismissReason) as [
        GameDismissReason,
        ...GameDismissReason[],
    ],
);

export const gameReactionValidator = z.enum(
    Object.values(GameReaction) as [
        GameReaction,
        ...GameReaction[],
    ],
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
    .regex(RoomCodePattern, "Invalid room code");

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

export const createRoomValidator = z.object({
    name: playerNameValidator,
    symbol: playerSymbolValidator,
    maxRounds: roundsValidator,
    theme: roomThemeValidator,
    isPrivate: z.boolean(),
});
export const joinRoomValidator = z.object({
    roomCode: roomCodeValidator,
    name: playerNameValidator,
});

export const makeMoveValidator = z.object({
    index: z
        .number()
        .int("Move index must be an integer")
        .nonnegative("Move index cannot be negative")
        .max(
            GameConstants.totalCells - 1,
            "Move index is outside the board",
        ),
});

export const setPlayerReadyValidator = z.object({

});

export const sendReactionValidator = z.object({

    reaction: gameReactionValidator,
});

export const submitGameResultValidator = z.object({
    winningIndexes: z
        .array(z.number().int())
        .max(
            GameConstants.boardSize,
            "Winning indexes cannot exceed the board size",
        ),
});

export type CreateRoomParams = z.infer<
    typeof createRoomValidator
>;

export type JoinRoomParams = z.infer<
    typeof joinRoomValidator
>;

export type MakeMoveParams = z.infer<
    typeof makeMoveValidator
>;

export type SetPlayerReadyParams = z.infer<
    typeof setPlayerReadyValidator
>;

export type SubmitGameResultParams = z.infer<
    typeof submitGameResultValidator
>;
