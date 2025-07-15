import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { GameState } from '../../../shared/src';
import type { Room, Player, PieceType } from '../../../shared/src';
import { PieceService } from './piece.service';

@Injectable()
export class RoomService {
  private rooms = new Map<string, Room>();

  constructor(private pieceService: PieceService) {}

  createRoom(name: string, hostPlayer: Player): Room {
    const room: Room = {
      id: uuidv4(),
      name,
      state: GameState.WAITING,
      players: [hostPlayer],
      hostId: hostPlayer.id,
      maxPlayers: 4,
      pieceSequence: this.pieceService.generatePieceSequence(1000), // Pre-generate sequence
      currentPieceIndex: 0,
    };

    this.rooms.set(name, room);
    return room;
  }

  getRoom(name: string): Room | undefined {
    return this.rooms.get(name);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  addPlayerToRoom(roomName: string, player: Player): Room | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    if (room.players.length >= room.maxPlayers) {
      return null; // Room is full
    }

    if (room.state === GameState.PLAYING) {
      return null; // Game already started
    }

    // Check if player name already exists in room
    if (room.players.some(p => p.name === player.name)) {
      return null; // Player name already taken
    }

    room.players.push(player);
    this.rooms.set(roomName, room);
    return room;
  }

  removePlayerFromRoom(roomName: string, playerId: string): Room | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    room.players = room.players.filter(p => p.id !== playerId);

    if (room.players.length === 0) {
      // Delete empty room
      this.rooms.delete(roomName);
      return null;
    }

    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    this.rooms.set(roomName, room);
    return room;
  }

  updatePlayerInRoom(roomName: string, updatedPlayer: Player): Room | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    const playerIndex = room.players.findIndex(p => p.id === updatedPlayer.id);
    if (playerIndex === -1) return null;

    room.players[playerIndex] = updatedPlayer;
    this.rooms.set(roomName, room);
    return room;
  }

  startGame(roomName: string): Room | null {
    const room = this.rooms.get(roomName);
    if (!room || room.state !== GameState.WAITING) return null;

    room.state = GameState.PLAYING;
    room.currentPieceIndex = 0;
    
    // Reset all players to playing state
    room.players.forEach(player => {
      player.state = 'PLAYING' as any;
    });

    this.rooms.set(roomName, room);
    return room;
  }

  endGame(roomName: string): Room | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    room.state = GameState.FINISHED;
    this.rooms.set(roomName, room);
    return room;
  }

  resetGame(roomName: string): Room | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    room.state = GameState.WAITING;
    room.currentPieceIndex = 0;
    room.pieceSequence = this.pieceService.generatePieceSequence(1000);

    this.rooms.set(roomName, room);
    return room;
  }

  getNextPiece(roomName: string): PieceType | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    const piece = this.pieceService.getNextPieceFromSequence(
      room.pieceSequence,
      room.currentPieceIndex
    );
    
    if (piece) {
      room.currentPieceIndex++;
      this.rooms.set(roomName, room);
    }

    return piece;
  }

  updateRoomState(roomName: string, state: GameState): Room | null {
    const room = this.rooms.get(roomName);
    if (!room) return null;

    room.state = state;
    this.rooms.set(roomName, room);
    return room;
  }

  getRoomByPlayerId(playerId: string): { room: Room; roomName: string } | null {
    for (const [roomName, room] of this.rooms.entries()) {
      if (room.players.some(p => p.id === playerId)) {
        return { room, roomName };
      }
    }
    return null;
  }
}
