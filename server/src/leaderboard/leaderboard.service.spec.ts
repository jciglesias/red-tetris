import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardService, CreateLeaderboardEntryDto } from './leaderboard.service';
import { LeaderboardEntry } from './leaderboard.entity';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let repository: Repository<LeaderboardEntry>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: getRepositoryToken(LeaderboardEntry),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    repository = module.get<Repository<LeaderboardEntry>>(getRepositoryToken(LeaderboardEntry));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addEntry', () => {
    it('should create and save a leaderboard entry', async () => {
      const createDto: CreateLeaderboardEntryDto = {
        playerName: 'TestPlayer',
        score: 1000,
        linesCleared: 10,
        level: 5,
        gameDuration: 300,
        roomName: 'TestRoom',
      };

      const mockEntry = { id: 1, ...createDto };
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);

      const result = await service.addEntry(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEntry);
      expect(result).toEqual(mockEntry);
    });
  });

  describe('getTopScores', () => {
    it('should return top scores with default limit', async () => {
      const mockEntries = [
        { id: 1, playerName: 'Player1', score: 2000 },
        { id: 2, playerName: 'Player2', score: 1500 },
      ];
      mockRepository.find.mockResolvedValue(mockEntries);

      const result = await service.getTopScores();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { score: 'DESC' },
        take: 10,
      });
      expect(result).toEqual(mockEntries);
    });

    it('should return top scores with custom limit', async () => {
      const mockEntries = [
        { id: 1, playerName: 'Player1', score: 2000 },
      ];
      mockRepository.find.mockResolvedValue(mockEntries);

      const result = await service.getTopScores(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { score: 'DESC' },
        take: 5,
      });
      expect(result).toEqual(mockEntries);
    });
  });

  describe('getPlayerBestScore', () => {
    it('should return player best score', async () => {
      const mockEntry = { id: 1, playerName: 'TestPlayer', score: 1500 };
      mockRepository.findOne.mockResolvedValue(mockEntry);

      const result = await service.getPlayerBestScore('TestPlayer');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { playerName: 'TestPlayer' },
        order: { score: 'DESC' },
      });
      expect(result).toEqual(mockEntry);
    });

    it('should return null if player not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getPlayerBestScore('NonExistentPlayer');

      expect(result).toBeNull();
    });
  });

  describe('checkDatabaseConnection', () => {
    it('should return true when database connection is successful', async () => {
      mockRepository.count.mockResolvedValue(5);

      const result = await service.checkDatabaseConnection();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when database connection fails', async () => {
      mockRepository.count.mockRejectedValue(new Error('Database error'));

      const result = await service.checkDatabaseConnection();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('getAllTimeStats', () => {
    it('should return default stats when no games exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.getAllTimeStats();

      expect(result).toEqual({
        topScore: 0,
        topScorePlayer: '',
        mostLinesCleared: 0,
        mostLinesClearedPlayer: '',
        longestGameDuration: 0,
        longestGamePlayer: '',
        totalGames: 0,
      });
    });

    it('should return stats when games exist', async () => {
      mockRepository.count.mockResolvedValue(3);
      
      const topScoreEntry = { id: 1, playerName: 'TopPlayer', score: 5000, linesCleared: 50, gameDuration: 600 };
      const mostLinesClearedEntry = { id: 2, playerName: 'LinesPlayer', score: 3000, linesCleared: 80, gameDuration: 400 };
      const longestGameEntry = { id: 3, playerName: 'LongestPlayer', score: 2000, linesCleared: 30, gameDuration: 900 };

      mockRepository.find
        .mockResolvedValueOnce([topScoreEntry]) // For top score
        .mockResolvedValueOnce([mostLinesClearedEntry]) // For most lines cleared
        .mockResolvedValueOnce([longestGameEntry]); // For longest game

      const result = await service.getAllTimeStats();

      expect(mockRepository.count).toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledTimes(3);
      expect(mockRepository.find).toHaveBeenNthCalledWith(1, { order: { score: 'DESC' }, take: 1 });
      expect(mockRepository.find).toHaveBeenNthCalledWith(2, { order: { linesCleared: 'DESC' }, take: 1 });
      expect(mockRepository.find).toHaveBeenNthCalledWith(3, { order: { gameDuration: 'DESC' }, take: 1 });

      expect(result).toEqual({
        topScore: 5000,
        topScorePlayer: 'TopPlayer',
        mostLinesCleared: 80,
        mostLinesClearedPlayer: 'LinesPlayer',
        longestGameDuration: 900,
        longestGamePlayer: 'LongestPlayer',
        totalGames: 3,
      });
    });

    it('should handle null entries gracefully', async () => {
      mockRepository.count.mockResolvedValue(1);
      mockRepository.find.mockResolvedValue([]); // Empty array means no entries found

      const result = await service.getAllTimeStats();

      expect(result).toEqual({
        topScore: 0,
        topScorePlayer: '',
        mostLinesCleared: 0,
        mostLinesClearedPlayer: '',
        longestGameDuration: 0,
        longestGamePlayer: '',
        totalGames: 1,
      });
    });
  });
});
