import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomModule } from './room/room.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardEntry } from './leaderboard/leaderboard.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USER || 'admin',
      password: process.env.POSTGRES_PASSWORD || 'admin',
      database: process.env.POSTGRES_DB || 'red_tetris',
      entities: [LeaderboardEntry],
      synchronize: true, // This will auto-create tables - use carefully in production
      logging: process.env.NODE_ENV !== 'production',
    }),
    RoomModule,
    LeaderboardModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../client/build'),
      exclude: ['/api*'],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
