import { 
  Piece, 
  PlayerGameState, 
  GameState, 
  LeaderboardEntry, 
  LeaderboardStats, 
  ChatMessage 
} from './Interfaces';

describe('Interfaces Type Tests', () => {
  
  describe('Piece Interface', () => {
    it('should create a valid Piece object', () => {
      const piece: Piece = {
        type: 'I',
        rotation: 0,
        x: 5,
        y: 0,
        shape: [[1, 1, 1, 1]]
      };

      expect(piece.type).toBe('I');
      expect(piece.rotation).toBe(0);
      expect(piece.x).toBe(5);
      expect(piece.y).toBe(0);
      expect(piece.shape).toEqual([[1, 1, 1, 1]]);
    });

    it('should validate all piece types', () => {
      const types: Array<Piece['type']> = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      
      types.forEach(type => {
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

    it('should handle different rotations', () => {
      const rotations = [0, 1, 2, 3];
      
      rotations.forEach(rotation => {
        const piece: Piece = {
          type: 'T',
          rotation,
          x: 0,
          y: 0,
          shape: [[1]]
        };
        expect(piece.rotation).toBe(rotation);
      });
    });

    it('should handle different shapes', () => {
      const tPiece: Piece = {
        type: 'T',
        rotation: 0,
        x: 0,
        y: 0,
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ]
      };

      expect(tPiece.shape).toHaveLength(2);
      expect(tPiece.shape[0]).toHaveLength(3);
      expect(tPiece.shape[1]).toHaveLength(3);
    });
  });

  describe('PlayerGameState Interface', () => {
    it('should create a valid PlayerGameState object', () => {
      const playerState: PlayerGameState = {
        playerId: 'room1_player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: {
          type: 'I',
          rotation: 0,
          x: 5,
          y: 0,
          shape: [[1, 1, 1, 1]]
        },
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 0,
        score: 0,
        level: 1,
        isAlive: true,
        penalties: 0
      };

      expect(playerState.playerId).toBe('room1_player1');
      expect(playerState.board).toHaveLength(20);
      expect(playerState.board[0]).toHaveLength(10);
      expect(playerState.spectrum).toHaveLength(10);
      expect(playerState.isAlive).toBe(true);
      expect(playerState.score).toBe(0);
      expect(playerState.level).toBe(1);
    });

    it('should handle empty board correctly', () => {
      const emptyBoard = Array(20).fill(null).map(() => Array(10).fill(0));
      const playerState: PlayerGameState = {
        playerId: 'test_player',
        board: emptyBoard,
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 0,
        score: 0,
        level: 1,
        isAlive: true,
        penalties: 0
      };

      // Check board dimensions
      expect(playerState.board).toHaveLength(20);
      playerState.board.forEach(row => {
        expect(row).toHaveLength(10);
        row.forEach(cell => {
          expect(cell).toBe(0);
        });
      });
    });

    it('should handle game progression', () => {
      const playerState: PlayerGameState = {
        playerId: 'player1',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 10,
        score: 1000,
        level: 2,
        isAlive: true,
        penalties: 2
      };

      expect(playerState.lines).toBe(10);
      expect(playerState.score).toBe(1000);
      expect(playerState.level).toBe(2);
      expect(playerState.penalties).toBe(2);
    });

    it('should handle player death', () => {
      const deadPlayer: PlayerGameState = {
        playerId: 'dead_player',
        board: Array(20).fill(null).map(() => Array(10).fill(0)),
        currentPiece: null,
        nextPieces: [],
        spectrum: Array(10).fill(0),
        lines: 5,
        score: 500,
        level: 1,
        isAlive: false,
        penalties: 0
      };

      expect(deadPlayer.isAlive).toBe(false);
    });
  });

  describe('GameState Interface', () => {
    it('should create a valid GameState object', () => {
      const gameState: GameState = {
        roomName: 'testRoom',
        players: new Map(),
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      };

      expect(gameState.roomName).toBe('testRoom');
      expect(gameState.players).toBeInstanceOf(Map);
      expect(gameState.gameOver).toBe(false);
      expect(gameState.winner).toBeNull();
      expect(typeof gameState.startTime).toBe('number');
    });

    it('should handle game over state', () => {
      const gameState: GameState = {
        roomName: 'endedRoom',
        players: new Map(),
        pieceSequence: [],
        currentPieceIndex: 10,
        gameOver: true,
        winner: 'player1',
        startTime: Date.now() - 300000 // 5 minutes ago
      };

      expect(gameState.gameOver).toBe(true);
      expect(gameState.winner).toBe('player1');
    });
  });

  describe('LeaderboardEntry Interface', () => {
    it('should create a valid LeaderboardEntry object', () => {
      const entry: LeaderboardEntry = {
        id: 1,
        playerName: 'TestPlayer',
        score: 5000,
        linesCleared: 20,
        level: 3,
        gameDuration: 180,
        roomName: 'testRoom',
        createdAt: new Date()
      };

      expect(entry.id).toBe(1);
      expect(entry.playerName).toBe('TestPlayer');
      expect(entry.score).toBe(5000);
      expect(entry.linesCleared).toBe(20);
      expect(entry.level).toBe(3);
      expect(entry.gameDuration).toBe(180);
      expect(entry.createdAt).toBeInstanceOf(Date);
    });

    it('should handle entry without roomName', () => {
      const entry: LeaderboardEntry = {
        id: 2,
        playerName: 'Player2',
        score: 3000,
        linesCleared: 15,
        level: 2,
        gameDuration: 120,
        createdAt: new Date()
      };

      expect(entry.roomName).toBeUndefined();
      expect(entry.playerName).toBe('Player2');
    });
  });

  describe('LeaderboardStats Interface', () => {
    it('should create a valid LeaderboardStats object', () => {
      const stats: LeaderboardStats = {
        topScore: 10000,
        topScorePlayer: 'ChampionPlayer',
        mostLinesCleared: 50,
        mostLinesClearedPlayer: 'LineClearing Master',
        longestGameDuration: 600,
        longestGamePlayer: 'Endurance Player',
        totalGames: 100
      };

      expect(stats.topScore).toBe(10000);
      expect(stats.topScorePlayer).toBe('ChampionPlayer');
      expect(stats.mostLinesCleared).toBe(50);
      expect(stats.mostLinesClearedPlayer).toBe('LineClearing Master');
      expect(stats.longestGameDuration).toBe(600);
      expect(stats.longestGamePlayer).toBe('Endurance Player');
      expect(stats.totalGames).toBe(100);
    });

    it('should handle zero stats', () => {
      const emptyStats: LeaderboardStats = {
        topScore: 0,
        topScorePlayer: '',
        mostLinesCleared: 0,
        mostLinesClearedPlayer: '',
        longestGameDuration: 0,
        longestGamePlayer: '',
        totalGames: 0
      };

      expect(emptyStats.topScore).toBe(0);
      expect(emptyStats.totalGames).toBe(0);
      expect(emptyStats.topScorePlayer).toBe('');
    });
  });

  describe('ChatMessage Interface', () => {
    it('should create a valid ChatMessage object', () => {
      const message: ChatMessage = {
        playerId: 'room1_player1',
        playerName: 'TestPlayer',
        message: 'Hello, world!',
        timestamp: new Date().toISOString()
      };

      expect(message.playerId).toBe('room1_player1');
      expect(message.playerName).toBe('TestPlayer');
      expect(message.message).toBe('Hello, world!');
      expect(typeof message.timestamp).toBe('string');
    });

    it('should handle empty message', () => {
      const emptyMessage: ChatMessage = {
        playerId: 'player1',
        playerName: 'Player',
        message: '',
        timestamp: new Date().toISOString()
      };

      expect(emptyMessage.message).toBe('');
      expect(emptyMessage.playerId).toBe('player1');
    });

    it('should handle long message', () => {
      const longText = 'A'.repeat(1000);
      const longMessage: ChatMessage = {
        playerId: 'player1',
        playerName: 'Player',
        message: longText,
        timestamp: new Date().toISOString()
      };

      expect(longMessage.message).toHaveLength(1000);
      expect(longMessage.message).toBe(longText);
    });

    it('should validate timestamp format', () => {
      const timestamp = new Date().toISOString();
      const message: ChatMessage = {
        playerId: 'player1',
        playerName: 'Player',
        message: 'Test',
        timestamp
      };

      expect(message.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Type Compatibility Tests', () => {
    it('should handle Map operations in GameState', () => {
      const gameState: GameState = {
        roomName: 'testRoom',
        players: new Map<string, PlayerGameState>(),
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      };

      const playerState: PlayerGameState = {
        playerId: 'player1',
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

      gameState.players.set('player1', playerState);
      expect(gameState.players.has('player1')).toBe(true);
      expect(gameState.players.get('player1')).toBe(playerState);
    });

    it('should handle piece sequence operations', () => {
      const pieces: Piece[] = [
        { type: 'I', rotation: 0, x: 0, y: 0, shape: [[1, 1, 1, 1]] },
        { type: 'O', rotation: 0, x: 0, y: 0, shape: [[1, 1], [1, 1]] },
        { type: 'T', rotation: 0, x: 0, y: 0, shape: [[0, 1, 0], [1, 1, 1]] }
      ];

      const gameState: GameState = {
        roomName: 'testRoom',
        players: new Map(),
        pieceSequence: pieces,
        currentPieceIndex: 1,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      };

      expect(gameState.pieceSequence).toHaveLength(3);
      expect(gameState.pieceSequence[gameState.currentPieceIndex].type).toBe('O');
    });
  });
});
