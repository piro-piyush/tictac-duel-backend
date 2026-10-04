export const GameConstants = {
    // ─────────────────────────────────────────────────────────────
    // Game
    // ─────────────────────────────────────────────────────────────

    boardSize: 3,

    get totalCells() {
        return this.boardSize * this.boardSize;
    },

    roundOptions: [3, 5, 7] as const,
    defaultRounds: 5,

    // ─────────────────────────────────────────────────────────────
    // Room
    // ─────────────────────────────────────────────────────────────

    maxPlayers: 2,

    roomCodeLength: 6,

    roomCodeCharacters:
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",

    get roomCodePattern() {
        return new RegExp(
            `^[${this.roomCodeCharacters}]{${this.roomCodeLength}}$`,
        );
    },

    roomExpiryHours: 24,

    // ─────────────────────────────────────────────────────────────
    // Player
    // ─────────────────────────────────────────────────────────────

    minPlayerNameLength: 2,
    maxPlayerNameLength: 20,
} as const;