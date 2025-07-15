"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePieceSequence = exports.getRandomPiece = exports.rotatePiece = exports.isValidPosition = exports.calculateSpectrum = exports.createEmptyBoard = exports.PIECE_SHAPES = void 0;
const constants_1 = require("./constants");
exports.PIECE_SHAPES = {
    [constants_1.PieceType.I]: {
        type: constants_1.PieceType.I,
        blocks: [
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 3, y: 1 }
        ],
        center: { x: 1.5, y: 1.5 }
    },
    [constants_1.PieceType.O]: {
        type: constants_1.PieceType.O,
        blocks: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 }
        ],
        center: { x: 0.5, y: 0.5 }
    },
    [constants_1.PieceType.T]: {
        type: constants_1.PieceType.T,
        blocks: [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        center: { x: 1, y: 1 }
    },
    [constants_1.PieceType.S]: {
        type: constants_1.PieceType.S,
        blocks: [
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 }
        ],
        center: { x: 1, y: 1 }
    },
    [constants_1.PieceType.Z]: {
        type: constants_1.PieceType.Z,
        blocks: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        center: { x: 1, y: 1 }
    },
    [constants_1.PieceType.J]: {
        type: constants_1.PieceType.J,
        blocks: [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        center: { x: 1, y: 1 }
    },
    [constants_1.PieceType.L]: {
        type: constants_1.PieceType.L,
        blocks: [
            { x: 2, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 }
        ],
        center: { x: 1, y: 1 }
    }
};
const createEmptyBoard = () => {
    return Array(constants_1.BOARD_HEIGHT).fill(null).map(() => Array(constants_1.BOARD_WIDTH).fill(null));
};
exports.createEmptyBoard = createEmptyBoard;
const calculateSpectrum = (board) => {
    const spectrum = Array(constants_1.BOARD_WIDTH).fill(0);
    for (let col = 0; col < constants_1.BOARD_WIDTH; col++) {
        for (let row = 0; row < constants_1.BOARD_HEIGHT; row++) {
            if (board[row][col] !== null) {
                spectrum[col] = constants_1.BOARD_HEIGHT - row;
                break;
            }
        }
    }
    return spectrum;
};
exports.calculateSpectrum = calculateSpectrum;
const isValidPosition = (board, piece, position) => {
    return piece.every(block => {
        const x = block.x + position.x;
        const y = block.y + position.y;
        return (x >= 0 &&
            x < constants_1.BOARD_WIDTH &&
            y >= 0 &&
            y < constants_1.BOARD_HEIGHT &&
            board[y][x] === null);
    });
};
exports.isValidPosition = isValidPosition;
const rotatePiece = (piece, center, clockwise = true) => {
    const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return piece.map(block => {
        const dx = block.x - center.x;
        const dy = block.y - center.y;
        return {
            x: Math.round(center.x + dx * cos - dy * sin),
            y: Math.round(center.y + dx * sin + dy * cos)
        };
    });
};
exports.rotatePiece = rotatePiece;
const getRandomPiece = () => {
    const pieces = Object.values(constants_1.PieceType);
    return pieces[Math.floor(Math.random() * pieces.length)];
};
exports.getRandomPiece = getRandomPiece;
const generatePieceSequence = (length) => {
    const sequence = [];
    for (let i = 0; i < length; i++) {
        sequence.push((0, exports.getRandomPiece)());
    }
    return sequence;
};
exports.generatePieceSequence = generatePieceSequence;
//# sourceMappingURL=utils.js.map