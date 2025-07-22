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
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
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

  describe('getTopScoresByMode', () => {
    it('should return top scores without mode filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 1, playerName: 'Player1', score: 2000, fastMode: false },
          { id: 2, playerName: 'Player2', score: 1500, fastMode: true },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTopScoresByMode(5);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('entry.score', 'DESC');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return top scores filtered by fast mode', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 1, playerName: 'Player1', score: 2000, fastMode: true },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTopScoresByMode(10, true);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entry.fastMode = :fastMode', { fastMode: true });
      expect(result).toHaveLength(1);
      expect(result[0].fastMode).toBe(true);
    });

    it('should return top scores filtered by normal mode', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 1, playerName: 'Player1', score: 2000, fastMode: false },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTopScoresByMode(10, false);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entry.fastMode = :fastMode', { fastMode: false });
      expect(result).toHaveLength(1);
      expect(result[0].fastMode).toBe(false);
    });
  });

  describe('getPlayerBestScoreByMode', () => {
    it('should return player best score without mode filter', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 1,
          playerName: 'TestPlayer',
          score: 1500,
          fastMode: false,
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPlayerBestScoreByMode('TestPlayer');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entry.playerName = :playerName', { playerName: 'TestPlayer' });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('entry.score', 'DESC');
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result!.playerName).toBe('TestPlayer');
    });

    it('should return player best score filtered by fast mode', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          id: 1,
          playerName: 'TestPlayer',
          score: 2000,
          fastMode: true,
        }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPlayerBestScoreByMode('TestPlayer', true);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('entry.playerName = :playerName', { playerName: 'TestPlayer' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('entry.fastMode = :fastMode', { fastMode: true });
      expect(result).toBeDefined();
      expect(result!.fastMode).toBe(true);
    });

    it('should return null if player not found in mode', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPlayerBestScoreByMode('NonExistentPlayer', false);

      expect(result).toBeNull();
    });
  });

  describe('getPlayerStatistics', () => {
    it('should return default stats for non-existent player', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getPlayerStatistics('NonExistentPlayer');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { playerName: 'NonExistentPlayer' },
      });
      expect(result).toEqual({
        totalGames: 0,
        gamesWon: 0,
        bestScore: 0,
        totalLinesCleared: 0,
        averageGameDuration: 0,
        winRate: 0,
      });
    });

    it('should return correct stats for existing player', async () => {
      const mockEntries = [
        {
          id: 1,
          playerName: 'TestPlayer',
          score: 1000,
          linesCleared: 10,
          gameDuration: 300,
          isWin: true,
        },
        {
          id: 2,
          playerName: 'TestPlayer',
          score: 1500,
          linesCleared: 15,
          gameDuration: 400,
          isWin: false,
        },
        {
          id: 3,
          playerName: 'TestPlayer',
          score: 800,
          linesCleared: 8,
          gameDuration: 250,
          isWin: true,
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntries);

      const result = await service.getPlayerStatistics('TestPlayer');

      expect(result).toEqual({
        totalGames: 3,
        gamesWon: 2,
        bestScore: 1500,
        totalLinesCleared: 33,
        averageGameDuration: 316.6666666666667, // (300 + 400 + 250) / 3
        winRate: expect.closeTo(66.67, 2), // (2/3) * 100, allowing for floating point precision
      });
    });

    it('should handle single game correctly', async () => {
      const mockEntries = [
        {
          id: 1,
          playerName: 'TestPlayer',
          score: 1000,
          linesCleared: 10,
          gameDuration: 300,
          isWin: false,
        },
      ];

      mockRepository.find.mockResolvedValue(mockEntries);

      const result = await service.getPlayerStatistics('TestPlayer');

      expect(result).toEqual({
        totalGames: 1,
        gamesWon: 0,
        bestScore: 1000,
        totalLinesCleared: 10,
        averageGameDuration: 300,
        winRate: 0,
      });
    });
  });

  describe('getTopWinners', () => {
    it('should return top winners with default limit', async () => {
      const mockQueryResult = [
        {
          playerName: 'Winner1',
          totalGames: '5',
          gamesWon: '4',
          bestScore: '2000',
          winRate: '80.00',
        },
        {
          playerName: 'Winner2',
          totalGames: '10',
          gamesWon: '7',
          bestScore: '1800',
          winRate: '70.00',
        },
      ];

      mockRepository.query.mockResolvedValue(mockQueryResult);

      const result = await service.getTopWinners();

      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [10]
      );
      expect(result).toEqual([
        {
          playerName: 'Winner1',
          gamesWon: 4,
          winRate: 80.00,
          bestScore: 2000,
        },
        {
          playerName: 'Winner2',
          gamesWon: 7,
          winRate: 70.00,
          bestScore: 1800,
        },
      ]);
    });

    it('should return top winners with custom limit', async () => {
      const mockQueryResult = [
        {
          playerName: 'Winner1',
          totalGames: '3',
          gamesWon: '3',
          bestScore: '1500',
          winRate: '100.00',
        },
      ];

      mockRepository.query.mockResolvedValue(mockQueryResult);

      const result = await service.getTopWinners(5);

      expect(mockRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ?'),
        [5]
      );
      expect(result).toHaveLength(1);
      expect(result[0].gamesWon).toBe(3);
      expect(result[0].winRate).toBe(100.00);
    });

    it('should return empty array when no winners found', async () => {
      mockRepository.query.mockResolvedValue([]);

      const result = await service.getTopWinners();

      expect(result).toEqual([]);
    });

    it('should handle string to number conversion correctly', async () => {
      const mockQueryResult = [
        {
          playerName: 'Winner1',
          totalGames: '15',
          gamesWon: '12',
          bestScore: '5000',
          winRate: '80.00',
        },
      ];

      mockRepository.query.mockResolvedValue(mockQueryResult);

      const result = await service.getTopWinners(1);

      expect(result[0]).toEqual({
        playerName: 'Winner1',
        gamesWon: 12, // Should be converted to number
        winRate: 80.00, // Should be converted to number
        bestScore: 5000, // Should be converted to number
      });
    });
  });

  describe('addEntry with all optional fields', () => {
    it('should create and save entry with all fields including optional ones', async () => {
      const createDto: CreateLeaderboardEntryDto = {
        playerName: 'TestPlayer',
        score: 1000,
        linesCleared: 10,
        level: 5,
        gameDuration: 300,
        fastMode: true,
        isWin: true,
        roomName: 'TestRoom',
      };

      const mockEntry = { id: 1, ...createDto, createdAt: new Date() };
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);

      const result = await service.addEntry(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockEntry);
      expect(result.fastMode).toBe(true);
      expect(result.isWin).toBe(true);
    });

    it('should handle minimal entry data', async () => {
      const createDto: CreateLeaderboardEntryDto = {
        playerName: 'MinimalPlayer',
        score: 500,
        linesCleared: 5,
        level: 2,
        gameDuration: 150,
      };

      const mockEntry = { 
        id: 2, 
        ...createDto, 
        fastMode: false, 
        isWin: false, 
        roomName: null,
        createdAt: new Date() 
      };
      mockRepository.create.mockReturnValue(mockEntry);
      mockRepository.save.mockResolvedValue(mockEntry);

      const result = await service.addEntry(createDto);

      expect(result.fastMode).toBe(false);
      expect(result.isWin).toBe(false);
      expect(result.roomName).toBeNull();
    });
  });
});
