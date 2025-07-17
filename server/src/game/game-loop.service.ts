import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { RoomService } from '../room/room.service';

@Injectable()
export class GameLoopService implements OnModuleInit, OnModuleDestroy {
  private intervalId: NodeJS.Timeout | null = null;
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private tickInterval = 1000; // 1 second per tick (adjustable)
  private cleanupInterval = 30000; // 30 seconds cleanup interval
  private activeGames = new Set<string>(); // Track active games

  constructor(
    private gameService: GameService,
    @Inject(forwardRef(() => RoomService)) private roomService: RoomService,
  ) {}

  onModuleInit() {
    this.startGameLoop();
    this.startCleanupLoop();
  }

  onModuleDestroy() {
    this.stopGameLoop();
    this.stopCleanupLoop();
  }

  addActiveGame(roomName: string) {
    this.activeGames.add(roomName);
  }

  removeActiveGame(roomName: string) {
    this.activeGames.delete(roomName);
  }

  private startGameLoop() {
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);
  }

  private stopGameLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private startCleanupLoop() {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupInactiveGames();
    }, this.cleanupInterval);
  }

  private stopCleanupLoop() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
  }

  private tick() {
    // Process each active game
    for (const roomName of this.activeGames) {
      const gameState = this.gameService.getGameState(roomName);
      if (gameState && !gameState.gameOver) {
        this.gameService.tick(roomName);
      } else {
        // Remove inactive games
        this.activeGames.delete(roomName);
      }
    }
  }

  private cleanupInactiveGames() {
    // Clean up disconnected players
    this.roomService.cleanupExpiredDisconnections();
    
    // Remove inactive games from tracking
    for (const roomName of this.activeGames) {
      const gameState = this.gameService.getGameState(roomName);
      if (!gameState || gameState.gameOver) {
        this.activeGames.delete(roomName);
      }
    }
  }

  // Allow manual control of tick rate
  setTickRate(intervalMs: number) {
    this.stopGameLoop();
    this.tickInterval = intervalMs;
    this.startGameLoop();
  }
}
