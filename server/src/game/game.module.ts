import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { RoomService } from './room.service';
import { PlayerService } from './player.service';
import { PieceService } from './piece.service';

@Module({
  providers: [
    GameGateway,
    GameService,
    RoomService,
    PlayerService,
    PieceService,
  ],
})
export class GameModule {}
