import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LeaderboardService, CreateLeaderboardEntryDto } from './leaderboard.service';

@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('top')
  async getTopScores(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    const validLimit = isNaN(numLimit) || numLimit < 0 ? 10 : numLimit;
    return await this.leaderboardService.getTopScores(validLimit);
  }

  @Get('player')
  async getPlayerBestScore(@Query('name') playerName: string) {
    return await this.leaderboardService.getPlayerBestScore(playerName);
  }

  @Get('stats')
  async getAllTimeStats() {
    return await this.leaderboardService.getAllTimeStats();
  }

  @Get('player-stats')
  async getPlayerStatistics(@Query('name') playerName: string) {
    if (!playerName) {
      return { error: 'Player name is required' };
    }
    return await this.leaderboardService.getPlayerStatistics(playerName);
  }

  @Get('top-winners')
  async getTopWinners(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    const validLimit = isNaN(numLimit) || numLimit < 0 ? 10 : numLimit;
    return await this.leaderboardService.getTopWinners(validLimit);
  }
}
