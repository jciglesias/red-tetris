"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PieceService = void 0;
const common_1 = require("@nestjs/common");
const src_1 = require("../../../shared/src");
let PieceService = class PieceService {
    createPiece(type, position) {
        const shape = src_1.PIECE_SHAPES[type];
        return {
            type,
            position: position || { x: 4, y: 0 },
            rotation: 0,
            shape: shape.blocks,
        };
    }
    rotatePiece(piece, clockwise = true) {
        const shape = src_1.PIECE_SHAPES[piece.type];
        const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const rotatedShape = piece.shape.map(block => {
            const dx = block.x - shape.center.x;
            const dy = block.y - shape.center.y;
            return {
                x: Math.round(shape.center.x + dx * cos - dy * sin),
                y: Math.round(shape.center.y + dx * sin + dy * cos)
            };
        });
        return {
            ...piece,
            shape: rotatedShape,
            rotation: (piece.rotation + (clockwise ? 90 : -90)) % 360,
        };
    }
    movePiece(piece, dx, dy) {
        return {
            ...piece,
            position: {
                x: piece.position.x + dx,
                y: piece.position.y + dy,
            },
        };
    }
    generatePieceSequence(length) {
        return (0, src_1.generatePieceSequence)(length);
    }
    getNextPieceFromSequence(sequence, index) {
        return sequence[index] || null;
    }
};
exports.PieceService = PieceService;
exports.PieceService = PieceService = __decorate([
    (0, common_1.Injectable)()
], PieceService);
//# sourceMappingURL=piece.service.js.map