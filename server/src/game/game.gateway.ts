import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { 
  SocketEvents, 
  MoveDirection, 
  RotationDirection, 
  PlayerState,
  GameState
} from '@red-tetris/shared';
import type {
  JoinRoomPayload,
  MovePayload,
  RotatePayload,
  RoomJoinedPayload,
  ErrorPayload,
} from '@red-tetris/shared';
import { GameService } from './game.service';
import { RoomService } from './room.service';
import { PlayerService } from './player.service';
import { PieceService } from './piece.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private clientRooms = new Map<string, string>(); // socketId -> roomName
  private clientPlayers = new Map<string, string>(); // socketId -> playerId

  constructor(
    private gameService: GameService,
    private roomService: RoomService,
    private playerService: PlayerService,
    private pieceService: PieceService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const roomName = this.clientRooms.get(client.id);
    const playerId = this.clientPlayers.get(client.id);
    
    if (roomName && playerId) {
      this.handlePlayerLeaveRoom(client, roomName, playerId);
    }
    
    this.clientRooms.delete(client.id);
    this.clientPlayers.delete(client.id);
  }

  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    try {
      const { roomName, playerName } = payload;
      
      if (!roomName || !playerName) {
        this.emitError(client, 'Room name and player name are required');
        return;
      }

      // Check if client is already in a room
      if (this.clientRooms.has(client.id)) {
        this.emitError(client, 'Already in a room');
        return;
      }

      let room = this.roomService.getRoom(roomName);
      let player: any;

      if (!room) {
        // Create new room with player as host
        player = this.playerService.createPlayer(playerName, true);
        room = this.roomService.createRoom(roomName, player);
      } else {
        // Join existing room
        player = this.playerService.createPlayer(playerName, false);
        room = this.roomService.addPlayerToRoom(roomName, player) || undefined;
        
        if (!room) {
          this.emitError(client, 'Cannot join room (full, game started, or name taken)');
          return;
        }
      }

      // Join socket room
      await client.join(roomName);
      this.clientRooms.set(client.id, roomName);
      this.clientPlayers.set(client.id, player.id);

      // Send room joined confirmation to the player
      const roomJoinedPayload: RoomJoinedPayload = {
        room,
        playerId: player.id,
      };
      client.emit(SocketEvents.ROOM_JOINED, roomJoinedPayload);

      // Notify all players in room about room update
      this.server.to(roomName).emit(SocketEvents.ROOM_UPDATE, room);

      this.logger.log(`Player ${playerName} joined room ${roomName}`);
    } catch (error) {
      this.logger.error('Error joining room:', error);
      this.emitError(client, 'Failed to join room');
    }
  }

  @SubscribeMessage(SocketEvents.LEAVE_ROOM)
  handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const roomName = this.clientRooms.get(client.id);
    const playerId = this.clientPlayers.get(client.id);
    
    if (roomName && playerId) {
      this.handlePlayerLeaveRoom(client, roomName, playerId);
    }
  }

  @SubscribeMessage(SocketEvents.START_GAME)
  handleStartGame(@ConnectedSocket() client: Socket) {
    const roomName = this.clientRooms.get(client.id);
    const playerId = this.clientPlayers.get(client.id);
    
    if (!roomName || !playerId) {
      this.emitError(client, 'Not in a room');
      return;
    }

    const room = this.roomService.getRoom(roomName);
    if (!room) {
      this.emitError(client, 'Room not found');
      return;
    }

    if (room.hostId !== playerId) {
      this.emitError(client, 'Only host can start the game');
      return;
    }

    if (room.state !== GameState.WAITING) {
      this.emitError(client, 'Game already started');
      return;
    }

    // Start the game
    const updatedRoom = this.roomService.startGame(roomName);
    if (!updatedRoom) {
      this.emitError(client, 'Failed to start game');
      return;
    }

    // Initialize each player with their first piece
    updatedRoom.players.forEach(player => {
      const nextPieceType = this.roomService.getNextPiece(roomName);
      if (nextPieceType) {
        const piece = this.pieceService.createPiece(nextPieceType);
        const updatedPlayer = this.playerService.setCurrentPiece(player, piece);
        
        const nextNextPieceType = this.roomService.getNextPiece(roomName);
        const finalPlayer = this.playerService.setNextPiece(updatedPlayer, nextNextPieceType);
        
        this.roomService.updatePlayerInRoom(roomName, finalPlayer);
      }
    });

    // Notify all players
    this.server.to(roomName).emit(SocketEvents.GAME_STARTED, updatedRoom);
    this.logger.log(`Game started in room ${roomName}`);
  }

  @SubscribeMessage(SocketEvents.MOVE_PIECE)
  handleMovePiece(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MovePayload,
  ) {
    const roomName = this.clientRooms.get(client.id);
    const playerId = this.clientPlayers.get(client.id);
    
    if (!this.validateGameAction(client, roomName, playerId)) return;

    const { room, player } = this.getRoomAndPlayer(roomName!, playerId!);
    if (!room || !player || !player.currentPiece) return;

    if (this.gameService.canMovePiece(player.board, player.currentPiece, payload.direction)) {
      let dx = 0, dy = 0;
      switch (payload.direction) {
        case MoveDirection.LEFT:
          dx = -1;
          break;
        case MoveDirection.RIGHT:
          dx = 1;
          break;
        case MoveDirection.DOWN:
          dy = 1;
          break;
      }

      const movedPiece = this.pieceService.movePiece(player.currentPiece, dx, dy);
      const updatedPlayer = this.playerService.setCurrentPiece(player, movedPiece);
      this.roomService.updatePlayerInRoom(roomName!, updatedPlayer);

      // Check if piece reached bottom and should be placed
      if (payload.direction === MoveDirection.DOWN && 
          this.gameService.isPieceAtBottom(player.board, movedPiece)) {
        this.placePiece(roomName!, updatedPlayer);
      } else {
        this.emitPlayerUpdate(roomName!, updatedPlayer);
      }
    }
  }

  @SubscribeMessage(SocketEvents.ROTATE_PIECE)
  handleRotatePiece(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RotatePayload,
  ) {
    const roomName = this.clientRooms.get(client.id);
    const playerId = this.clientPlayers.get(client.id);
    
    if (!this.validateGameAction(client, roomName, playerId)) return;

    const { room, player } = this.getRoomAndPlayer(roomName!, playerId!);
    if (!room || !player || !player.currentPiece) return;

    const clockwise = payload.direction === RotationDirection.CLOCKWISE;
    if (this.gameService.canRotatePiece(player.board, player.currentPiece, clockwise)) {
      const rotatedPiece = this.pieceService.rotatePiece(player.currentPiece, clockwise);
      const updatedPlayer = this.playerService.setCurrentPiece(player, rotatedPiece);
      this.roomService.updatePlayerInRoom(roomName!, updatedPlayer);
      this.emitPlayerUpdate(roomName!, updatedPlayer);
    }
  }

  @SubscribeMessage(SocketEvents.HARD_DROP)
  handleHardDrop(@ConnectedSocket() client: Socket) {
    const roomName = this.clientRooms.get(client.id);
    const playerId = this.clientPlayers.get(client.id);
    
    if (!this.validateGameAction(client, roomName, playerId)) return;

    const { room, player } = this.getRoomAndPlayer(roomName!, playerId!);
    if (!room || !player || !player.currentPiece) return;

    const droppedPiece = this.gameService.dropPieceToBottom(player.board, player.currentPiece);
    const updatedPlayer = this.playerService.setCurrentPiece(player, droppedPiece);
    this.roomService.updatePlayerInRoom(roomName!, updatedPlayer);
    
    // Immediately place the piece
    this.placePiece(roomName!, updatedPlayer);
  }

  private validateGameAction(client: Socket, roomName?: string, playerId?: string): boolean {
    if (!roomName || !playerId) {
      this.emitError(client, 'Not in a room');
      return false;
    }

    const room = this.roomService.getRoom(roomName);
    if (!room || room.state !== GameState.PLAYING) {
      this.emitError(client, 'Game is not active');
      return false;
    }

    return true;
  }

  private getRoomAndPlayer(roomName: string, playerId: string) {
    const room = this.roomService.getRoom(roomName);
    if (!room) return { room: null, player: null };

    const player = room.players.find(p => p.id === playerId);
    return { room, player };
  }

  private placePiece(roomName: string, player: any) {
    if (!player.currentPiece) return;

    // Place piece on board and check for line clears
    const result = this.playerService.placePieceOnBoard(player, player.currentPiece);
    let updatedPlayer = this.playerService.updatePlayerBoard(player, result.board);
    
    if (result.linesCleared > 0) {
      updatedPlayer = this.playerService.incrementLinesCleared(updatedPlayer, result.linesCleared);
      
      // Send penalty lines to other players
      const room = this.roomService.getRoom(roomName);
      if (room && result.linesCleared > 1) {
        const penaltyLines = result.linesCleared - 1;
        room.players.forEach(otherPlayer => {
          if (otherPlayer.id !== player.id && otherPlayer.state === PlayerState.PLAYING) {
            const penalizedPlayer = this.playerService.addPenaltyLines(otherPlayer, penaltyLines);
            this.roomService.updatePlayerInRoom(roomName, penalizedPlayer);
            this.emitPlayerUpdate(roomName, penalizedPlayer);
          }
        });
      }
    }

    // Get next piece
    const nextPieceType = this.roomService.getNextPiece(roomName);
    if (nextPieceType) {
      const nextPiece = this.pieceService.createPiece(nextPieceType);
      updatedPlayer = this.playerService.setCurrentPiece(updatedPlayer, nextPiece);
      
      // Set next piece preview
      const nextNextPieceType = this.roomService.getNextPiece(roomName);
      updatedPlayer = this.playerService.setNextPiece(updatedPlayer, nextNextPieceType);
    }

    // Check for game over
    if (this.playerService.checkGameOver(updatedPlayer)) {
      updatedPlayer = this.playerService.updatePlayerState(updatedPlayer, PlayerState.GAME_OVER);
      this.checkGameEnd(roomName);
    }

    this.roomService.updatePlayerInRoom(roomName, updatedPlayer);
    this.emitPlayerUpdate(roomName, updatedPlayer);
  }

  private checkGameEnd(roomName: string) {
    const room = this.roomService.getRoom(roomName);
    if (!room) return;

    const playingPlayers = room.players.filter(p => p.state === PlayerState.PLAYING);
    if (playingPlayers.length <= 1) {
      this.roomService.endGame(roomName);
      this.server.to(roomName).emit(SocketEvents.GAME_OVER, room);
    }
  }

  private handlePlayerLeaveRoom(client: Socket, roomName: string, playerId: string) {
    const room = this.roomService.removePlayerFromRoom(roomName, playerId);
    
    client.leave(roomName);
    client.emit(SocketEvents.ROOM_LEFT);
    
    if (room) {
      this.server.to(roomName).emit(SocketEvents.ROOM_UPDATE, room);
      
      // Check if game should end
      if (room.state === GameState.PLAYING) {
        this.checkGameEnd(roomName);
      }
    }
    
    this.logger.log(`Player left room ${roomName}`);
  }

  private emitPlayerUpdate(roomName: string, player: any) {
    this.server.to(roomName).emit(SocketEvents.PLAYER_UPDATE, { player });
    this.server.to(roomName).emit(SocketEvents.SPECTRUM_UPDATE, {
      playerId: player.id,
      spectrum: player.spectrum,
    });
  }

  private emitError(client: Socket, message: string, code?: string) {
    const errorPayload: ErrorPayload = { message, code };
    client.emit(SocketEvents.ERROR, errorPayload);
  }
}
