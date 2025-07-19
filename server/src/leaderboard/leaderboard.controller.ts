import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LeaderboardService, CreateLeaderboardEntryDto } from './leaderboard.service';

@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post()
  async addEntry(@Body() data: CreateLeaderboardEntryDto) {
    return await this.leaderboardService.addEntry(data);
  }

  @Get('top')
  async getTopScores(@Query('limit') limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    const validLimit = isNaN(numLimit) ? 10 : numLimit;
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
}
