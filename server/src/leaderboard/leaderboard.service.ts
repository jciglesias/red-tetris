import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntry } from './leaderboard.entity';

export interface CreateLeaderboardEntryDto {
  playerName: string;
  score: number;
  linesCleared: number;
  level: number;
  gameDuration: number;
  fastMode?: boolean;
  isWin?: boolean;
  roomName?: string;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  async addEntry(data: CreateLeaderboardEntryDto): Promise<LeaderboardEntry> {
    const entry = this.leaderboardRepository.create(data);
    return await this.leaderboardRepository.save(entry);
  }

  async getTopScores(limit: number = 10): Promise<LeaderboardEntry[]> {
    return await this.leaderboardRepository.find({
      order: { score: 'DESC' },
      take: limit,
    });
  }

  async getPlayerBestScore(playerName: string): Promise<LeaderboardEntry | null> {
    return await this.leaderboardRepository.findOne({
      where: { playerName },
      order: { score: 'DESC' },
    });
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      // Simple query to test database connection
      await this.leaderboardRepository.count();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAllTimeStats() {
    const totalGames = await this.leaderboardRepository.count();
    
    if (totalGames === 0) {
      return {
        topScore: 0,
        topScorePlayer: '',
        mostLinesCleared: 0,
        mostLinesClearedPlayer: '',
        longestGameDuration: 0,
        longestGamePlayer: '',
        totalGames: 0,
      };
    }

    const topScore = await this.leaderboardRepository.find({
      order: { score: 'DESC' },
      take: 1,
    });

    const mostLinesCleared = await this.leaderboardRepository.find({
      order: { linesCleared: 'DESC' },
      take: 1,
    });

    const longestGame = await this.leaderboardRepository.find({
      order: { gameDuration: 'DESC' },
      take: 1,
    });

    return {
      topScore: topScore[0]?.score || 0,
      topScorePlayer: topScore[0]?.playerName || '',
      mostLinesCleared: mostLinesCleared[0]?.linesCleared || 0,
      mostLinesClearedPlayer: mostLinesCleared[0]?.playerName || '',
      longestGameDuration: longestGame[0]?.gameDuration || 0,
      longestGamePlayer: longestGame[0]?.playerName || '',
      totalGames,
    };
  }

  async getTopScoresByMode(limit: number = 10, fastMode?: boolean): Promise<LeaderboardEntry[]> {
    const queryBuilder = this.leaderboardRepository.createQueryBuilder('entry');
    
    if (fastMode !== undefined) {
      queryBuilder.where('entry.fastMode = :fastMode', { fastMode });
    }
    
    return await queryBuilder
      .orderBy('entry.score', 'DESC')
      .take(limit)
      .getMany();
  }

  async getPlayerBestScoreByMode(playerName: string, fastMode?: boolean): Promise<LeaderboardEntry | null> {
    const queryBuilder = this.leaderboardRepository.createQueryBuilder('entry')
      .where('entry.playerName = :playerName', { playerName });
    
    if (fastMode !== undefined) {
      queryBuilder.andWhere('entry.fastMode = :fastMode', { fastMode });
    }
    
    return await queryBuilder
      .orderBy('entry.score', 'DESC')
      .getOne();
  }

  async getPlayerStatistics(playerName: string): Promise<{
    totalGames: number;
    gamesWon: number;
    bestScore: number;
    totalLinesCleared: number;
    averageGameDuration: number;
    winRate: number;
  }> {
    const playerEntries = await this.leaderboardRepository.find({
      where: { playerName },
    });

    if (playerEntries.length === 0) {
      return {
        totalGames: 0,
        gamesWon: 0,
        bestScore: 0,
        totalLinesCleared: 0,
        averageGameDuration: 0,
        winRate: 0,
      };
    }

    const totalGames = playerEntries.length;
    const gamesWon = playerEntries.filter(entry => entry.isWin).length;
    const bestScore = Math.max(...playerEntries.map(entry => entry.score));
    const totalLinesCleared = playerEntries.reduce((sum, entry) => sum + entry.linesCleared, 0);
    const averageGameDuration = playerEntries.reduce((sum, entry) => sum + entry.gameDuration, 0) / totalGames;
    const winRate = totalGames > 0 ? (gamesWon / totalGames) * 100 : 0;

    return {
      totalGames,
      gamesWon,
      bestScore,
      totalLinesCleared,
      averageGameDuration,
      winRate,
    };
  }

  async getTopWinners(limit: number = 10): Promise<Array<{
    playerName: string;
    gamesWon: number;
    winRate: number;
    bestScore: number;
  }>> {
    const query = `
      SELECT 
        playerName,
        COUNT(*) as totalGames,
        SUM(CASE WHEN isWin = 1 THEN 1 ELSE 0 END) as gamesWon,
        MAX(score) as bestScore,
        CAST(SUM(CASE WHEN isWin = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as winRate
      FROM leaderboard 
      GROUP BY playerName 
      HAVING totalGames >= 3
      ORDER BY gamesWon DESC, winRate DESC 
      LIMIT ?
    `;

    const result = await this.leaderboardRepository.query(query, [limit]);
    
    return result.map((row: any) => ({
      playerName: row.playerName,
      gamesWon: parseInt(row.gamesWon),
      winRate: parseFloat(row.winRate),
      bestScore: parseInt(row.bestScore),
    }));
  }
}
