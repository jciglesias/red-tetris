import { MoveDirection } from '../../../shared/src';
import type { Board, Piece } from '../../../shared/src';
import { PieceService } from './piece.service';
import { PlayerService } from './player.service';
export declare class GameService {
    private pieceService;
    private playerService;
    constructor(pieceService: PieceService, playerService: PlayerService);
    canMovePiece(board: Board, piece: Piece, direction: MoveDirection): boolean;
    canRotatePiece(board: Board, piece: Piece, clockwise?: boolean): boolean;
    dropPieceToBottom(board: Board, piece: Piece): Piece;
    calculateGhostPiece(board: Board, piece: Piece): Piece;
    isPieceAtBottom(board: Board, piece: Piece): boolean;
    getGameSpeed(level: number): number;
    validatePiecePosition(board: Board, piece: Piece): boolean;
    checkTopOutCondition(board: Board): boolean;
}
