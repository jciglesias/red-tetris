import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeaderboardService } from './leaderboard/leaderboard.service';

describe('AppController', () => {
  let appController: AppController;

  const mockLeaderboardService = {
    checkDatabaseConnection: jest.fn().mockResolvedValue(true),
    getAllTimeStats: jest.fn().mockResolvedValue({
      topScore: 0,
      topScorePlayer: '',
      mostLinesCleared: 0,
      mostLinesClearedPlayer: '',
      longestGameDuration: 0,
      longestGamePlayer: '',
      totalGames: 0,
    }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: LeaderboardService,
          useValue: mockLeaderboardService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health endpoint', () => {
    it('should return health status when database is connected', async () => {
      const result = await appController.getHealth();
      
      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.totalGames).toBe(0);
      expect(result.timestamp).toBeDefined();
      expect(mockLeaderboardService.checkDatabaseConnection).toHaveBeenCalled();
      expect(mockLeaderboardService.getAllTimeStats).toHaveBeenCalled();
    });

    it('should return error status when database connection fails', async () => {
      mockLeaderboardService.checkDatabaseConnection.mockResolvedValueOnce(false);
      
      const result = await appController.getHealth();
      
      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
      expect(result.error).toBe('Database connection failed');
      expect(result.timestamp).toBeDefined();
    });

    it('should handle exceptions during health check', async () => {
      mockLeaderboardService.checkDatabaseConnection.mockRejectedValueOnce(new Error('Connection error'));
      
      const result = await appController.getHealth();
      
      expect(result.status).toBe('error');
      expect(result.database).toBe('disconnected');
      expect(result.error).toBe('Connection error');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('route handling', () => {
    it('should handle room/player routes', () => {
      const mockResponse = {
        json: jest.fn(),
      };
      
      appController.serveClientApp('test-room', 'test-player', mockResponse as any);
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Room/Player route working',
        room: 'test-room',
        player: 'test-player',
        url: '/test-room/test-player',
        note: 'Route is working. In production, this would serve the React app.'
      });
    });

    it('should handle fallback routes', () => {
      const mockResponse = {
        json: jest.fn(),
        req: { url: '/some-path' }
      };
      
      appController.serveApp(mockResponse as any);
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Catch-all route working',
        path: '/some-path',
        note: 'Route is working. In production, this would serve the React app.'
      });
    });
  });
});
