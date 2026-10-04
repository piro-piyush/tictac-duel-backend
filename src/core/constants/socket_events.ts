export const ROOM_SOCKET_EVENTS = {
    CONNECT_ROOM: "connect_room",
    ROOM_CONNECTED: "room_connected",

    PLAYER_JOINED: "player_joined",
    PLAYER_LEFT: "player_left",

    START_GAME: "start_game",
    ROUND_STARTED: "round_started",


    SET_READY: "set_ready",
    READY_UPDATED: "ready_updated",

    MAKE_MOVE: "make_move",
    MOVE_MADE: "move_made",

    SUBMIT_GAME_RESULT: "submit_game_result",
    ROUND_RESULT: "round_result",
    GAME_DISMISSED: "game_dismissed",
    ROOM_CLOSED: "room_closed",
    ROOM_ERROR: "room_error",
    QUIT_GAME: "quit_game",

} as const;

export const SOCKET_EVENTS = {
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    ERROR: "error",
} as const;