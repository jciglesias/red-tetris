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
import { Injectable, Optional } from '@nestjs/common';
import { RoomService, Player } from './room.service';
import { GameService, GameState } from '../game/game.service';
import { GameLoopService } from '../game/game-loop.service';

interface JoinRoomMessage {
  roomName: string;
  playerName: string;
  reconnectionToken?: string;
}

interface PlayerReadyMessage {
  ready: boolean;
}

interface StartGameMessage {
  fast?: boolean;
}

interface GameActionMessage {
  action: 'move-left' | 'move-right' | 'rotate' | 'soft-drop' | 'hard-drop' | 'skip-piece';
}

interface ChatMessage {
  message: string;
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
    @Optional() private gameLoopService?: GameLoopService,
  ) {
    // Register this gateway as the game end event emitter
    // Use setTimeout to ensure all services are fully initialized
    setTimeout(() => {
      if (this.gameLoopService && this.gameLoopService.setGameEndEventEmitter) {
        this.gameLoopService.setGameEndEventEmitter(this);
      }
    }, 0);
  }

  /**
   * Emit game-ended event to all players in a room
   * Called by GameLoopService when a game ends naturally
   */
  emitGameEnded(roomName: string, winner: string | null, finalState: any) {
    this.server.to(roomName).emit('game-ended', {
      winner: winner,
      finalState: this.serializeGameState(finalState),
    });
  }

  /**
   * Helper function to serialize GameState for JSON transmission
   * Converts Map to plain object so it can be properly serialized
   */
  private serializeGameState(gameState: GameState | null) {
    if (!gameState) return null;
    
    return {
      ...gameState,
      players: gameState.players ? Object.fromEntries(gameState.players) : {}
    };
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    
    const disconnectionData = this.roomService.markPlayerDisconnected(client.id);
    if (disconnectionData) {
      const { player, room } = disconnectionData;
      
      // If there's no game state or game state is waiting, remove player completely
      // This allows others to start a new game without waiting for reconnection
      if (!room.gameState || room.gameState === 'waiting') {
        // Remove player from room completely
        const removedPlayer = this.roomService.removePlayerFromRoom(room.name, player.id);
        
        if (removedPlayer) {
          // Check if we need to assign a new host
          let newHost: Player | null = null;
          if (player.isHost) {
            newHost = this.roomService.transferHostOnDisconnect(room.name, player.id);
            
            if (newHost) {
              // Notify all players about the host change
              this.server.to(room.name).emit('host-changed', {
                newHostId: newHost.id,
                newHostName: newHost.name,
                previousHostId: player.id,
                previousHostName: player.name,
                players: this.roomService.getRoomPlayers(room.name),
              });
            }
          }
          
          // Notify other players that this player left the room
          this.server.to(room.name).emit('player-left', {
            playerId: player.id,
            playerName: player.name,
            players: this.roomService.getRoomPlayers(room.name),
            canReconnect: false,
            hostChanged: !!newHost,
            newHost: newHost ? { id: newHost.id, name: newHost.name } : null,
            reason: 'Player disconnected before game started',
          });
        }
      } else {
        // Game is in progress or finished - keep player for potential reconnection
        // Check if the disconnected player was the host and transfer host if needed
        let newHost: Player | null = null;
        if (player.isHost) {
          newHost = this.roomService.transferHostOnDisconnect(room.name, player.id);
          
          if (newHost) {
            // Notify all players about the host change
            this.server.to(room.name).emit('host-changed', {
              newHostId: newHost.id,
              newHostName: newHost.name,
              previousHostId: player.id,
              previousHostName: player.name,
              players: this.roomService.getRoomPlayers(room.name),
            });
          }
        }
        
        // Notify other players that this player disconnected
        this.server.to(room.name).emit('player-disconnected', {
          playerId: player.id,
          playerName: player.name,
          players: this.roomService.getRoomPlayers(room.name),
          canReconnect: true,
          hostChanged: !!newHost,
          newHost: newHost ? { id: newHost.id, name: newHost.name } : null,
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
      gameState: this.serializeGameState(gameState), // Serialize the game state
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
  handleStartGame(
    @MessageBody() data: StartGameMessage,
    @ConnectedSocket() client: Socket,
  ) {
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
      if (readyPlayers.length < connectedPlayers.length) {
        message = `Waiting for all players to be ready (${readyPlayers.length}/${connectedPlayers.length} ready)`;
      } else if (connectedPlayers.length < room.players.size) {
        message = `Waiting for all players to connect (${connectedPlayers.length}/${room.players.size} connected)`;
      } else if (room.gameState && room.gameState !== 'waiting') {
        message = `Cannot start game. game state: ${room.gameState}.`;
      } else {
        message = 'Cannot start game. Unknown reason.';
      }
      
      client.emit('error', { message });
      return;
    }

    // Extract the fast mode parameter (default to false if not provided)
    const fastMode = data?.fast || false;
    console.log(`Starting game in ${fastMode ? 'fast' : 'normal'} mode`);

    const gameStarted = this.roomService.startGame(room.name, fastMode);
    if (gameStarted) {
      // Get initial game state
      const gameState = this.gameService.getGameState(room.name);
      
      // Notify all players that game has started
      this.server.to(room.name).emit('game-started', {
        gameState: this.serializeGameState(gameState),
        players: this.roomService.getRoomPlayers(room.name),
        fastMode: fastMode, // Include fast mode info in the response
      });
    }
  }

  @SubscribeMessage('game-action')
  async handleGameAction(
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
      // Update player stats from game state
      this.roomService.updatePlayerStats(room.name);
      
      // Broadcast updated game state to all players in room
      const gameState = this.gameService.getGameState(room.name);
      if (gameState) {
        this.server.to(room.name).emit('game-state-update', this.serializeGameState(gameState));

        // Check if game ended
        if (gameState.gameOver) {
          await this.roomService.endGame(room.name);
          this.server.to(room.name).emit('game-ended', {
            winner: gameState.winner,
            finalState: this.serializeGameState(gameState),
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
      gameState: this.serializeGameState(gameState),
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
      
      const gameState = this.gameService.getGameState(roomName);
      const serializedGameState = this.serializeGameState(gameState);
      
      // Prepare reconnection success data
      const reconnectionData: any = {
        player: reconnectedPlayer,
        room: {
          name: roomName,
          players: this.roomService.getRoomPlayers(roomName),
          gameState: room.gameState,
        },
        gameState: serializedGameState,
      };

      // If the game is finished, use the stored final game result
      if (room.gameState === 'finished' && room.finalGameResult) {
        reconnectionData.winner = room.finalGameResult.winner;
        reconnectionData.finalState = this.serializeGameState(room.finalGameResult.finalState);
        reconnectionData.gameFinished = true;
        reconnectionData.gameState = this.serializeGameState(room.finalGameResult.finalState);
      } else if (gameState && gameState.gameOver) {
        // If the game is over but still in memory, include that information
        reconnectionData.winner = gameState.winner;
        reconnectionData.finalState = serializedGameState;
        reconnectionData.gameFinished = true;
      }
      
      client.emit('reconnection-success', reconnectionData);

      // Notify other players
      this.server.to(roomName).emit('player-reconnected', {
        player: reconnectedPlayer,
        players: this.roomService.getRoomPlayers(roomName),
      });
    } else {
      client.emit('reconnection-error', { message: 'Failed to reconnect player' });
    }
  }

  @SubscribeMessage('quit-game')
  async handleQuitGame(@ConnectedSocket() client: Socket) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (!playerData) {
      client.emit('error', { message: 'Player not found in any room' });
      return;
    }

    const { player, room } = playerData;
    
    if (room.gameState !== 'playing') {
      client.emit('error', { message: 'No game in progress to quit' });
      return;
    }

    // Mark player as not alive (quit)
    const gameState = this.gameService.getGameState(room.name);
    if (gameState) {
      const gamePlayer = gameState.players.get(player.id);
      if (gamePlayer) {
        gamePlayer.isAlive = false;
      }
      
      // For solo games, always end the game when the player quits
      // For multiplayer, check if this causes game over
      const isSoloGame = room.players.size === 1;
      
      if (isSoloGame) {
        // Solo game: player quitting means game ends
        gameState.gameOver = true;
        await this.roomService.endGame(room.name);
        this.server.to(room.name).emit('game-ended', {
          winner: null, // Solo quit doesn't have a winner
          finalState: this.serializeGameState(gameState),
          reason: 'Player quit',
        });
      } else {
        // Multiplayer: check if this causes game over
        const gameEnded = this.gameService.checkForGameOver(room.name);
        
        if (gameEnded) {
          // Game ended, save results
          const finalGameState = this.gameService.getGameState(room.name);
          await this.roomService.endGame(room.name);
          this.server.to(room.name).emit('game-ended', {
            winner: finalGameState?.winner,
            finalState: this.serializeGameState(finalGameState),
            reason: 'Player quit',
          });
        } else {
          // Just notify about the quit
          this.server.to(room.name).emit('player-quit', {
            playerId: player.id,
            playerName: player.name,
          });
        }
      }
    }
  }

  @SubscribeMessage('chat-message')
  handleChatMessage(
    @MessageBody() data: ChatMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const playerData = this.roomService.getPlayerBySocketId(client.id);
    if (!playerData) {
      client.emit('error', { message: 'Player not found in any room' });
      return;
    }

    const { player, room } = playerData;
    
    if (!data.message || !data.message.trim()) {
      client.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    // Limit message length to prevent spam
    const trimmedMessage = data.message.trim().substring(0, 500);
    
    // Broadcast chat message to all players in the room
    this.server.to(room.name).emit('chat-message', {
      playerId: player.id,
      playerName: player.name,
      message: trimmedMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
