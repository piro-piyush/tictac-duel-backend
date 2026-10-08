
export const ROOM_SOCKET_EVENTS = {
    CREATE_ROOM: "create_room",
    ROOM_CREATED: "room_created",

    JOIN_ROOM: "join_room",
    ROOM_JOINED: "room_joined",

    PLAYER_JOINED: "player_joined",
    PLAYER_LEFT: "player_left",

    START_GAME: 'start_game',
    QUIT_GAME: "quit_game",

    SET_READY: "set_ready",
    READY_UPDATED: "ready_updated",

    MAKE_MOVE: "make_move",
    MOVE_MADE: "move_made",

    SUBMIT_GAME_RESULT: 'submit_game_result',
    ROUND_STARTED: "round_started",
    ROUND_RESULT: "round_result",




    SEND_REACTION: "send_reaction",
    REACTION_RECEIVED: "reaction_received",

    ROOM_CLOSED: "room_closed",
    GAME_DISMISSED: "game_dismissed",

    ROOM_ERROR: "room_error",
    Game_ERROR: "game_error",
} as const;

export const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
} as const;
