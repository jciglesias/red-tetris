import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameLoopService } from './game-loop.service';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [forwardRef(() => RoomModule)],
  providers: [GameService, GameLoopService],
  exports: [GameService, GameLoopService],
})
export class GameModule {}
