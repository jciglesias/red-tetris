export interface Piece {
  type: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
  rotation: number;
  x: number;
  y: number;
  shape: number[][];
}

interface Player {
  id: string;           // Format: "roomName_playerName"
  name: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  lastSeen: Date;
  reconnectionToken: string;
  score: number;        // Live player score (updated during gameplay)
  level: number;        // Current game level
  linesCleared: number; // Lines cleared so far
}

export interface PlayerGameState {
  playerId: string;
  board: number[][];              // 20x10 grid, 0 = empty, 1-7 = piece colors
  currentPiece: Piece | null;
  nextPieces: Piece[];
  spectrum: number[];             // Height of each column for spectrum view
  lines: number;                  // Lines cleared
  score: number;                  // Player's current score
  level: number;                  // Current level (affects drop speed)
  isAlive: boolean;
  penalties: number;              // Pending penalty lines
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

export interface LeaderboardEntry {
  id: number;
  playerName: string;
  score: number;
  linesCleared: number;
  level: number;
  gameDuration: number;
  roomName?: string;
  createdAt: Date;
}

export interface LeaderboardStats {
  topScore: number;
  topScorePlayer: string;
  mostLinesCleared: number;
  mostLinesClearedPlayer: string;
  longestGameDuration: number;
  longestGamePlayer: string;
  totalGames: number;
}

export interface ChatMessage {
  playerId: string,
  playerName: string,
  message: string,
  timestamp: string
}
