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
}
