import { Injectable } from '@nestjs/common';

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
  penalties: number;
  pieceIndex: number; // Individual piece index for this player
}

export interface GameState {
  roomName: string;
  players: Map<string, PlayerGameState>;
  pieceSequence: Piece[];
  gameOver: boolean;
  winner: string | null;
  startTime: number;
  fastMode: boolean; // Add fast mode to game state
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

@Injectable()
export class GameService {
  private games: Map<string, GameState> = new Map();
  private readonly BOARD_WIDTH = 10;
  private readonly BOARD_HEIGHT = 20;
  private readonly PIECES_AHEAD = 5; // Number of pieces to show ahead

  constructor() {}

  createGame(roomName: string, playerIds: string[], fastMode: boolean = false): GameState {
    // Generate a sequence of pieces for the game
    const pieceSequence = this.generatePieceSequence(1000); // Generate 1000 pieces
    
    const players = new Map<string, PlayerGameState>();
    
    // Initialize each player's game state
    playerIds.forEach(playerId => {
      players.set(playerId, {
        playerId,
        board: this.createEmptyBoard(),
        currentPiece: null,
        nextPieces: [],
        spectrum: new Array(this.BOARD_WIDTH).fill(0),
        lines: 0,
        isAlive: true,
        penalties: 0,
        pieceIndex: 0, // Each player starts at the beginning of the sequence
      });
    });

    const gameState: GameState = {
      roomName,
      players,
      pieceSequence,
      gameOver: false,
      winner: null,
      startTime: Date.now(),
      fastMode, // Store the fast mode setting in game state
    };

    this.games.set(roomName, gameState);
    
    // Give each player their first piece
    this.initializePlayerPieces(gameState);
    
    return gameState;
  }

  getGameState(roomName: string): GameState | null {
    return this.games.get(roomName) || null;
  }

  endGame(roomName: string): boolean {
    return this.games.delete(roomName);
  }

  processPlayerAction(roomName: string, playerId: string, action: string): boolean {
    const game = this.games.get(roomName);
    const player = game?.players.get(playerId);
    
    if (!game || !player || !player.isAlive || !player.currentPiece) {
      return false;
    }

    let moved = false;
    const currentPiece = { ...player.currentPiece };

    switch (action) {
      case 'move-left':
        currentPiece.x -= 1;
        if (this.isValidPosition(player.board, currentPiece)) {
          player.currentPiece.x = currentPiece.x;
          moved = true;
        }
        break;

      case 'move-right':
        currentPiece.x += 1;
        if (this.isValidPosition(player.board, currentPiece)) {
          player.currentPiece.x = currentPiece.x;
          moved = true;
        }
        break;

      case 'rotate':
        currentPiece.rotation = (currentPiece.rotation + 1) % PIECE_SHAPES[currentPiece.type].length;
        currentPiece.shape = PIECE_SHAPES[currentPiece.type][currentPiece.rotation];
        if (this.isValidPosition(player.board, currentPiece)) {
          player.currentPiece.rotation = currentPiece.rotation;
          player.currentPiece.shape = currentPiece.shape;
          moved = true;
        }
        break;

      case 'soft-drop':
        moved = this.movePieceDown(player);
        break;

      case 'hard-drop':
        while (this.movePieceDown(player)) {
          // Continue dropping until piece lands
        }
        this.lockPiece(game, player);
        moved = true;
        break;
    }

    return moved;
  }

  // Game tick - called periodically to advance game state
  tick(roomName: string, fastMode: boolean = false): boolean {
    const game = this.games.get(roomName);
    if (!game || game.gameOver) {
      return false;
    }

    let gameChanged = false;

    // Process each alive player
    for (const player of game.players.values()) {
      if (!player.isAlive || !player.currentPiece) continue;

      // In fast mode, move pieces down 2-3 times per tick instead of 1
      const movesPerTick = fastMode ? 2 : 1;
      
      for (let i = 0; i < movesPerTick; i++) {
        // Try to move piece down
        if (!this.movePieceDown(player)) {
          // Piece can't move down, lock it and get next piece
          this.lockPiece(game, player);
          gameChanged = true;
          break; // Break out of the move loop since piece is locked
        }
      }
    }

    // Check for game over condition
    this.checkGameOver(game);

    return gameChanged;
  }

  private generatePieceSequence(count: number): Piece[] {
    const pieces: Piece[] = [];
    const pieceTypes: Array<keyof typeof PIECE_SHAPES> = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    
    for (let i = 0; i < count; i++) {
      const type = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
      pieces.push(this.createPiece(type));
    }
    
    return pieces;
  }

  private createPiece(type: keyof typeof PIECE_SHAPES): Piece {
    return {
      type,
      rotation: 0,
      x: Math.floor(this.BOARD_WIDTH / 2) - 1, // Start near center
      y: 0,
      shape: PIECE_SHAPES[type][0],
    };
  }

  private createEmptyBoard(): number[][] {
    return Array(this.BOARD_HEIGHT).fill(null).map(() => Array(this.BOARD_WIDTH).fill(0));
  }

  private initializePlayerPieces(game: GameState): void {
    for (const player of game.players.values()) {
      // Give current piece from player's individual piece index
      player.currentPiece = { ...game.pieceSequence[player.pieceIndex] };
      
      // Give next pieces
      player.nextPieces = [];
      for (let i = 1; i <= this.PIECES_AHEAD; i++) {
        const pieceIndex = (player.pieceIndex + i) % game.pieceSequence.length;
        player.nextPieces.push({ ...game.pieceSequence[pieceIndex] });
      }
    }
  }

