
export const ROOM_SOCKET_EVENTS = {
    CREATE_ROOM: "create_room",
    ROOM_CREATED: "room_created",

    JOIN_ROOM: "join_room",
    ROOM_CONNECTED: "room_connected",

    PLAYER_JOINED: "player_joined",
    PLAYER_LEFT: "player_left",

    START_GAME: 'start_game',
    SET_READY: "set_ready",
    READY_UPDATED: "ready_updated",

    ROUND_STARTED: "round_started",

    MAKE_MOVE: "make_move",
    MOVE_MADE: "move_made",

    SUBMIT_GAME_RESULT: 'submit_game_result',
    ROUND_RESULT: "round_result",

    QUIT_GAME: "quit_game",
    GAME_DISMISSED: "game_dismissed",

    SEND_REACTION: "send_reaction",
    REACTION_RECEIVED: "reaction_received",

    ROOM_CLOSED: "room_closed",
    ROOM_ERROR: "room_error",
} as const;

export const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
} as const;
