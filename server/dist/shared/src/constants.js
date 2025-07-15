"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RotationDirection = exports.MoveDirection = exports.SocketEvents = exports.PlayerState = exports.GameState = exports.PieceType = exports.VISIBLE_HEIGHT = exports.BOARD_HEIGHT = exports.BOARD_WIDTH = void 0;
exports.BOARD_WIDTH = 10;
exports.BOARD_HEIGHT = 20;
exports.VISIBLE_HEIGHT = 20;
var PieceType;
(function (PieceType) {
    PieceType["I"] = "I";
    PieceType["O"] = "O";
    PieceType["T"] = "T";
    PieceType["S"] = "S";
    PieceType["Z"] = "Z";
    PieceType["J"] = "J";
    PieceType["L"] = "L";
})(PieceType || (exports.PieceType = PieceType = {}));
var GameState;
(function (GameState) {
    GameState["WAITING"] = "WAITING";
    GameState["PLAYING"] = "PLAYING";
    GameState["PAUSED"] = "PAUSED";
    GameState["FINISHED"] = "FINISHED";
})(GameState || (exports.GameState = GameState = {}));
var PlayerState;
(function (PlayerState) {
    PlayerState["WAITING"] = "WAITING";
    PlayerState["PLAYING"] = "PLAYING";
    PlayerState["GAME_OVER"] = "GAME_OVER";
})(PlayerState || (exports.PlayerState = PlayerState = {}));
var SocketEvents;
(function (SocketEvents) {
    SocketEvents["CONNECT"] = "connect";
    SocketEvents["DISCONNECT"] = "disconnect";
    SocketEvents["JOIN_ROOM"] = "join_room";
    SocketEvents["LEAVE_ROOM"] = "leave_room";
    SocketEvents["ROOM_JOINED"] = "room_joined";
    SocketEvents["ROOM_LEFT"] = "room_left";
    SocketEvents["ROOM_UPDATE"] = "room_update";
    SocketEvents["START_GAME"] = "start_game";
    SocketEvents["GAME_STARTED"] = "game_started";
    SocketEvents["GAME_OVER"] = "game_over";
    SocketEvents["RESTART_GAME"] = "restart_game";
    SocketEvents["MOVE_PIECE"] = "move_piece";
    SocketEvents["ROTATE_PIECE"] = "rotate_piece";
    SocketEvents["DROP_PIECE"] = "drop_piece";
    SocketEvents["HARD_DROP"] = "hard_drop";
    SocketEvents["PIECE_PLACED"] = "piece_placed";
    SocketEvents["LINES_CLEARED"] = "lines_cleared";
    SocketEvents["PENALTY_LINES"] = "penalty_lines";
    SocketEvents["BOARD_UPDATE"] = "board_update";
    SocketEvents["SPECTRUM_UPDATE"] = "spectrum_update";
    SocketEvents["NEXT_PIECE"] = "next_piece";
    SocketEvents["PLAYER_UPDATE"] = "player_update";
    SocketEvents["ERROR"] = "error";
})(SocketEvents || (exports.SocketEvents = SocketEvents = {}));
var MoveDirection;
(function (MoveDirection) {
    MoveDirection["LEFT"] = "LEFT";
    MoveDirection["RIGHT"] = "RIGHT";
    MoveDirection["DOWN"] = "DOWN";
})(MoveDirection || (exports.MoveDirection = MoveDirection = {}));
var RotationDirection;
(function (RotationDirection) {
    RotationDirection["CLOCKWISE"] = "CLOCKWISE";
    RotationDirection["COUNTERCLOCKWISE"] = "COUNTERCLOCKWISE";
})(RotationDirection || (exports.RotationDirection = RotationDirection = {}));
//# sourceMappingURL=constants.js.map