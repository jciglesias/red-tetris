import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { join } from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
