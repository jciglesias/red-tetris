export declare const BOARD_WIDTH = 10;
export declare const BOARD_HEIGHT = 20;
export declare const VISIBLE_HEIGHT = 20;
export declare enum PieceType {
    I = "I",
    O = "O",
    T = "T",
    S = "S",
    Z = "Z",
    J = "J",
    L = "L"
}
export declare enum GameState {
    WAITING = "WAITING",
    PLAYING = "PLAYING",
    PAUSED = "PAUSED",
    FINISHED = "FINISHED"
}
export declare enum PlayerState {
    WAITING = "WAITING",
    PLAYING = "PLAYING",
    GAME_OVER = "GAME_OVER"
}
export declare enum SocketEvents {
    CONNECT = "connect",
    DISCONNECT = "disconnect",
    JOIN_ROOM = "join_room",
    LEAVE_ROOM = "leave_room",
    ROOM_JOINED = "room_joined",
    ROOM_LEFT = "room_left",
    ROOM_UPDATE = "room_update",
    START_GAME = "start_game",
    GAME_STARTED = "game_started",
    GAME_OVER = "game_over",
    RESTART_GAME = "restart_game",
    MOVE_PIECE = "move_piece",
    ROTATE_PIECE = "rotate_piece",
    DROP_PIECE = "drop_piece",
    HARD_DROP = "hard_drop",
    PIECE_PLACED = "piece_placed",
    LINES_CLEARED = "lines_cleared",
    PENALTY_LINES = "penalty_lines",
    BOARD_UPDATE = "board_update",
    SPECTRUM_UPDATE = "spectrum_update",
    NEXT_PIECE = "next_piece",
    PLAYER_UPDATE = "player_update",
    ERROR = "error"
}
export declare enum MoveDirection {
    LEFT = "LEFT",
    RIGHT = "RIGHT",
    DOWN = "DOWN"
}
export declare enum RotationDirection {
    CLOCKWISE = "CLOCKWISE",
    COUNTERCLOCKWISE = "COUNTERCLOCKWISE"
}
