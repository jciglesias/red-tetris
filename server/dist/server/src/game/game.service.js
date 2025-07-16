"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@red-tetris/shared");
const piece_service_1 = require("./piece.service");
const player_service_1 = require("./player.service");
let GameService = class GameService {
    pieceService;
    playerService;
    constructor(pieceService, playerService) {
        this.pieceService = pieceService;
        this.playerService = playerService;
    }
    canMovePiece(board, piece, direction) {
        let dx = 0, dy = 0;
        switch (direction) {
            case shared_1.MoveDirection.LEFT:
                dx = -1;
                break;
            case shared_1.MoveDirection.RIGHT:
                dx = 1;
                break;
            case shared_1.MoveDirection.DOWN:
                dy = 1;
                break;
        }
        const newPosition = {
            x: piece.position.x + dx,
            y: piece.position.y + dy,
        };
        return (0, shared_1.isValidPosition)(board, piece.shape, newPosition);
    }
    canRotatePiece(board, piece, clockwise = true) {
        const rotatedPiece = this.pieceService.rotatePiece(piece, clockwise);
        return (0, shared_1.isValidPosition)(board, rotatedPiece.shape, rotatedPiece.position);
    }
    dropPieceToBottom(board, piece) {
        let droppedPiece = { ...piece };
        while (this.canMovePiece(board, droppedPiece, shared_1.MoveDirection.DOWN)) {
            droppedPiece = this.pieceService.movePiece(droppedPiece, 0, 1);
        }
        return droppedPiece;
    }
    calculateGhostPiece(board, piece) {
        return this.dropPieceToBottom(board, piece);
    }
    isPieceAtBottom(board, piece) {
        return !this.canMovePiece(board, piece, shared_1.MoveDirection.DOWN);
    }
    getGameSpeed(level) {
        const baseSpeed = 1000;
        const speedIncrease = Math.floor(level / 10) * 100;
        return Math.max(100, baseSpeed - speedIncrease);
    }
    validatePiecePosition(board, piece) {
        return (0, shared_1.isValidPosition)(board, piece.shape, piece.position);
    }
    checkTopOutCondition(board) {
        return board[0].some(cell => cell !== null) || board[1].some(cell => cell !== null);
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [piece_service_1.PieceService,
        player_service_1.PlayerService])
], GameService);
//# sourceMappingURL=game.service.js.map