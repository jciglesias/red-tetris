export interface Piece {
  type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
  rotation: number;
  x: number;
  y: number;
  shape: number[][];
}

export interface PlayerGameState {
  playerId: string;
  board: number[][]; // 20x10 grid, 0 = empty, 1-7 = piece colors
  currentPiece: Piece | null;
  nextPieces: Piece[];
  spectrum: number[]; // Height of each column for spectrum view
  lines: number; // Lines cleared
  isAlive: boolean;
  penalties: number; // Pending penalty lines
}

export interface GameState {
  roomName: string;
  players: Map<string, PlayerGameState>;
  pieceSequence: Piece[];
  currentPieceIndex: number;
  gameOver: boolean;
  winner: string | null;
  startTime: number;
}

// Tetris piece definitions following original game rules
const PIECE_SHAPES = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]],
  ],
  O: [
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]],
  ],
};