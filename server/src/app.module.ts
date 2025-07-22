import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomModule } from './room/room.module';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { LeaderboardService } from './leaderboard/leaderboard.service';
import { LeaderboardEntry } from './leaderboard/leaderboard.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [LeaderboardEntry],
      synchronize: true, // This will auto-create tables - use carefully in production
      logging: process.env.NODE_ENV !== 'production',
    }),
    TypeOrmModule.forFeature([LeaderboardEntry]), // Add this for the controller
    RoomModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../client/build'),
      exclude: ['/api*'],
    }),
  ],
  controllers: [LeaderboardController, AppController], // Register LeaderboardController first
  providers: [AppService, LeaderboardService], // Add LeaderboardService
})
export class AppModule {}