  private isValidPosition(board: number[][], piece: Piece): boolean {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          
          // Check boundaries
          if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
              boardY >= this.BOARD_HEIGHT) {
            return false;
          }
          
          // Check collision with existing pieces (but allow y < 0 for spawning)
          if (boardY >= 0 && board[boardY][boardX] !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private movePieceDown(player: PlayerGameState): boolean {
    if (!player.currentPiece) return false;
    
    const testPiece = { ...player.currentPiece, y: player.currentPiece.y + 1 };
    
    if (this.isValidPosition(player.board, testPiece)) {
      player.currentPiece.y = testPiece.y;
      return true;
    }
    
    return false;
  }

  private lockPiece(game: GameState, player: PlayerGameState): void {
    if (!player.currentPiece) return;

    // Place piece on board
    const piece = player.currentPiece;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          
          if (boardY >= 0 && boardY < this.BOARD_HEIGHT && 
              boardX >= 0 && boardX < this.BOARD_WIDTH) {
            // Use piece type as color (1-7)
            const pieceTypeIndex = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'].indexOf(piece.type) + 1;
            player.board[boardY][boardX] = pieceTypeIndex;
          }
        }
      }
    }

    // Check for completed lines
    const clearedLines = this.clearLines(player);
    
    // Apply penalties if any
    this.applyPenalties(player);
    
    // Send penalty lines to other players if lines were cleared
    if (clearedLines > 0) {
      this.sendPenaltyLines(game, player.playerId, clearedLines);
    }

    // Update spectrum
    this.updateSpectrum(player);

    // Give next piece from this player's individual sequence
    player.pieceIndex = (player.pieceIndex + 1) % game.pieceSequence.length;
    const nextPiece = { ...game.pieceSequence[player.pieceIndex] };

    // Check if player topped out
    if (!this.canSpawnPiece(player, nextPiece)) {
      player.isAlive = false;
      return;
    }

    player.currentPiece = nextPiece;
    
    // Update next pieces queue
    player.nextPieces.shift();
    const nextPieceIndex = (player.pieceIndex + this.PIECES_AHEAD) % game.pieceSequence.length;
    player.nextPieces.push({ ...game.pieceSequence[nextPieceIndex] });
  }

  private clearLines(player: PlayerGameState): number {
    let linesCleared = 0;
    
    for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
      // Check if line is complete AND doesn't contain penalty blocks (value 9)
      const lineComplete = player.board[y].every(cell => cell !== 0);
      const hasPenaltyBlocks = player.board[y].some(cell => cell === 9);
      
      if (lineComplete && !hasPenaltyBlocks) {
        // Remove completed line
        player.board.splice(y, 1);
        // Add new empty line at top
        player.board.unshift(Array(this.BOARD_WIDTH).fill(0));
        linesCleared++;
        player.lines++;
        y++; // Check the same row again
      }
    }
    
    return linesCleared;
  }

  private applyPenalties(player: PlayerGameState): void {
    while (player.penalties > 0) {
      // Remove top line (this shifts all pieces up)
      player.board.shift();
      
      // Add penalty line at bottom - these are permanent obstacles
      // Make penalty lines completely solid to prevent pieces from falling through gaps
      const penaltyLine = Array(this.BOARD_WIDTH).fill(9); // 9 = penalty block (unclearable)
      
      // No gaps - penalty lines are solid barriers that force pieces to stack above them
      player.board.push(penaltyLine);
      player.penalties--;
    }
  }

  private sendPenaltyLines(game: GameState, senderId: string, linesCleared: number): void {
    // Calculate penalty lines: n lines cleared = n-1 penalty lines
    const penaltyLines = Math.max(0, linesCleared - 1);
    
    if (penaltyLines > 0) {
      for (const [playerId, player] of game.players) {
        if (playerId !== senderId && player.isAlive) {
          player.penalties += penaltyLines;
        }
      }
    }
  }

  private updateSpectrum(player: PlayerGameState): void {
    for (let x = 0; x < this.BOARD_WIDTH; x++) {
      let height = 0;
      for (let y = 0; y < this.BOARD_HEIGHT; y++) {
        if (player.board[y][x] !== 0) {
          height = this.BOARD_HEIGHT - y;
          break;
        }
      }
      player.spectrum[x] = height;
    }
  }

  private canSpawnPiece(player: PlayerGameState, newPiece: Piece): boolean {
    // Create a test piece at spawn position
    const testPiece = {
      ...newPiece,
      x: Math.floor(this.BOARD_WIDTH / 2) - 1,
      y: 0
    };
    return this.isValidPosition(player.board, testPiece);
  }

  private checkGameOver(game: GameState): void {
    const alivePlayers = Array.from(game.players.values()).filter(p => p.isAlive);
    const totalPlayers = game.players.size;
    
    // Game over conditions:
    // 1. No players alive (everyone lost)
    // 2. Multiple players started but only one remains (multiplayer victory)
    // Note: Single player games continue until the player loses
    
    if (alivePlayers.length === 0) {
      // Everyone lost - no winner
      game.gameOver = true;
      game.winner = null;
    } else if (totalPlayers > 1 && alivePlayers.length === 1) {
      // Multiplayer game with one survivor - they win
      game.gameOver = true;
      game.winner = alivePlayers[0].playerId;
    }
    // Single player games (totalPlayers === 1) continue until player loses
  }
}
