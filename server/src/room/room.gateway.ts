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
import { Injectable } from '@nestjs/common';
import { RoomService, Player } from './room.service';
import { GameService } from '../game/game.service';

interface JoinRoomMessage {
  roomName: string;
  playerName: string;
  reconnectionToken?: string;
}

interface PlayerReadyMessage {
  ready: boolean;
}

interface GameActionMessage {
  action: 'move-left' | 'move-right' | 'rotate' | 'soft-drop' | 'hard-drop';
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private roomService: RoomService,
    private gameService: GameService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    const disconnectionData = this.roomService.markPlayerDisconnected(client.id);
    if (disconnectionData) {
      const { player, room } = disconnectionData;
      
      // Notify other players that this player disconnected
      this.server.to(room.name).emit('player-disconnected', {
        playerId: player.id,
        playerName: player.name,
        players: this.roomService.getRoomPlayers(room.name),
        canReconnect: true,
      });

      // If game was in progress and all players are disconnected, pause the game
      if (room.gameState === 'playing') {
        const connectedPlayers = this.roomService.getRoomPlayers(room.name)
          .filter(p => p.isConnected);
        
        if (connectedPlayers.length === 0) {
          // Pause the game or handle accordingly
          this.server.to(room.name).emit('game-paused', {
            reason: 'All players disconnected',
          });
        }
      }
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: JoinRoomMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomName, playerName, reconnectionToken } = data;
    
    if (!roomName || !playerName) {
      client.emit('join-room-error', { message: 'Room name and player name are required' });
      return;
    }

    const player = this.roomService.addPlayerToRoom(roomName, playerName, client.id);
    
    if (!player) {
      client.emit('join-room-error', { 
        message: 'Could not join room. Room may be full, game in progress, or name taken.' 
      });
      return;
    }

    // Join socket room
    client.join(roomName);
    
    // Get current game state if game is in progress
    const room = this.roomService.getRoom(roomName);
    const gameState = room?.gameState === 'playing' ? this.gameService.getGameState(roomName) : null;
    
    // Send success response to joining player
    client.emit('join-room-success', {
      player,
      room: {
        name: roomName,
        players: this.roomService.getRoomPlayers(roomName),
        gameState: room?.gameState,
      },
      gameState, // Include current game state for reconnections
      isReconnection: !!reconnectionToken,
    });

