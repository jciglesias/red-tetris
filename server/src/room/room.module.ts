import { Module, forwardRef } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { GameModule } from '../game/game.module';

@Module({
  imports: [forwardRef(() => GameModule)],
  providers: [RoomGateway, RoomService],
  exports: [RoomService],
})
export class RoomModule {}
