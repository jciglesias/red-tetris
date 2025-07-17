import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { GameLoopService } from '../game/game-loop.service';

export interface Player {
  id: string;
  name: string;
  socketId: string;
  isHost: boolean;
  isReady: boolean;
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

  constructor(
    private gameService: GameService,
    @Inject(forwardRef(() => GameLoopService)) private gameLoopService: GameLoopService,
  ) {}

  createRoom(roomName: string): Room {
    if (this.rooms.has(roomName)) {
      return this.rooms.get(roomName)!;
    }

    const room: Room = {
      name: roomName,
      players: new Map(),
      gameState: 'waiting',
      maxPlayers: 8, // Configurable max players
    };

    this.rooms.set(roomName, room);
    return room;
  }

  getRoom(roomName: string): Room | undefined {
    return this.rooms.get(roomName);
  }

  addPlayerToRoom(roomName: string, playerName: string, socketId: string): Player | null {
    const room = this.getRoom(roomName) || this.createRoom(roomName);
    
    // Check if room is full or game is in progress
    if (room.players.size >= room.maxPlayers || room.gameState === 'playing') {
      return null;
    }

    // Check if player name already exists in room
    for (const player of room.players.values()) {
      if (player.name === playerName) {
        return null;
      }
    }

    const player: Player = {
      id: `${roomName}_${playerName}`,
      name: playerName,
      socketId,
      isHost: room.players.size === 0, // First player becomes host
      isReady: false,
    };

    if (player.isHost) {
      room.hostId = player.id;
    }

    room.players.set(player.id, player);
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

    // All players must be ready
    return Array.from(room.players.values()).every(player => player.isReady);
  }

  startGame(roomName: string): boolean {
    const room = this.getRoom(roomName);
    if (!room || !this.canStartGame(roomName)) {
      return false;
    }

    room.gameState = 'playing';
    
    // Initialize game through GameService
    const playerIds = Array.from(room.players.keys());
    this.gameService.createGame(roomName, playerIds);
    
    // Add to active games for game loop
    this.gameLoopService.addActiveGame(roomName);
    
    return true;
  }

  endGame(roomName: string): boolean {
    const room = this.getRoom(roomName);
    if (!room) {
      return false;
    }

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

  resetRoom(roomName: string): boolean {
    const room = this.getRoom(roomName);
    if (!room) {
      return false;
    }

    room.gameState = 'waiting';
    room.players.forEach(player => {
      player.isReady = false;
    });

    return true;
  }

  getRoomPlayers(roomName: string): Player[] {
    const room = this.getRoom(roomName);
    return room ? Array.from(room.players.values()) : [];
  }

  getPlayerBySocketId(socketId: string): { player: Player; room: Room } | null {
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        if (player.socketId === socketId) {
          return { player, room };
        }
      }
    }
    return null;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
