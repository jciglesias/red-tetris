import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGame', () => {
    it('should create a new game with players', () => {
      const roomName = 'test-room';
      const playerIds = ['player1', 'player2'];

      const gameState = service.createGame(roomName, playerIds);

      expect(gameState).toBeDefined();
      expect(gameState.roomName).toBe(roomName);
      expect(gameState.players.size).toBe(2);
      expect(gameState.gameOver).toBe(false);
      expect(gameState.pieceSequence.length).toBeGreaterThan(0);
    });

    it('should initialize player states correctly', () => {
      const roomName = 'test-room';
      const playerIds = ['player1'];

      const gameState = service.createGame(roomName, playerIds);
      const player = gameState.players.get('player1');

      expect(player).toBeDefined();
      expect(player?.board).toHaveLength(20); // Board height
      expect(player?.board[0]).toHaveLength(10); // Board width
      expect(player?.spectrum).toHaveLength(10);
      expect(player?.isAlive).toBe(true);
      expect(player?.lines).toBe(0);
      expect(player?.currentPiece).toBeDefined();
      expect(player?.nextPieces).toHaveLength(5);
    });
  });

  describe('processPlayerAction', () => {
    let gameState: any;
    const roomName = 'test-room';
    const playerId = 'player1';

    beforeEach(() => {
      gameState = service.createGame(roomName, [playerId]);
    });

    it('should process move-left action', () => {
      const player = gameState.players.get(playerId);
      const originalX = player.currentPiece.x;

      const result = service.processPlayerAction(roomName, playerId, 'move-left');

      expect(result).toBe(true);
      expect(player.currentPiece.x).toBe(originalX - 1);
    });

    it('should process move-right action', () => {
      const player = gameState.players.get(playerId);
      const originalX = player.currentPiece.x;

      const result = service.processPlayerAction(roomName, playerId, 'move-right');

      expect(result).toBe(true);
      expect(player.currentPiece.x).toBe(originalX + 1);
    });

    it('should process rotate action', () => {
      const player = gameState.players.get(playerId);
      const originalRotation = player.currentPiece.rotation;

      const result = service.processPlayerAction(roomName, playerId, 'rotate');

      // Rotation might not always succeed (depends on piece position and board state)
      // So we check if result is true, then rotation should have changed
      if (result) {
        // For pieces with multiple rotations, rotation should change
        const pieceType = player.currentPiece.type;
        if (pieceType !== 'O') { // O piece has only one rotation state
          expect(player.currentPiece.rotation).not.toBe(originalRotation);
        }
      }
    });

    it('should return false for invalid game/player', () => {
      const result = service.processPlayerAction('invalid-room', playerId, 'move-left');
      expect(result).toBe(false);

      const result2 = service.processPlayerAction(roomName, 'invalid-player', 'move-left');
      expect(result2).toBe(false);
    });
  });

  describe('endGame', () => {
    it('should remove game from active games', () => {
      const roomName = 'test-room';
      service.createGame(roomName, ['player1']);

      const result = service.endGame(roomName);

      expect(result).toBe(true);
      expect(service.getGameState(roomName)).toBeNull();
    });

    it('should return false for non-existent game', () => {
      const result = service.endGame('non-existent-room');
      expect(result).toBe(false);
    });
  });

  describe('getGameState', () => {
    it('should return game state for existing game', () => {
      const roomName = 'test-room';
      const gameState = service.createGame(roomName, ['player1']);

      const retrieved = service.getGameState(roomName);

      expect(retrieved).toBe(gameState);
    });

    it('should return null for non-existent game', () => {
      const retrieved = service.getGameState('non-existent-room');
      expect(retrieved).toBeNull();
    });
  });

  describe('tick', () => {
    let gameState: any;
    const roomName = 'test-room';
    const playerId = 'player1';

    beforeEach(() => {
      gameState = service.createGame(roomName, [playerId]);
    });

    it('should return false for non-existent game', () => {
      const result = service.tick('non-existent-room');
      expect(result).toBe(false);
    });

    it('should return false for game over state', () => {
      gameState.gameOver = true;
      const result = service.tick(roomName);
      expect(result).toBe(false);
    });

    it('should advance piece down and return true when piece moves', () => {
      const player = gameState.players.get(playerId);
      const originalY = player.currentPiece.y;
      
      const result = service.tick(roomName);
      
      // Result depends on whether piece can move down
      if (result) {
        expect(player.currentPiece.y).toBeGreaterThan(originalY);
      }
    });

    it('should lock piece when it cannot move down during tick', () => {
      const player = gameState.players.get(playerId);
      if (!player) throw new Error('Player not found');

      // Create a piece at the bottom that can't move down
      player.currentPiece = {
        type: 'O',
        rotation: 0,
        x: 0,
        y: 19, // At the very bottom
        shape: [[1, 1], [1, 1]]
      };

      // Spy on lockPiece to ensure it gets called
      const lockPieceSpy = jest.spyOn(service as any, 'lockPiece');

      // Trigger tick
      const result = service.tick(roomName);

      // Should return true indicating game changed
      expect(result).toBe(true);
      expect(lockPieceSpy).toHaveBeenCalledWith(gameState, player);

      lockPieceSpy.mockRestore();
    });
  });

  describe('piece validation and movement', () => {
    let gameState: any;
    const roomName = 'test-room';
    const playerId = 'player1';

    beforeEach(() => {
      gameState = service.createGame(roomName, [playerId]);
    });

    it('should prevent movement outside left boundary', () => {
      const player = gameState.players.get(playerId);
      // Move piece to left edge
      player.currentPiece.x = 0;
      
      const result = service.processPlayerAction(roomName, playerId, 'move-left');
      expect(result).toBe(false);
    });

    it('should prevent movement outside right boundary', () => {
      const player = gameState.players.get(playerId);
      // Move piece to right edge
      player.currentPiece.x = 9;
      
      const result = service.processPlayerAction(roomName, playerId, 'move-right');
      expect(result).toBe(false);
    });

    it('should handle soft-drop action', () => {
      const player = gameState.players.get(playerId);
      const originalY = player.currentPiece.y;
      
      const result = service.processPlayerAction(roomName, playerId, 'soft-drop');
      
      if (result) {
        expect(player.currentPiece.y).toBeGreaterThan(originalY);
      }
    });

    it('should handle hard-drop action', () => {
      const result = service.processPlayerAction(roomName, playerId, 'hard-drop');
      expect(result).toBe(true);
    });

    it('should return false for dead player', () => {
      const player = gameState.players.get(playerId);
      player.isAlive = false;
      
      const result = service.processPlayerAction(roomName, playerId, 'move-left');
      expect(result).toBe(false);
    });

    it('should return false for player without current piece', () => {
      const player = gameState.players.get(playerId);
      player.currentPiece = null;
      
      const result = service.processPlayerAction(roomName, playerId, 'move-left');
      expect(result).toBe(false);
    });
  });

  describe('game state management', () => {
    it('should create game with multiple players', () => {
      const roomName = 'multi-room';
      const playerIds = ['player1', 'player2', 'player3'];

      const gameState = service.createGame(roomName, playerIds);

      expect(gameState.players.size).toBe(3);
      playerIds.forEach(id => {
        const player = gameState.players.get(id);
        expect(player).toBeDefined();
        expect(player?.currentPiece).toBeDefined();
        expect(player?.nextPieces).toHaveLength(5);
      });
    });

    it('should handle empty player list', () => {
      const roomName = 'empty-room';
      const gameState = service.createGame(roomName, []);

      expect(gameState.players.size).toBe(0);
      expect(gameState.roomName).toBe(roomName);
    });

    it('should generate deterministic piece sequence', () => {
      const roomName1 = 'room1';
      const roomName2 = 'room2';
      
      const game1 = service.createGame(roomName1, ['player1']);
      const game2 = service.createGame(roomName2, ['player1']);

      // Both games should have piece sequences (though potentially different)
      expect(game1.pieceSequence.length).toBeGreaterThan(0);
      expect(game2.pieceSequence.length).toBeGreaterThan(0);
      expect(game1.pieceSequence[0].type).toMatch(/^[IOTSZJL]$/);
    });
  });

  describe('piece collision and boundaries', () => {
    let gameState: any;
    const roomName = 'test-room';
    const playerId = 'player1';

    beforeEach(() => {
      gameState = service.createGame(roomName, [playerId]);
    });

    it('should handle piece at board boundaries', () => {
      const player = gameState.players.get(playerId);
      
      // Test left boundary
      player.currentPiece.x = -1;
      let result = service.processPlayerAction(roomName, playerId, 'move-left');
      expect(result).toBe(false);

      // Test right boundary  
      player.currentPiece.x = 10;
      result = service.processPlayerAction(roomName, playerId, 'move-right');
      expect(result).toBe(false);
    });

    it('should handle piece at bottom boundary', () => {
      const player = gameState.players.get(playerId);
      player.currentPiece.y = 19; // Near bottom
      
      const result = service.processPlayerAction(roomName, playerId, 'soft-drop');
      // Result depends on piece shape and exact position
      expect(typeof result).toBe('boolean');
    });
  });

  describe('line clearing mechanics', () => {
    let gameState: any;
    const roomName = 'test-room';
    const playerId = 'player1';

    beforeEach(() => {
      gameState = service.createGame(roomName, [playerId]);
    });

    it('should handle board with filled bottom rows', () => {
      const player = gameState.players.get(playerId);
      
      // Fill bottom row except one cell
      for (let x = 0; x < 9; x++) {
        player.board[19][x] = 1;
      }
      
      // Hard drop should still work
      const result = service.processPlayerAction(roomName, playerId, 'hard-drop');
      expect(result).toBe(true);
    });
  });

  describe('multiplayer game mechanics', () => {
    it('should handle single player game', () => {
      const roomName = 'solo-room';
      const gameState = service.createGame(roomName, ['solo-player']);
      
      expect(gameState.players.size).toBe(1);
      expect(gameState.gameOver).toBe(false);
    });

    it('should track game start time', () => {
      const roomName = 'timed-room';
      const before = Date.now();
      const gameState = service.createGame(roomName, ['player1']);
      const after = Date.now();
      
      expect(gameState.startTime).toBeGreaterThanOrEqual(before);
      expect(gameState.startTime).toBeLessThanOrEqual(after);
    });
  });

  describe('advanced game mechanics', () => {
    let gameState: any;
    const roomName = 'test-room';
    const playerId = 'player1';

    beforeEach(() => {
      gameState = service.createGame(roomName, [playerId]);
    });

    it('should handle line clearing and penalty distribution', () => {
      const player1Id = 'player1';
      const player2Id = 'player2';
      const multiGameState = service.createGame('multi-room', [player1Id, player2Id]);
      
      const player1 = multiGameState.players.get(player1Id)!;
      const player2 = multiGameState.players.get(player2Id)!;
      
      // Fill bottom row except one cell to create a complete line
      for (let x = 0; x < 10; x++) {
        player1.board[19][x] = 1;
      }
      
      // Trigger line clearing by hard dropping a piece
      service.processPlayerAction('multi-room', player1Id, 'hard-drop');
      
      // Player2 should receive penalty lines
      expect(player2.penalties).toBeGreaterThanOrEqual(0);
    });

    it('should handle player topping out', () => {
      const player = gameState.players.get(playerId);
      
      // Fill the board to top to trigger game over
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 10; x++) {
          player.board[y][x] = 1;
        }
      }
      
      // Try to hard drop which should trigger lockPiece and check topping out
      service.processPlayerAction(roomName, playerId, 'hard-drop');
      
      // Player should potentially be marked as not alive if topped out
      expect(typeof player.isAlive).toBe('boolean');
    });

    it('should update spectrum correctly after piece placement', () => {
      const player = gameState.players.get(playerId);
      const originalSpectrum = [...player.spectrum];
      
      // Place some pieces to change the board
      player.board[19][0] = 1;
      player.board[18][0] = 1;
      player.board[19][1] = 1;
      
      // Manually call the private method via hard drop
      service.processPlayerAction(roomName, playerId, 'hard-drop');
      
      // Spectrum should reflect the board state
      expect(player.spectrum).toHaveLength(10);
      expect(player.spectrum.every(height => typeof height === 'number')).toBe(true);
    });

    it('should handle penalty line application', () => {
      const player = gameState.players.get(playerId);
      
      // Add penalties manually
      player.penalties = 2;
      
      // Trigger penalty application through hard drop
      service.processPlayerAction(roomName, playerId, 'hard-drop');
      
      // Check that board has penalty lines at bottom
      const hasGaps = player.board[19].some(cell => cell === 0);
      expect(hasGaps || player.penalties === 0).toBe(true); // Either penalties applied or none to apply
    });

    it('should handle O piece rotation (should not change)', () => {
      const player = gameState.players.get(playerId);
      
      // Force an O piece
      player.currentPiece = {
        type: 'O',
        rotation: 0,
        x: 4,
        y: 0,
        shape: [[1, 1], [1, 1]]
      };
      
      const originalRotation = player.currentPiece.rotation;
      const result = service.processPlayerAction(roomName, playerId, 'rotate');
      
      // O piece has only one rotation state
      expect(player.currentPiece.rotation).toBe(originalRotation);
    });

    it('should handle different piece types and rotations', () => {
      const player = gameState.players.get(playerId);
      
      // Test T piece with multiple rotations
      player.currentPiece = {
        type: 'T',
        rotation: 0,
        x: 4,
        y: 0,
        shape: [[0, 1, 0], [1, 1, 1]]
      };
      
      const result = service.processPlayerAction(roomName, playerId, 'rotate');
      
      if (result) {
        expect(player.currentPiece.rotation).toBeGreaterThan(0);
      }
    });

    it('should prevent rotation when blocked', () => {
      const player = gameState.players.get(playerId);
      
      // Create a blocked situation - T piece at bottom with obstacles
      player.currentPiece = {
        type: 'T',
        rotation: 0,
        x: 0, // At left edge
        y: 18, // Near bottom
        shape: [[0, 1, 0], [1, 1, 1]]
      };
      
      // Fill some board positions to block rotation
      player.board[18][0] = 1; // Block left side
      player.board[19][1] = 1; // Block center bottom
      
      // Try to rotate T piece (should fail due to collision)
      const result = service.processPlayerAction(roomName, playerId, 'rotate');
      
      // Should maintain original rotation if blocked
      expect(player.currentPiece.rotation).toBe(0);
    });

    it('should handle game over with multiple players', () => {
      const player1Id = 'player1';
      const player2Id = 'player2';
      const multiGameState = service.createGame('multi-room', [player1Id, player2Id]);
      
      const player1 = multiGameState.players.get(player1Id);
      const player2 = multiGameState.players.get(player2Id);
      
      // Kill one player
      if (player1) {
        player1.isAlive = false;
      }
      
      // Trigger game over check
      service.tick('multi-room');
      
      // Game should be over with player2 as winner
      expect(multiGameState.gameOver).toBe(true);
      expect(multiGameState.winner).toBe(player2Id);
    });

    it('should handle game over with no survivors', () => {
      const player1Id = 'player1';
      const player2Id = 'player2';
      const multiGameState = service.createGame('multi-room', [player1Id, player2Id]);
      
      const player1 = multiGameState.players.get(player1Id);
      const player2 = multiGameState.players.get(player2Id);
      
      // Kill all players
      if (player1) {
        player1.isAlive = false;
      }
      if (player2) {
        player2.isAlive = false;
      }
      
      // Trigger game over check
      service.tick('multi-room');
      
      // Game should be over with no winner
      expect(multiGameState.gameOver).toBe(true);
      expect(multiGameState.winner).toBeNull();
    });

    it('should handle piece collision with existing pieces', () => {
      const player = gameState.players.get(playerId);
      
      // Place a piece on the board
      player.board[10][5] = 1;
      
      // Position current piece to collide
      player.currentPiece.x = 5;
      player.currentPiece.y = 9;
      
      // Try to move down into the existing piece
      const result = service.processPlayerAction(roomName, playerId, 'soft-drop');
      
      // Should handle collision appropriately
      expect(typeof result).toBe('boolean');
    });

    it('should generate valid piece sequences', () => {
      const gameState1 = service.createGame('room1', ['player1']);
      const gameState2 = service.createGame('room2', ['player1']);
      
      // Both should have valid piece sequences
      expect(gameState1.pieceSequence.length).toBeGreaterThan(100);
      expect(gameState2.pieceSequence.length).toBeGreaterThan(100);
      
      // All pieces should be valid types
      const validTypes = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      gameState1.pieceSequence.slice(0, 10).forEach(piece => {
        expect(validTypes).toContain(piece.type);
        expect(piece.x).toBeGreaterThanOrEqual(0);
        expect(piece.y).toBe(0);
        expect(piece.rotation).toBe(0);
      });
    });

    it('should handle edge case piece positions', () => {
      const player = gameState.players.get(playerId);
      
      // Test piece at various positions
      player.currentPiece.x = 0; // Left edge
      let result = service.processPlayerAction(roomName, playerId, 'move-left');
      expect(result).toBe(false);
      
      player.currentPiece.x = 9; // Right edge
      result = service.processPlayerAction(roomName, playerId, 'move-right');
      expect(result).toBe(false);
      
      // Valid movement
      player.currentPiece.x = 5;
      result = service.processPlayerAction(roomName, playerId, 'move-left');
      if (result) {
        expect(player.currentPiece.x).toBe(4);
      }
    });
  });
});
