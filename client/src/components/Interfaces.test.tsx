import { Piece, PlayerGameState, GameState } from './Interfaces';

describe('Interfaces', () => {
  describe('Piece interface', () => {
    it('should create a valid Piece object', () => {
      const piece: Piece = {
        type: 'I',
        rotation: 0,
        x: 4,
        y: 0,
        shape: [[1, 1, 1, 1]]
      };

      expect(piece.type).toBe('I');
      expect(piece.rotation).toBe(0);
      expect(piece.x).toBe(4);
      expect(piece.y).toBe(0);
      expect(piece.shape).toEqual([[1, 1, 1, 1]]);
    });

    it('should support all piece types', () => {
      const pieceTypes: Array<Piece['type']> = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      
      pieceTypes.forEach(type => {
        const piece: Piece = {
          type,
          rotation: 0,
          x: 0,
          y: 0,
          shape: [[1]]
        };
        expect(piece.type).toBe(type);
      });
    });

    it('should create O piece', () => {
      const oPiece: Piece = {
        type: 'O',
        rotation: 0,
        x: 4,
        y: 0,
        shape: [
          [1, 1],
          [1, 1]
        ]
      };

      expect(oPiece.type).toBe('O');
      expect(oPiece.shape).toHaveLength(2);
      expect(oPiece.shape[0]).toHaveLength(2);
    });

    it('should create T piece', () => {
      const tPiece: Piece = {
        type: 'T',
        rotation: 0,
        x: 4,
        y: 0,
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ]
      };

      expect(tPiece.type).toBe('T');
      expect(tPiece.shape).toHaveLength(2);
      expect(tPiece.shape[0]).toHaveLength(3);
    });
  });

  describe('PlayerGameState interface', () => {
    it('should create a valid PlayerGameState object', () => {
      const playerState: PlayerGameState = {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: {
          type: 'I',
          rotation: 0,
          x: 4,
          y: 0,
          shape: [[1, 1, 1, 1]]
        },
        nextPieces: [
          {
            type: 'O',
            rotation: 0,
            x: 0,
            y: 0,
            shape: [[1, 1], [1, 1]]
          }
        ],
        spectrum: Array(10).fill(0),
        lines: 5,
        score: 1500,
        level: 3,
        isAlive: true,
        penalties: 2
      };

      expect(playerState.playerId).toBe('room1_player1');
      expect(playerState.board).toHaveLength(20);
      expect(playerState.board[0]).toHaveLength(10);
      expect(playerState.currentPiece?.type).toBe('I');
      expect(playerState.nextPieces).toHaveLength(1);
      expect(playerState.spectrum).toHaveLength(10);
      expect(playerState.lines).toBe(5);
      expect(playerState.score).toBe(1500);
      expect(playerState.level).toBe(3);
      expect(playerState.isAlive).toBe(true);
      expect(playerState.penalties).toBe(2);
    });

    it('should allow null currentPiece', () => {
      const playerState: PlayerGameState = {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 0,
        score: 0,
        level: 1,
        isAlive: true,
        penalties: 0
      };

      expect(playerState.currentPiece).toBeNull();
    });

    it('should handle dead player state', () => {
      const deadPlayerState: PlayerGameState = {
        playerId: 'room1_player2',
        board: Array(20).fill(null).map(() => Array(10).fill(1)), // Full board
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(20), // Full spectrum
        lines: 10,
        score: 5000,
        level: 2,
        isAlive: false,
        penalties: 0
      };

      expect(deadPlayerState.isAlive).toBe(false);
      expect(deadPlayerState.spectrum.every(height => height === 20)).toBe(true);
    });

    it('should handle empty next pieces', () => {
      const playerState: PlayerGameState = {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 0,
        score: 0,
        level: 1,
        isAlive: true,
        penalties: 0
      };

      expect(playerState.nextPieces).toHaveLength(0);
    });

    it('should handle multiple next pieces', () => {
      const nextPieces: Piece[] = [
        { type: 'I', rotation: 0, x: 0, y: 0, shape: [[1, 1, 1, 1]] },
        { type: 'O', rotation: 0, x: 0, y: 0, shape: [[1, 1], [1, 1]] },
        { type: 'T', rotation: 0, x: 0, y: 0, shape: [[0, 1, 0], [1, 1, 1]] }
      ];

      const playerState: PlayerGameState = {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces,
        spectrum: Array(10).fill(0),
        lines: 0,
        score: 0,
        level: 1,
        isAlive: true,
        penalties: 0
      };

      expect(playerState.nextPieces).toHaveLength(3);
      expect(playerState.nextPieces[0].type).toBe('I');
      expect(playerState.nextPieces[1].type).toBe('O');
      expect(playerState.nextPieces[2].type).toBe('T');
    });

    it('should handle score and level properties', () => {
      const playerState: PlayerGameState = {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 15,
        score: 7500,
        level: 4,
        isAlive: true,
        penalties: 0
      };

      expect(playerState.score).toBe(7500);
      expect(playerState.level).toBe(4);
      expect(typeof playerState.score).toBe('number');
      expect(typeof playerState.level).toBe('number');
    });
  });

  describe('GameState interface', () => {
    it('should create a valid GameState object', () => {
      const players = new Map<string, PlayerGameState>();
      players.set('room1_player1', {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 0,
        score: 0,
        level: 1,
        isAlive: true,
        penalties: 0
      });

      const gameState: GameState = {
        roomName: 'room1',
        players,
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      };

      expect(gameState.roomName).toBe('room1');
      expect(gameState.players.size).toBe(1);
      expect(gameState.players.has('room1_player1')).toBe(true);
      expect(gameState.pieceSequence).toHaveLength(0);
      expect(gameState.currentPieceIndex).toBe(0);
      expect(gameState.gameOver).toBe(false);
      expect(gameState.winner).toBeNull();
      expect(typeof gameState.startTime).toBe('number');
    });

    it('should handle multiple players', () => {
      const players = new Map<string, PlayerGameState>();
      
      for (let i = 1; i <= 4; i++) {
        players.set(`room1_player${i}`, {
          playerId: `room1_player${i}`,
          board: Array(20).fill(null).map(() => Array(10).fill(0)),
          currentPiece: null,
          nextPieces: [],
          spectrum: Array(10).fill(0),
          lines: 0,
          score: 0,
          level: 1,
          isAlive: true,
          penalties: 0
        });
      }

      const gameState: GameState = {
        roomName: 'room1',
        players,
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      };

      expect(gameState.players.size).toBe(4);
      expect(gameState.players.has('room1_player1')).toBe(true);
      expect(gameState.players.has('room1_player4')).toBe(true);
    });

    it('should handle game over state', () => {
      const players = new Map<string, PlayerGameState>();
      players.set('room1_player1', {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 50,
        score: 25000,
        level: 5,
        isAlive: true,
        penalties: 0
      });

      const gameState: GameState = {
        roomName: 'room1',
        players,
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: true,
        winner: 'room1_player1',
        startTime: Date.now() - 120000 // 2 minutes ago
      };

      expect(gameState.gameOver).toBe(true);
      expect(gameState.winner).toBe('room1_player1');
    });

    it('should handle piece sequence', () => {
      const pieceSequence: Piece[] = [
        { type: 'I', rotation: 0, x: 0, y: 0, shape: [[1, 1, 1, 1]] },
        { type: 'O', rotation: 0, x: 0, y: 0, shape: [[1, 1], [1, 1]] },
        { type: 'T', rotation: 0, x: 0, y: 0, shape: [[0, 1, 0], [1, 1, 1]] }
      ];

      const gameState: GameState = {
        roomName: 'room1',
        players: new Map(),
        pieceSequence,
        currentPieceIndex: 1,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      };

      expect(gameState.pieceSequence).toHaveLength(3);
      expect(gameState.currentPieceIndex).toBe(1);
      expect(gameState.pieceSequence[0].type).toBe('I');
      expect(gameState.pieceSequence[1].type).toBe('O');
      expect(gameState.pieceSequence[2].type).toBe('T');
    });

    it('should handle empty game state', () => {
      const gameState: GameState = {
        roomName: '',
        players: new Map(),
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: 0
      };

      expect(gameState.roomName).toBe('');
      expect(gameState.players.size).toBe(0);
      expect(gameState.pieceSequence).toHaveLength(0);
      expect(gameState.winner).toBeNull();
      expect(gameState.startTime).toBe(0);
    });
  });

  describe('Type checking and validation', () => {
    it('should enforce piece type constraints', () => {
      // This test validates that TypeScript enforces the correct piece types
      const validPieceTypes: Array<Piece['type']> = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      
      validPieceTypes.forEach(type => {
        const piece: Piece = {
          type,
          rotation: 0,
          x: 0,
          y: 0,
          shape: [[1]]
        };
        
        expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece.type);
      });
    });

    it('should handle board dimensions correctly', () => {
      const board: number[][] = Array(20).fill(null).map(() => Array(10).fill(0));
      
      expect(board).toHaveLength(20); // 20 rows
      expect(board[0]).toHaveLength(10); // 10 columns
      expect(board[19]).toHaveLength(10); // Last row also has 10 columns
    });

    it('should handle spectrum array correctly', () => {
      const spectrum: number[] = Array(10).fill(0);
      
      expect(spectrum).toHaveLength(10); // One height value per column
      expect(spectrum.every(height => typeof height === 'number')).toBe(true);
    });

    it('should validate piece shape format', () => {
      const iPieceShape: number[][] = [[1, 1, 1, 1]];
      const oPieceShape: number[][] = [[1, 1], [1, 1]];
      const tPieceShape: number[][] = [[0, 1, 0], [1, 1, 1]];
      
      expect(iPieceShape).toHaveLength(1);
      expect(iPieceShape[0]).toHaveLength(4);
      
      expect(oPieceShape).toHaveLength(2);
      expect(oPieceShape[0]).toHaveLength(2);
      expect(oPieceShape[1]).toHaveLength(2);
      
      expect(tPieceShape).toHaveLength(2);
      expect(tPieceShape[0]).toHaveLength(3);
      expect(tPieceShape[1]).toHaveLength(3);
    });
  });
});
