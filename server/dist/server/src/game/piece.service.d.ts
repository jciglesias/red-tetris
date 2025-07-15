import { PieceType } from '../../../shared/src';
import type { Piece, Position } from '../../../shared/src';
export declare class PieceService {
    createPiece(type: PieceType, position?: Position): Piece;
    rotatePiece(piece: Piece, clockwise?: boolean): Piece;
    movePiece(piece: Piece, dx: number, dy: number): Piece;
    generatePieceSequence(length: number): PieceType[];
    getNextPieceFromSequence(sequence: PieceType[], index: number): PieceType | null;
}
