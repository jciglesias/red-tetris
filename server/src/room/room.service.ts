import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { GameLoopService } from '../game/game-loop.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  lastSeen: Date;
  reconnectionToken?: string;
  score: number;
  level: number;
  linesCleared: number;
}

export interface Room {
  name: string;
  players: Map<string, Player>;
  gameState: 'waiting' | 'playing' | 'finished';
  maxPlayers: number;
  hostId?: string;
}

@Injectable()
export class RoomService {
  private rooms: Map<string, Room> = new Map();
  private playerSocketMap = new Map<string, { playerId: string; roomName: string }>(); // socketId -> player mapping
  private disconnectedPlayers = new Map<string, { player: Player; roomName: string; disconnectedAt: Date }>(); // playerId -> disconnected player data
  private readonly RECONNECTION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor(
    private gameService: GameService,
    @Inject(forwardRef(() => GameLoopService)) private gameLoopService: GameLoopService,
    private leaderboardService: LeaderboardService,
  ) {}

  createRoom(roomName: string): Room {
    if (this.rooms.has(roomName)) {
      return this.rooms.get(roomName)!;
    }

    const room: Room = {
      name: roomName,
      players: new Map(),
      gameState: 'waiting',
      maxPlayers: 5, // Configurable max players
    };

    this.rooms.set(roomName, room);
    return room;
  }

  getRoom(roomName: string): Room | undefined {
    return this.rooms.get(roomName);
  }

  addPlayerToRoom(roomName: string, playerName: string, socketId: string): Player | null {
    const room = this.getRoom(roomName) || this.createRoom(roomName);
    
    // Check for reconnection attempt first
    const reconnectionResult = this.attemptReconnection(roomName, playerName, socketId);
    if (reconnectionResult) {
      return reconnectionResult;
    }

    // Check if room is full or game is in progress (for new players)
    if (room.players.size >= room.maxPlayers) {
      return null;
    }

    // Allow joining during game if it's a reconnection
    if (room.gameState === 'playing') {
      return null;
    }

    // Check if player name already exists in room
    for (const player of room.players.values()) {
      if (player.name === playerName && player.isConnected) {
        return null;
      }
    }

    const player: Player = {
      id: `${roomName}_${playerName}`,
      name: playerName,
      socketId,
      isHost: room.players.size === 0, // First player becomes host
      isReady: false,
      isConnected: true,
      lastSeen: new Date(),
      reconnectionToken: this.generateReconnectionToken(),
      score: 0,
      level: 1,
      linesCleared: 0,
    };

    if (player.isHost) {
      room.hostId = player.id;
    }

    room.players.set(player.id, player);
    this.playerSocketMap.set(socketId, { playerId: player.id, roomName });
    return player;
  }

  removePlayerFromRoom(roomName: string, playerId: string): boolean {
    const room = this.getRoom(roomName);
    if (!room || !room.players.has(playerId)) {
      return false;
    }

    const removedPlayer = room.players.get(playerId)!;
    room.players.delete(playerId);

    // If host left, assign new host
    if (removedPlayer.isHost && room.players.size > 0) {
      const newHost = room.players.values().next().value;
      newHost.isHost = true;
      room.hostId = newHost.id;
    }

    // Remove room if empty
    if (room.players.size === 0) {
      this.rooms.delete(roomName);
    }

    return true;
  }

  setPlayerReady(roomName: string, playerId: string, ready: boolean): boolean {
    const room = this.getRoom(roomName);
    const player = room?.players.get(playerId);

    if (!room || !player) {
      return false;
    }

    player.isReady = ready;
    return true;
  }

  canStartGame(roomName: string): boolean {
    const room = this.getRoom(roomName);
    if (!room || room.gameState !== 'waiting' || room.players.size === 0) {
      return false;
    }

    // At least 1 player must be in the room
    if (room.players.size < 1) {
      return false;
    }

    // All players currently in the room must be ready and connected
    return Array.from(room.players.values()).every(player => 
      player.isReady && player.isConnected
    );
  }

  startGame(roomName: string, fastMode: boolean = false): boolean {
    const room = this.getRoom(roomName);
    if (!room || !this.canStartGame(roomName)) {
      return false;
    }

    room.gameState = 'playing';
    
    // Initialize game through GameService with fast mode
    const playerIds = Array.from(room.players.keys());
    this.gameService.createGame(roomName, playerIds, fastMode);
    
    // Add to active games for game loop with fast mode
    this.gameLoopService.addActiveGame(roomName, fastMode);
    
    return true;
  }

  async endGame(roomName: string): Promise<boolean> {
    const room = this.getRoom(roomName);
    if (!room) {
      return false;
    }

    // Save player statistics to leaderboard before ending the game
    await this.saveGameResults(roomName);

    room.gameState = 'finished';
    
    // Reset player ready states
    room.players.forEach(player => {
      player.isReady = false;
    });

    // Clean up game through GameService
    this.gameService.endGame(roomName);
    
    // Remove from active games
    this.gameLoopService.removeActiveGame(roomName);
    
    return true;
  }

