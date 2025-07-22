import { Module, forwardRef } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { GameModule } from '../game/game.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [forwardRef(() => GameModule), LeaderboardModule],
  providers: [RoomGateway, RoomService],
  exports: [RoomService],
})
export class RoomModule {}