    // Notify other players in the room
    const eventName = player.isConnected ? 'player-reconnected' : 'player-joined';
    client.to(roomName).emit(eventName, {
      player,
      players: this.roomService.getRoomPlayers(roomName),
    });
  }

  @SubscribeMessage('player-ready')
  handlePlayerReady(
    @MessageBody() data: PlayerReadyMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (!playerData) {
      client.emit('error', { message: 'Player not found in any room' });
      return;
    }

    const { player, room } = playerData;
    this.roomService.setPlayerReady(room.name, player.id, data.ready);

    // Notify all players in the room
    this.server.to(room.name).emit('player-ready-changed', {
      playerId: player.id,
      ready: data.ready,
      players: this.roomService.getRoomPlayers(room.name),
      canStart: this.roomService.canStartGame(room.name),
    });
  }

  @SubscribeMessage('start-game')
  handleStartGame(@ConnectedSocket() client: Socket) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (!playerData) {
      client.emit('error', { message: 'Player not found in any room' });
      return;
    }

    const { player, room } = playerData;
    
    // Only host can start game
    if (!player.isHost) {
      client.emit('error', { message: 'Only host can start the game' });
      return;
    }

    if (!this.roomService.canStartGame(room.name)) {
      // Provide specific feedback about why game can't start
      const connectedPlayers = room.players ? Array.from(room.players.values()).filter(p => p.isConnected) : [];
      const readyPlayers = connectedPlayers.filter(p => p.isReady);
      
      let message = '';
      if (connectedPlayers.length < room.maxPlayers) {
        message = `Waiting for more players (${connectedPlayers.length}/${room.maxPlayers})`;
      } else if (readyPlayers.length < connectedPlayers.length) {
        message = `Waiting for all players to be ready (${readyPlayers.length}/${connectedPlayers.length} ready)`;
      } else {
        message = 'Cannot start game. Unknown reason.';
      }
      
      client.emit('error', { message });
      return;
    }

    const gameStarted = this.roomService.startGame(room.name);
    if (gameStarted) {
      // Get initial game state
      const gameState = this.gameService.getGameState(room.name);
      
      // Notify all players that game has started
      this.server.to(room.name).emit('game-started', {
        gameState,
        players: this.roomService.getRoomPlayers(room.name),
      });
    }
  }

  @SubscribeMessage('game-action')
  handleGameAction(
    @MessageBody() data: GameActionMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (!playerData) {
      client.emit('error', { message: 'Player not found in any room' });
      return;
    }

    const { player, room } = playerData;
    
    if (room.gameState !== 'playing') {
      client.emit('error', { message: 'Game is not currently in progress' });
      return;
    }

    // Process game action through GameService
    const result = this.gameService.processPlayerAction(room.name, player.id, data.action);
    
    if (result) {
      // Broadcast updated game state to all players in room
      const gameState = this.gameService.getGameState(room.name);
      if (gameState) {
        this.server.to(room.name).emit('game-state-update', gameState);

        // Check if game ended
        if (gameState.gameOver) {
          this.roomService.endGame(room.name);
          this.server.to(room.name).emit('game-ended', {
            winner: gameState.winner,
            finalState: gameState,
          });
        }
      }
    }
  }

  @SubscribeMessage('restart-game')
  handleRestartGame(@ConnectedSocket() client: Socket) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (!playerData) {
      client.emit('error', { message: 'Player not found in any room' });
      return;
    }

    const { player, room } = playerData;
    
    // Only host can restart game
    if (!player.isHost) {
      client.emit('error', { message: 'Only host can restart the game' });
      return;
    }

    this.roomService.resetRoom(room.name);
    
    // Notify all players
    this.server.to(room.name).emit('game-reset', {
      players: this.roomService.getRoomPlayers(room.name),
    });
  }

  @SubscribeMessage('get-room-info')
  handleGetRoomInfo(@ConnectedSocket() client: Socket) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (!playerData) {
      client.emit('error', { message: 'Player not found in any room' });
      return;
    }

    const { room } = playerData;
    const gameState = room.gameState === 'playing' ? this.gameService.getGameState(room.name) : null;

    client.emit('room-info', {
      room: {
        name: room.name,
        gameState: room.gameState,
        players: this.roomService.getRoomPlayers(room.name),
      },
      gameState,
    });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (playerData) {
      const { player } = playerData;
      player.lastSeen = new Date();
      client.emit('heartbeat-ack');
    }
  }

  @SubscribeMessage('request-reconnection')
  handleReconnectionRequest(
    @MessageBody() data: { roomName: string; playerName: string; reconnectionToken?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomName, playerName, reconnectionToken } = data;
    
    if (!roomName || !playerName) {
      client.emit('reconnection-error', { message: 'Room name and player name are required' });
      return;
    }

    // Try to reconnect the player
    const room = this.roomService.getRoom(roomName);
    if (!room) {
      client.emit('reconnection-error', { message: 'Room not found' });
      return;
    }

    // Find disconnected player
    let targetPlayer: Player | null = null;
    for (const player of room.players.values()) {
      if (player.name === playerName && !player.isConnected) {
        // Verify reconnection token if provided
        if (reconnectionToken && player.reconnectionToken !== reconnectionToken) {
          client.emit('reconnection-error', { message: 'Invalid reconnection token' });
          return;
        }
        targetPlayer = player;
        break;
      }
    }

    if (!targetPlayer) {
      client.emit('reconnection-error', { message: 'No disconnected player found with that name' });
      return;
    }

    // Reconnect the player
    const reconnectedPlayer = this.roomService.reconnectPlayer(roomName, targetPlayer.id, client.id);
    if (reconnectedPlayer) {
      client.join(roomName);
      
      const gameState = room.gameState === 'playing' ? this.gameService.getGameState(roomName) : null;
      
      client.emit('reconnection-success', {
        player: reconnectedPlayer,
        room: {
          name: roomName,
          players: this.roomService.getRoomPlayers(roomName),
          gameState: room.gameState,
        },
        gameState,
      });

      // Notify other players
      this.server.to(roomName).emit('player-reconnected', {
        player: reconnectedPlayer,
        players: this.roomService.getRoomPlayers(roomName),
      });
    } else {
      client.emit('reconnection-error', { message: 'Failed to reconnect player' });
    }
  }
}
