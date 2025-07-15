"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const src_1 = require("../../../shared/src");
let PlayerService = class PlayerService {
    createPlayer(name, isHost = false) {
        return {
            id: (0, uuid_1.v4)(),
            name,
            state: src_1.PlayerState.WAITING,
            board: (0, src_1.createEmptyBoard)(),
            spectrum: Array(src_1.BOARD_WIDTH).fill(0),
            currentPiece: null,
            nextPiece: null,
            isHost,
            linesCleared: 0,
        };
    }
    updatePlayerBoard(player, board) {
        return {
            ...player,
            board,
            spectrum: (0, src_1.calculateSpectrum)(board),
        };
    }
    setCurrentPiece(player, piece) {
        return {
            ...player,
            currentPiece: piece,
        };
    }
    setNextPiece(player, pieceType) {
        return {
            ...player,
            nextPiece: pieceType,
        };
    }
    updatePlayerState(player, state) {
        return {
            ...player,
            state,
        };
    }
    incrementLinesCleared(player, lines) {
        return {
            ...player,
            linesCleared: player.linesCleared + lines,
        };
    }
    placePieceOnBoard(player, piece) {
        const newBoard = player.board.map(row => [...row]);
        piece.shape.forEach(block => {
            const x = block.x + piece.position.x;
            const y = block.y + piece.position.y;
            if (x >= 0 && x < src_1.BOARD_WIDTH && y >= 0 && y < src_1.BOARD_HEIGHT) {
                newBoard[y][x] = piece.type;
            }
        });
        const completedLines = [];
        for (let y = 0; y < src_1.BOARD_HEIGHT; y++) {
            if (newBoard[y].every(cell => cell !== null)) {
                completedLines.push(y);
            }
        }
        completedLines.reverse().forEach(lineIndex => {
            newBoard.splice(lineIndex, 1);
            newBoard.unshift(Array(src_1.BOARD_WIDTH).fill(null));
        });
        return {
            board: newBoard,
            linesCleared: completedLines.length,
        };
    }
    addPenaltyLines(player, lineCount) {
        const newBoard = player.board.map(row => [...row]);
        newBoard.splice(0, lineCount);
        for (let i = 0; i < lineCount; i++) {
            const penaltyLine = Array(src_1.BOARD_WIDTH).fill('penalty');
            const gapIndex = Math.floor(Math.random() * src_1.BOARD_WIDTH);
            penaltyLine[gapIndex] = null;
            newBoard.push(penaltyLine);
        }
        return {
            ...player,
            board: newBoard,
            spectrum: (0, src_1.calculateSpectrum)(newBoard),
        };
    }
    checkGameOver(player) {
        return player.board[0].some(cell => cell !== null) ||
            player.board[1].some(cell => cell !== null);
    }
    resetPlayer(player) {
        return {
            ...player,
            state: src_1.PlayerState.WAITING,
            board: (0, src_1.createEmptyBoard)(),
            spectrum: Array(src_1.BOARD_WIDTH).fill(0),
            currentPiece: null,
            nextPiece: null,
            linesCleared: 0,
        };
    }
};
exports.PlayerService = PlayerService;
exports.PlayerService = PlayerService = __decorate([
    (0, common_1.Injectable)()
], PlayerService);
//# sourceMappingURL=player.service.js.map