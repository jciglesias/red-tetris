import { PieceType } from './constants';
import { Position, PieceShape, Board, Spectrum } from './types';
export declare const PIECE_SHAPES: Record<PieceType, PieceShape>;
export declare const createEmptyBoard: () => Board;
export declare const calculateSpectrum: (board: Board) => Spectrum;
export declare const isValidPosition: (board: Board, piece: Position[], position: Position) => boolean;
export declare const rotatePiece: (piece: Position[], center: Position, clockwise?: boolean) => Position[];
export declare const getRandomPiece: () => PieceType;
export declare const generatePieceSequence: (length: number) => PieceType[];
//# sourceMappingURL=utils.d.ts.map