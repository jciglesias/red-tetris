import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { RoomGateway } from './room/room.gateway';
import { RoomService } from './room/room.service';
import { GameService } from './game/game.service';
import { GameLoopService } from './game/game-loop.service';

describe('AppModule', () => {
  let module: TestingModule;

  const mockLeaderboardService = {
    checkDatabaseConnection: jest.fn().mockResolvedValue(true),
    getAllTimeStats: jest.fn().mockResolvedValue({
      totalGames: 0,
    }),
  };

  const mockRoomService = {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    getRoomInfo: jest.fn(),
  };

  const mockGameService = {
    startGame: jest.fn(),
    handleGameAction: jest.fn(),
  };

  const mockGameLoopService = {
    startGameLoop: jest.fn(),
    stopGameLoop: jest.fn(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: LeaderboardService,
          useValue: mockLeaderboardService,
        },
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
        {
          provide: GameService,
          useValue: mockGameService,
        },
        {
          provide: GameLoopService,
          useValue: mockGameLoopService,
        },
        RoomGateway,
      ],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have AppController', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
    expect(controller).toBeInstanceOf(AppController);
  });

  it('should have AppService', () => {
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AppService);
  });

  it('should inject AppService into AppController', () => {
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
    // The controller should have the service injected
    expect(controller.getHello()).toBe('Hello World!');
  });

  describe('module compilation', () => {
    it('should compile successfully', () => {
      expect(module).toBeDefined();
    });

    it('should create module with all dependencies', () => {
      const appController = module.get<AppController>(AppController);
      const appService = module.get<AppService>(AppService);
      const leaderboardService = module.get<LeaderboardService>(LeaderboardService);
      
      expect(appController).toBeDefined();
      expect(appService).toBeDefined();
      expect(leaderboardService).toBeDefined();
    });
  });
});
