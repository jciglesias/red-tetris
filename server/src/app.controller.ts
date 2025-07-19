import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';
import { LeaderboardService } from './leaderboard/leaderboard.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    try {
      // Test database connection
      const isConnected = await this.leaderboardService.checkDatabaseConnection();
      if (isConnected) {
        const stats = await this.leaderboardService.getAllTimeStats();
        return {
          status: 'ok',
          database: 'connected',
          timestamp: new Date().toISOString(),
          totalGames: stats.totalGames,
        };
      } else {
        return {
          status: 'error',
          database: 'disconnected',
          timestamp: new Date().toISOString(),
          error: 'Database connection failed',
        };
      }
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Handle URL pattern: /<room>/<player>
  @Get(':room/:player')
  serveClientApp(@Param('room') room: string, @Param('player') player: string, @Res() res: Response) {
    // Serve the React app's index.html for any room/player route
    // This allows the client-side router to handle the routing
    res.sendFile(join(process.cwd(), '../client/build/index.html'));
  }

  // Fallback for any other routes - serve React app
  @Get('*')
  serveApp(@Res() res: Response) {
    res.sendFile(join(process.cwd(), '../client/build/index.html'));
  }
}
