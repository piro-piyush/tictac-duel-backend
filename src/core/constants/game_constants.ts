const BOARD_SIZE = 3;

export const GameConstants = {
    // ===========================================================================
    // Game
    // ===========================================================================

    boardSize: BOARD_SIZE,
    totalCells: BOARD_SIZE * BOARD_SIZE,

    roundOptions: [3, 5, 7] as const,
    defaultRounds: 5,

    // ===========================================================================
    // Room
    // ===========================================================================

    maxPlayers: 2,
    roomCodeLength: 6,
    roomCodeCharacters: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',

    roomExpiryHours: 24,

    // ===========================================================================
    // Player
    // ===========================================================================

    minPlayerNameLength: 2,
    maxPlayerNameLength: 20,
} as const;

export const RoomCodePattern = new RegExp(
    `^[${GameConstants.roomCodeCharacters}]{${GameConstants.roomCodeLength}}$`,
);