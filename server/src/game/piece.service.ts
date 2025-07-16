import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PieceType, PIECE_SHAPES, generatePieceSequence, createEmptyBoard, calculateSpectrum } from 'src/types';
import type { Piece, Position } from 'src/types';

@Injectable()
export class PieceService {
  createPiece(type: PieceType, position?: Position): Piece {
    const shape = PIECE_SHAPES[type];
    return {
      type,
      position: position || { x: 4, y: 0 }, // Start at top center
      rotation: 0,
      shape: shape.blocks,
    };
  }

  rotatePiece(piece: Piece, clockwise = true): Piece {
    const shape = PIECE_SHAPES[piece.type];
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

  movePiece(piece: Piece, dx: number, dy: number): Piece {
    return {
      ...piece,
      position: {
        x: piece.position.x + dx,
        y: piece.position.y + dy,
      },
    };
  }

  generatePieceSequence(length: number): PieceType[] {
    return generatePieceSequence(length);
  }

  getNextPieceFromSequence(sequence: PieceType[], index: number): PieceType | null {
    return sequence[index] || null;
  }
}
