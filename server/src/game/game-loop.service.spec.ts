import { Test, TestingModule } from '@nestjs/testing';
import { GameLoopService } from './game-loop.service';
import { GameService } from './game.service';
import { RoomService } from '../room/room.service';

describe('GameLoopService', () => {
  let service: GameLoopService;
  let gameService: GameService;
  let roomService: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameLoopService,
        {
          provide: GameService,
          useValue: {
            getGameState: jest.fn(),
            tick: jest.fn(),
            createGame: jest.fn(),
          },
        },
        {
          provide: RoomService,
          useValue: {
            cleanupExpiredDisconnections: jest.fn(),
            endGame: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<GameLoopService>(GameLoopService);
    gameService = module.get<GameService>(GameService);
    roomService = module.get<RoomService>(RoomService);
    
    // Clear any existing intervals
    if (service && service.onModuleDestroy) {
      service.onModuleDestroy();
    }
  });

  afterEach(() => {
    // Clean up intervals
    if (service && service.onModuleDestroy) {
      service.onModuleDestroy();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('lifecycle management', () => {
    it('should start game loop on module init', () => {
      const spy = jest.spyOn(service as any, 'startGameLoop');
      service.onModuleInit();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should start cleanup loop on module init', () => {
      const spy = jest.spyOn(service as any, 'startCleanupLoop');
      service.onModuleInit();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should stop game loop on module destroy', () => {
      service.onModuleInit();
      const spy = jest.spyOn(service as any, 'stopGameLoop');
      service.onModuleDestroy();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should stop cleanup loop on module destroy', () => {
      service.onModuleInit();
      const spy = jest.spyOn(service as any, 'stopCleanupLoop');
      service.onModuleDestroy();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('active games management', () => {
    it('should add active game', () => {
      const roomName = 'test-room';
      service.addActiveGame(roomName);
      
      // Verify by checking if tick processes the room
      (gameService.getGameState as jest.Mock).mockReturnValue({ gameOver: false });
      
      // Trigger tick manually
      (service as any).tick();
      
      expect(gameService.tick).toHaveBeenCalledWith(roomName, false);
    });

    it('should remove active game', () => {
      const roomName = 'test-room';
      service.addActiveGame(roomName);
      service.removeActiveGame(roomName);
      
      // Trigger tick manually
      (service as any).tick();
      
      expect(gameService.tick).not.toHaveBeenCalled();
    });

    it('should remove game when game is over', () => {
      const roomName = 'test-room';
      service.addActiveGame(roomName);
      
      // Mock game over state
      (gameService.getGameState as jest.Mock).mockReturnValue({ gameOver: true });
      
      // Trigger tick manually
      (service as any).tick();
      
      // Game should not be ticked when over
      expect(gameService.tick).not.toHaveBeenCalled();
    });

    it('should remove game when game state is null', () => {
      const roomName = 'test-room';
      service.addActiveGame(roomName);
      
      // Mock null game state
      (gameService.getGameState as jest.Mock).mockReturnValue(null);
      
      // Trigger tick manually
      (service as any).tick();
      
      expect(gameService.tick).not.toHaveBeenCalled();
    });
  });

  describe('tick rate management', () => {
    it('should set new tick rate', () => {
      const newRate = 500;
      const stopSpy = jest.spyOn(service as any, 'stopGameLoop');
      const startSpy = jest.spyOn(service as any, 'startGameLoop');
      
      service.setTickRate(newRate);
      
      expect(stopSpy).toHaveBeenCalled();
      expect(startSpy).toHaveBeenCalled();
      expect((service as any).tickInterval).toBe(newRate);
      
      stopSpy.mockRestore();
      startSpy.mockRestore();
    });
  });

  describe('tick processing', () => {
    it('should process multiple active games', () => {
      const room1 = 'room1';
      const room2 = 'room2';
      
      service.addActiveGame(room1);
      service.addActiveGame(room2);
      
      (gameService.getGameState as jest.Mock).mockReturnValue({ gameOver: false });
      
      // Trigger tick manually
      (service as any).tick();
      
      expect(gameService.tick).toHaveBeenCalledWith(room1, false);
      expect(gameService.tick).toHaveBeenCalledWith(room2, false);
      expect(gameService.tick).toHaveBeenCalledTimes(2);
    });

    it('should handle empty active games list', () => {
      // Trigger tick with no active games
      (service as any).tick();
      
      expect(gameService.tick).not.toHaveBeenCalled();
    });

    it('should continue processing valid games when some are invalid', () => {
      const validRoom = 'valid-room';
      const invalidRoom = 'invalid-room';
      
      service.addActiveGame(validRoom);
      service.addActiveGame(invalidRoom);
      
      // Mock one valid, one invalid game state
      (gameService.getGameState as jest.Mock)
        .mockReturnValueOnce({ gameOver: false }) // valid room
        .mockReturnValueOnce(null); // invalid room
      
      // Trigger tick manually
      (service as any).tick();
      
      expect(gameService.tick).toHaveBeenCalledWith(validRoom, false);
      expect(gameService.tick).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup functionality', () => {
    it('should cleanup expired disconnections', () => {
      // Trigger cleanup manually
      (service as any).cleanupInactiveGames();
      
      expect(roomService.cleanupExpiredDisconnections).toHaveBeenCalled();
    });

    it('should remove inactive games during cleanup', () => {
      const room1 = 'active-room';
      const room2 = 'inactive-room';
      
      service.addActiveGame(room1);
      service.addActiveGame(room2);
      
      // Mock one active, one inactive game
      (gameService.getGameState as jest.Mock)
        .mockReturnValueOnce({ gameOver: false }) // active room
        .mockReturnValueOnce({ gameOver: true }); // inactive room
      
      // Trigger cleanup manually
      (service as any).cleanupInactiveGames();
      
      expect(roomService.cleanupExpiredDisconnections).toHaveBeenCalled();
      
      // Verify that only active game remains by checking tick behavior
      jest.clearAllMocks();
      (gameService.getGameState as jest.Mock).mockReturnValue({ gameOver: false });
      
      (service as any).tick();
      
      // Only the active room should be processed
      expect(gameService.tick).toHaveBeenCalledWith(room1, false);
      expect(gameService.tick).toHaveBeenCalledTimes(1);
    });

    it('should remove games with null state during cleanup', () => {
      const room1 = 'valid-room';
      const room2 = 'null-room';
      
      service.addActiveGame(room1);
      service.addActiveGame(room2);
      
      // Mock one valid, one null game state
      (gameService.getGameState as jest.Mock)
        .mockReturnValueOnce({ gameOver: false }) // valid room
        .mockReturnValueOnce(null); // null room
      
      // Trigger cleanup manually
      (service as any).cleanupInactiveGames();
      
      expect(roomService.cleanupExpiredDisconnections).toHaveBeenCalled();
      
      // Verify that only valid game remains
      jest.clearAllMocks();
      (gameService.getGameState as jest.Mock).mockReturnValue({ gameOver: false });
      
      (service as any).tick();
      
      // Only the valid room should be processed
      expect(gameService.tick).toHaveBeenCalledWith(room1, false);
      expect(gameService.tick).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup with no active games', () => {
      // Trigger cleanup with no active games
      (service as any).cleanupInactiveGames();
      
      expect(roomService.cleanupExpiredDisconnections).toHaveBeenCalled();
      expect(gameService.getGameState).not.toHaveBeenCalled();
    });
  });

  describe('interval management', () => {
    it('should clear existing interval when stopping', () => {
      service.onModuleInit();
      
      const intervalId = (service as any).intervalId;
      expect(intervalId).toBeDefined();
      
      service.onModuleDestroy();
      
      expect((service as any).intervalId).toBeNull();
    });

    it('should clear cleanup interval when stopping', () => {
      service.onModuleInit();
      
      const cleanupIntervalId = (service as any).cleanupIntervalId;
      expect(cleanupIntervalId).toBeDefined();
      
      service.onModuleDestroy();
      
      expect((service as any).cleanupIntervalId).toBeNull();
    });

    it('should clear interval when stopping game loop', () => {
      // Start the game loop to create an interval
      service.onModuleInit();
      
      // Mock clearInterval to track if it's called
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      // Stop the game loop
      service.onModuleDestroy();
      
      // Verify clearInterval was called
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });

    it('should handle stopping game loop when no interval exists', () => {
      // Don't start game loop first
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      // Try to stop when no interval is running
      service.onModuleDestroy();
      
      // clearInterval should not be called since intervalId is null
      expect(clearIntervalSpy).not.toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });

    it('should handle stopping cleanup loop when no interval exists', () => {
      // Don't start cleanup loop first
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      // Call stopCleanupLoop directly
      (service as any).stopCleanupLoop();
      
      // clearInterval should not be called since cleanupIntervalId is null
      expect(clearIntervalSpy).not.toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });
  });

  it('should execute tick within the interval', async () => {
    // Mock the tick method to track if it's called
    const tickSpy = jest.spyOn(service as any, 'tick');
    
    // Start the game loop
    service.onModuleInit();
    
    // Wait for the interval to execute at least once
    await new Promise(resolve => setTimeout(resolve, service['tickInterval'] + 10));
    
    // Verify tick was called by the interval
    expect(tickSpy).toHaveBeenCalled();
    
    // Clean up
    service.onModuleDestroy();
    tickSpy.mockRestore();
  });

  describe('game ending and leaderboard integration', () => {
    it('should save results when game ends naturally during tick', async () => {
      const roomName = 'auto-end-room';
      
      // Mock the endGame method to verify it gets called
      const roomServiceSpy = jest.spyOn(service['roomService'], 'endGame').mockResolvedValue(true);
      
      // Create a mock game state that starts as not over, then becomes over
      const mockGameState = {
        roomName,
        players: new Map(),
        gameOver: false,
        winner: null,
        startTime: Date.now(),
        pieceSequence: [],
        fastMode: false,
      };
      
      // Mock getGameState to return our mock game state
      const getGameStateSpy = jest.spyOn(gameService, 'getGameState').mockReturnValue(mockGameState);
      
      // Add the game to active games
      service.addActiveGame(roomName, false);
      
      // First tick - game is running
      await service['tick']();
      expect(roomServiceSpy).not.toHaveBeenCalled();
      
      // Now set game as over
      mockGameState.gameOver = true;
      
      // Second tick - should detect game ended and call endGame
      await service['tick']();
      
      // Verify endGame was called
      expect(roomServiceSpy).toHaveBeenCalledWith(roomName);
      expect(service['activeGames'].has(roomName)).toBe(false);
      
      roomServiceSpy.mockRestore();
      getGameStateSpy.mockRestore();
    });

    it('should not call endGame twice for same game', async () => {
      const roomName = 'already-ended-room';
      
      const roomServiceSpy = jest.spyOn(service['roomService'], 'endGame').mockResolvedValue(true);
      
      // Create a game that's already over
      const mockGameState = {
        roomName,
        players: new Map(),
        gameOver: true,
        winner: null,
        startTime: Date.now(),
        pieceSequence: [],
        fastMode: false,
      };
      
      const getGameStateSpy = jest.spyOn(gameService, 'getGameState').mockReturnValue(mockGameState);
      
      service.addActiveGame(roomName, false);
      
      // First tick should call endGame and remove from active games
      await service['tick']();
      expect(roomServiceSpy).toHaveBeenCalledTimes(1);
      expect(service['activeGames'].has(roomName)).toBe(false);
      
      // Second tick should not call endGame again since game is no longer active
      await service['tick']();
      expect(roomServiceSpy).toHaveBeenCalledTimes(1);
      
      roomServiceSpy.mockRestore();
      getGameStateSpy.mockRestore();
    });
  });
});
