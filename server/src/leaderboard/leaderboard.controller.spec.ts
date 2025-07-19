import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService, CreateLeaderboardEntryDto } from './leaderboard.service';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let service: LeaderboardService;

  const mockLeaderboardService = {
    addEntry: jest.fn(),
    getTopScores: jest.fn(),
    getPlayerBestScore: jest.fn(),
    getAllTimeStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [
        {
          provide: LeaderboardService,
          useValue: mockLeaderboardService,
        },
      ],
    }).compile();

    controller = module.get<LeaderboardController>(LeaderboardController);
    service = module.get<LeaderboardService>(LeaderboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addEntry', () => {
    it('should add a leaderboard entry', async () => {
      const createDto: CreateLeaderboardEntryDto = {
        playerName: 'TestPlayer',
        score: 1000,
        linesCleared: 10,
        level: 5,
        gameDuration: 300,
        roomName: 'TestRoom',
      };

      const mockEntry = { id: 1, ...createDto };
      mockLeaderboardService.addEntry.mockResolvedValue(mockEntry);

      const result = await controller.addEntry(createDto);

      expect(mockLeaderboardService.addEntry).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockEntry);
    });
  });

  describe('getTopScores', () => {
    it('should return top scores with default limit', async () => {
      const mockEntries = [
        { id: 1, playerName: 'Player1', score: 2000 },
        { id: 2, playerName: 'Player2', score: 1500 },
      ];
      mockLeaderboardService.getTopScores.mockResolvedValue(mockEntries);

      const result = await controller.getTopScores();

      expect(mockLeaderboardService.getTopScores).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockEntries);
    });

    it('should return top scores with custom limit', async () => {
      const mockEntries = [
        { id: 1, playerName: 'Player1', score: 2000 },
      ];
      mockLeaderboardService.getTopScores.mockResolvedValue(mockEntries);

      const result = await controller.getTopScores('5');

      expect(mockLeaderboardService.getTopScores).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockEntries);
    });

    it('should handle invalid limit parameter', async () => {
      const mockEntries = [
        { id: 1, playerName: 'Player1', score: 2000 },
      ];
      mockLeaderboardService.getTopScores.mockResolvedValue(mockEntries);

      const result = await controller.getTopScores('invalid');

      expect(mockLeaderboardService.getTopScores).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockEntries);
    });
  });

  describe('getPlayerBestScore', () => {
    it('should return player best score', async () => {
      const mockEntry = { id: 1, playerName: 'TestPlayer', score: 1500 };
      mockLeaderboardService.getPlayerBestScore.mockResolvedValue(mockEntry);

      const result = await controller.getPlayerBestScore('TestPlayer');

      expect(mockLeaderboardService.getPlayerBestScore).toHaveBeenCalledWith('TestPlayer');
      expect(result).toEqual(mockEntry);
    });

    it('should return null for non-existent player', async () => {
      mockLeaderboardService.getPlayerBestScore.mockResolvedValue(null);

      const result = await controller.getPlayerBestScore('NonExistentPlayer');

      expect(mockLeaderboardService.getPlayerBestScore).toHaveBeenCalledWith('NonExistentPlayer');
      expect(result).toBeNull();
    });
  });

  describe('getAllTimeStats', () => {
    it('should return all time stats', async () => {
      const mockStats = {
        topScore: 5000,
        topScorePlayer: 'TopPlayer',
        mostLinesCleared: 80,
        mostLinesClearedPlayer: 'LinesPlayer',
        longestGameDuration: 900,
        longestGamePlayer: 'LongestPlayer',
        totalGames: 10,
      };
      mockLeaderboardService.getAllTimeStats.mockResolvedValue(mockStats);

      const result = await controller.getAllTimeStats();

      expect(mockLeaderboardService.getAllTimeStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});
