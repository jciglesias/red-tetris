import { Injectable } from '@nestjs/common';
import { isValidPosition, MoveDirection } from 'src/types';
import type { Board, Piece, Position } from 'src/types';
import { PieceService } from './piece.service';
import { PlayerService } from './player.service';

@Injectable()
export class GameService {
  constructor(
    private pieceService: PieceService,
    private playerService: PlayerService,
  ) {}

  canMovePiece(board: Board, piece: Piece, direction: MoveDirection): boolean {
    let dx = 0, dy = 0;
    
    switch (direction) {
      case MoveDirection.LEFT:
        dx = -1;
        break;
      case MoveDirection.RIGHT:
        dx = 1;
        break;
      case MoveDirection.DOWN:
        dy = 1;
        break;
    }

    const newPosition = {
      x: piece.position.x + dx,
      y: piece.position.y + dy,
    };

    return isValidPosition(board, piece.shape, newPosition);
  }

  canRotatePiece(board: Board, piece: Piece, clockwise = true): boolean {
    const rotatedPiece = this.pieceService.rotatePiece(piece, clockwise);
    return isValidPosition(board, rotatedPiece.shape, rotatedPiece.position);
  }

  dropPieceToBottom(board: Board, piece: Piece): Piece {
    let droppedPiece = { ...piece };
    
    while (this.canMovePiece(board, droppedPiece, MoveDirection.DOWN)) {
      droppedPiece = this.pieceService.movePiece(droppedPiece, 0, 1);
    }
    
    return droppedPiece;
  }

  calculateGhostPiece(board: Board, piece: Piece): Piece {
    return this.dropPieceToBottom(board, piece);
  }

  isPieceAtBottom(board: Board, piece: Piece): boolean {
    return !this.canMovePiece(board, piece, MoveDirection.DOWN);
  }

  getGameSpeed(level: number): number {
    // Return drop interval in milliseconds
    const baseSpeed = 1000; // 1 second
    const speedIncrease = Math.floor(level / 10) * 100;
    return Math.max(100, baseSpeed - speedIncrease); // Minimum 100ms
  }

  validatePiecePosition(board: Board, piece: Piece): boolean {
    return isValidPosition(board, piece.shape, piece.position);
  }

  checkTopOutCondition(board: Board): boolean {
    // Check if there are any blocks in the top two visible rows
    return board[0].some(cell => cell !== null) || board[1].some(cell => cell !== null);
  }
}
