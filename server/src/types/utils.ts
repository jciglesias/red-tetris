import { PieceType, BOARD_WIDTH, BOARD_HEIGHT } from './constants';
import { Position, PieceShape, Board, Spectrum } from './types';

// Tetrimino shapes definition
export const PIECE_SHAPES: Record<PieceType, PieceShape> = {
  [PieceType.I]: {
    type: PieceType.I,
    blocks: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 }
    ],
    center: { x: 1.5, y: 1.5 }
  },
  [PieceType.O]: {
    type: PieceType.O,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ],
    center: { x: 0.5, y: 0.5 }
  },
  [PieceType.T]: {
    type: PieceType.T,
    blocks: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    center: { x: 1, y: 1 }
  },
  [PieceType.S]: {
    type: PieceType.S,
    blocks: [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 }
    ],
    center: { x: 1, y: 1 }
  },
  [PieceType.Z]: {
    type: PieceType.Z,
    blocks: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    center: { x: 1, y: 1 }
  },
  [PieceType.J]: {
    type: PieceType.J,
    blocks: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    center: { x: 1, y: 1 }
  },
  [PieceType.L]: {
    type: PieceType.L,
    blocks: [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    center: { x: 1, y: 1 }
  }
};

// Utility functions
export const createEmptyBoard = (): Board => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

export const calculateSpectrum = (board: Board): Spectrum => {
  const spectrum: Spectrum = Array(BOARD_WIDTH).fill(0);
  
  for (let col = 0; col < BOARD_WIDTH; col++) {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      if (board[row][col] !== null) {
        spectrum[col] = BOARD_HEIGHT - row;
        break;
      }
    }
  }
  
  return spectrum;
};

export const isValidPosition = (board: Board, piece: Position[], position: Position): boolean => {
  return piece.every(block => {
    const x = block.x + position.x;
    const y = block.y + position.y;
    
    return (
      x >= 0 &&
      x < BOARD_WIDTH &&
      y >= 0 &&
      y < BOARD_HEIGHT &&
      board[y][x] === null
    );
  });
};

export const rotatePiece = (piece: Position[], center: Position, clockwise: boolean = true): Position[] => {
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

export const getRandomPiece = (): PieceType => {
  const pieces = Object.values(PieceType);
  return pieces[Math.floor(Math.random() * pieces.length)];
};

export const generatePieceSequence = (length: number): PieceType[] => {
  const sequence: PieceType[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(getRandomPiece());
  }
  return sequence;
};