  /**
   * Save game results to the leaderboard database
   */
  private async saveGameResults(roomName: string): Promise<void> {
    try {
      const room = this.getRoom(roomName);
      if (!room) {
        console.error(`Room ${roomName} not found when trying to save game results`);
        return;
      }

      // Get all player stats from the game service
      const playersStats = this.gameService.getAllPlayersStats(roomName);
      const gameState = this.gameService.getGameState(roomName);
      
      // Update player names with actual names from room data and determine winners
      const updatedStats = playersStats.map(stat => {
        const player = room.players.get(stat.playerId);
        const playerName = player?.name || stat.playerId;
        
        // Determine if this player won
        let isWin = false;
        if (gameState?.winner === stat.playerId) {
          // Explicit winner in multiplayer games
          isWin = true;
        } else if (room.players.size === 1) {
          // Solo player - consider wins based on performance
          // A "win" in solo mode is achieving a decent score or clearing lines
          isWin = stat.score >= 100 || stat.linesCleared >= 5;
        }
        
        return {
          ...stat,
          playerName,
          isWin,
        };
      });

      // Save each player's stats to the database
      const savePromises = updatedStats.map(stat => 
        this.leaderboardService.addEntry({
          playerName: stat.playerName,
          score: stat.score,
          linesCleared: stat.linesCleared,
          level: stat.level,
          gameDuration: stat.gameDuration,
          fastMode: stat.fastMode,
          isWin: stat.isWin,
          roomName: roomName,
        })
      );

      await Promise.all(savePromises);
      console.log(`Successfully saved game results for room ${roomName}`, 
        `- ${updatedStats.filter(s => s.isWin).length} winner(s)`);
    } catch (error) {
      console.error(`Failed to save game results for room ${roomName}:`, error);
      // Don't throw the error to prevent game ending from failing
    }
  }

  resetRoom(roomName: string): boolean {
    const room = this.getRoom(roomName);
    if (!room) {
      return false;
    }

    room.gameState = 'waiting';
    room.players.forEach(player => {
      player.isReady = false;
      player.score = 0;
      player.level = 1;
      player.linesCleared = 0;
    });

    return true;
  }

  getRoomPlayers(roomName: string): Player[] {
    const room = this.getRoom(roomName);
    return room ? Array.from(room.players.values()) : [];
  }

  private generateReconnectionToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private attemptReconnection(roomName: string, playerName: string, socketId: string): Player | null {
    const room = this.getRoom(roomName);
    if (!room) return null;

    // Check if there's a disconnected player with this name
    const disconnectedPlayerData = Array.from(this.disconnectedPlayers.entries())
      .find(([_, data]) => data.roomName === roomName && data.player.name === playerName);

    if (disconnectedPlayerData) {
      const [playerId, { player, disconnectedAt }] = disconnectedPlayerData;
      
      // Check if reconnection timeout hasn't expired
      if (Date.now() - disconnectedAt.getTime() < this.RECONNECTION_TIMEOUT) {
        return this.reconnectPlayer(roomName, playerId, socketId);
      } else {
        // Cleanup expired disconnection data
        this.disconnectedPlayers.delete(playerId);
      }
    }

    // Check if player is still in room but marked as disconnected
    for (const [playerId, player] of room.players.entries()) {
      if (player.name === playerName && !player.isConnected) {
        return this.reconnectPlayer(roomName, playerId, socketId);
      }
    }

    return null;
  }

  reconnectPlayer(roomName: string, playerId: string, newSocketId: string): Player | null {
    const room = this.getRoom(roomName);
    if (!room) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    // Update player connection info
    const oldSocketId = player.socketId;
    player.socketId = newSocketId;
    player.isConnected = true;
    player.lastSeen = new Date();

    // Update socket mappings
    this.playerSocketMap.delete(oldSocketId);
    this.playerSocketMap.set(newSocketId, { playerId, roomName });

    // Remove from disconnected players if present
    this.disconnectedPlayers.delete(playerId);

    return player;
  }

  markPlayerDisconnected(socketId: string): { player: Player; room: Room } | null {
    const playerData = this.playerSocketMap.get(socketId);
    if (!playerData) return null;

    const { playerId, roomName } = playerData;
    const room = this.getRoom(roomName);
    const player = room?.players.get(playerId);

    if (!room || !player) return null;

    // Mark player as disconnected but keep in room
    player.isConnected = false;
    player.lastSeen = new Date();

    // Store disconnection data for potential reconnection
    this.disconnectedPlayers.set(playerId, {
      player: { ...player },
      roomName,
      disconnectedAt: new Date(),
    });

    // Remove socket mapping
    this.playerSocketMap.delete(socketId);

    return { player, room };
  }

  // Clean up disconnected players periodically
  cleanupExpiredDisconnections(): void {
    const now = Date.now();
    for (const [playerId, data] of this.disconnectedPlayers.entries()) {
      if (now - data.disconnectedAt.getTime() > this.RECONNECTION_TIMEOUT) {
        this.disconnectedPlayers.delete(playerId);
        
        // Remove player from room if still there and disconnected
        const room = this.getRoom(data.roomName);
        if (room) {
          const player = room.players.get(playerId);
          if (player && !player.isConnected) {
            this.removePlayerFromRoom(data.roomName, playerId);
          }
        }
      }
    }
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getPlayerBySocketId(socketId: string): { player: Player; room: Room } | null {
    const playerData = this.playerSocketMap.get(socketId);
    if (!playerData) return null;

    const { playerId, roomName } = playerData;
    const room = this.getRoom(roomName);
    const player = room?.players.get(playerId);

    if (!room || !player) return null;

    return { player, room };
  }

  /**
   * Update player scores and stats from the game service
   */
  updatePlayerStats(roomName: string): boolean {
    const room = this.getRoom(roomName);
    if (!room || room.gameState !== 'playing') {
      return false;
    }

    try {
      // Get current game state from the game service
      const gameState = this.gameService.getGameState(roomName);
      if (!gameState) {
        return false;
      }

      // Update each player's stats from the game state
      for (const [playerId, gamePlayer] of gameState.players) {
        const roomPlayer = room.players.get(playerId);
        if (roomPlayer) {
          roomPlayer.score = gamePlayer.score;
          roomPlayer.level = gamePlayer.level;
          roomPlayer.linesCleared = gamePlayer.lines;
        }
      }

      return true;
    } catch (error) {
      console.error(`Error updating player stats for room ${roomName}:`, error);
      return false;
    }
  }
}
