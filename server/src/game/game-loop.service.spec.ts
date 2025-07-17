import { Test, TestingModule } from '@nestjs/testing';
import { GameLoopService } from './game-loop.service';
import { GameService } from './game.service';

describe('GameLoopService', () => {
  let service: GameLoopService;
  let gameService: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameLoopService,
        {
          provide: GameService,
          useValue: {
            getGameState: jest.fn(),
            tick: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GameLoopService>(GameLoopService);
    gameService = module.get<GameService>(GameService);
    
    // Clear any existing intervals
    service.onModuleDestroy();
  });

  afterEach(() => {
    // Clean up intervals
    service.onModuleDestroy();
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

    it('should stop game loop on module destroy', () => {
      service.onModuleInit();
      const spy = jest.spyOn(service as any, 'stopGameLoop');
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
      
      expect(gameService.tick).toHaveBeenCalledWith(roomName);
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
      
      expect(gameService.tick).toHaveBeenCalledWith(room1);
      expect(gameService.tick).toHaveBeenCalledWith(room2);
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
      
      expect(gameService.tick).toHaveBeenCalledWith(validRoom);
      expect(gameService.tick).toHaveBeenCalledTimes(1);
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
});
