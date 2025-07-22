import { Test, TestingModule } from '@nestjs/testing';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { GameService } from '../game/game.service';
import { Server, Socket } from 'socket.io';

describe('RoomGateway', () => {
  let gateway: RoomGateway;
  let roomService: RoomService;
  let gameService: GameService;
  let mockServer: Partial<Server>;
  let mockClient: Partial<Socket>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

    mockClient = {
      id: 'test-socket-id',
      join: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomGateway,
        {
          provide: RoomService,
          useValue: {
            addPlayerToRoom: jest.fn(),
            removePlayerFromRoom: jest.fn(),
            getPlayerBySocketId: jest.fn(),
            getRoomPlayers: jest.fn(),
            getRoom: jest.fn(),
            setPlayerReady: jest.fn(),
            canStartGame: jest.fn(),
            startGame: jest.fn(),
            endGame: jest.fn(),
            resetRoom: jest.fn(),
            reconnectPlayer: jest.fn(),
            markPlayerDisconnected: jest.fn(),
            updatePlayerStats: jest.fn(),
          },
        },
        {
          provide: GameService,
          useValue: {
            processPlayerAction: jest.fn(),
            getGameState: jest.fn(),
            checkForGameOver: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<RoomGateway>(RoomGateway);
    roomService = module.get<RoomService>(RoomService);
    gameService = module.get<GameService>(GameService);
    
    gateway.server = mockServer as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('connection handling', () => {
    it('should handle client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      gateway.handleConnection(mockClient as Socket);
      
      expect(consoleSpy).toHaveBeenCalledWith('Client connected: test-socket-id');
      consoleSpy.mockRestore();
    });

    it('should handle client disconnection without player data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handleDisconnect(mockClient as Socket);
      
      expect(consoleSpy).toHaveBeenCalledWith('Client disconnected: test-socket-id');
      expect(roomService.removePlayerFromRoom).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle client disconnection with player data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockPlayerData = {
        player: { id: 'player1', name: 'Test Player' },
        room: { name: 'test-room', gameState: 'waiting', players: new Map() }
      };
      
      (roomService.markPlayerDisconnected as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue([]);
      
      gateway.handleDisconnect(mockClient as Socket);
      
      expect(roomService.markPlayerDisconnected).toHaveBeenCalledWith('test-socket-id');
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      consoleSpy.mockRestore();
    });
  });

  describe('join-room event', () => {
    it('should handle successful room join', () => {
      const joinData = { roomName: 'test-room', playerName: 'Test Player' };
      const mockPlayer = { id: 'player1', name: 'Test Player', isHost: true };
      const mockPlayers = [mockPlayer];
      
      (roomService.addPlayerToRoom as jest.Mock).mockReturnValue(mockPlayer);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      (roomService.getRoom as jest.Mock).mockReturnValue({ gameState: 'waiting' });
      
      gateway.handleJoinRoom(joinData, mockClient as Socket);
      
      expect(mockClient.join).toHaveBeenCalledWith('test-room');
      expect(mockClient.emit).toHaveBeenCalledWith('join-room-success', expect.any(Object));
      expect(mockClient.to).toHaveBeenCalledWith('test-room');
    });

    it('should handle failed room join', () => {
      const joinData = { roomName: 'test-room', playerName: 'Test Player' };
      
      (roomService.addPlayerToRoom as jest.Mock).mockReturnValue(null);
      
      gateway.handleJoinRoom(joinData, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('join-room-error', expect.objectContaining({
        message: expect.stringContaining('Could not join room')
      }));
    });

    it('should handle missing room name or player name', () => {
      const invalidData1 = { roomName: '', playerName: 'Test Player' };
      const invalidData2 = { roomName: 'test-room', playerName: '' };
      
      gateway.handleJoinRoom(invalidData1, mockClient as Socket);
      gateway.handleJoinRoom(invalidData2, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledTimes(2);
      expect(mockClient.emit).toHaveBeenCalledWith('join-room-error', expect.objectContaining({
        message: 'Room name and player name are required'
      }));
    });
  });

  describe('player-ready event', () => {
    it('should handle player ready state change', () => {
      const readyData = { ready: true };
      const mockPlayerData = {
        player: { id: 'player1', name: 'Test Player' },
        room: { name: 'test-room' }
      };
      const mockPlayers = [{ id: 'player1', ready: true }];
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      (roomService.canStartGame as jest.Mock).mockReturnValue(true);
      
      gateway.handlePlayerReady(readyData, mockClient as Socket);
      
      expect(roomService.setPlayerReady).toHaveBeenCalledWith('test-room', 'player1', true);
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('player-ready-changed', expect.any(Object));
    });

    it('should handle player not found', () => {
      const readyData = { ready: true };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handlePlayerReady(readyData, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        message: 'Player not found in any room'
      }));
    });
  });

  describe('start-game event', () => {
    it('should handle successful game start', () => {
      const mockPlayerData = {
        player: { id: 'player1', isHost: true },
        room: { name: 'test-room' }
      };
      const mockGameState = { players: new Map(), gameOver: false };
      const mockPlayers = [{ id: 'player1', ready: true }];
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.canStartGame as jest.Mock).mockReturnValue(true);
      (roomService.startGame as jest.Mock).mockReturnValue(true);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      
      gateway.handleStartGame({}, mockClient as Socket);
      
      expect(roomService.startGame).toHaveBeenCalledWith('test-room', false);
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-started', expect.any(Object));
    });

    it('should reject start game for non-host', () => {
      const mockPlayerData = {
        player: { id: 'player1', isHost: false },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleStartGame({}, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        message: 'Only host can start the game'
      }));
    });

    it('should handle start-game error when player not found', () => {
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handleStartGame({}, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Player not found in any room'
      });
    });

    it('should handle start-game error when player is not host', () => {
      const mockPlayerData = {
        player: { id: 'player1', isHost: false },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleStartGame({}, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Only host can start the game'
      });
    });
  });

  describe('game-action event', () => {
    it('should handle valid game action', () => {
      const actionData = { action: 'move-left' as const };
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'playing' }
      };
      const mockGameState = { gameOver: false };
      const mockPlayers = [{ id: 'player1', name: 'Test Player', score: 100 }];
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.processPlayerAction as jest.Mock).mockReturnValue(true);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (roomService.updatePlayerStats as jest.Mock).mockReturnValue(true);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      
      gateway.handleGameAction(actionData, mockClient as Socket);
      
      expect(gameService.processPlayerAction).toHaveBeenCalledWith('test-room', 'player1', 'move-left');
      expect(roomService.updatePlayerStats).toHaveBeenCalledWith('test-room');
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-state-update', { 
        gameState: { gameOver: false, players: {} }, 
        players: mockPlayers 
      });
    });

    it('should handle game action when game is over', async () => {
      const actionData = { action: 'move-left' as const };
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'playing' }
      };
      const mockGameState = { gameOver: true, winner: 'player2', players: new Map() };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.processPlayerAction as jest.Mock).mockReturnValue(true);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (roomService.endGame as jest.Mock).mockResolvedValue(true);
      
      await gateway.handleGameAction(actionData, mockClient as Socket);
      
      expect(roomService.endGame).toHaveBeenCalledWith('test-room');
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-ended', expect.objectContaining({
        winner: 'player2'
      }));
    });

    it('should reject action for non-playing game', () => {
      const actionData = { action: 'move-left' as const };
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'waiting' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleGameAction(actionData, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        message: 'Game is not currently in progress'
      }));
    });

    it('should handle game-action error when player not found', () => {
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handleGameAction({ action: 'move-left' }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Player not found in any room'
      });
    });

    it('should handle game-action error when game is not in progress', () => {
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'waiting' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleGameAction({ action: 'move-left' }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Game is not currently in progress'
      });
    });

    it('should handle skip-piece action', () => {
      const actionData = { action: 'skip-piece' as const };
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'playing' }
      };
      const mockGameState = { gameOver: false, players: new Map() };
      const mockPlayers = [{ id: 'player1', name: 'Test Player', score: 100 }];
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.processPlayerAction as jest.Mock).mockReturnValue(true);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (roomService.updatePlayerStats as jest.Mock).mockReturnValue(true);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      
      gateway.handleGameAction(actionData, mockClient as Socket);
      
      expect(gameService.processPlayerAction).toHaveBeenCalledWith('test-room', 'player1', 'skip-piece');
      expect(roomService.updatePlayerStats).toHaveBeenCalledWith('test-room');
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-state-update', {
        gameState: { gameOver: false, players: {} },
        players: mockPlayers
      });
    });
  });

  describe('restart-game event', () => {
    it('should handle game restart by host', () => {
      const mockPlayerData = {
        player: { id: 'player1', isHost: true },
        room: { name: 'test-room' }
      };
      const mockPlayers = [{ id: 'player1', ready: false }];
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      
      gateway.handleRestartGame(mockClient as Socket);
      
      expect(roomService.resetRoom).toHaveBeenCalledWith('test-room');
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-reset', expect.any(Object));
    });

    it('should reject restart for non-host', () => {
      const mockPlayerData = {
        player: { id: 'player1', isHost: false },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleRestartGame(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        message: 'Only host can restart the game'
      }));
    });

    it('should handle restart-game error when player not found', () => {
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handleRestartGame(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Player not found in any room'
      });
    });

    it('should handle restart-game error when player is not host', () => {
      const mockPlayerData = {
        player: { id: 'player1', isHost: false },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleRestartGame(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Only host can restart the game'
      });
    });
  });

  describe('get-room-info event', () => {
    it('should return room info for waiting game', () => {
      const mockPlayerData = {
        room: { name: 'test-room', gameState: 'waiting' }
      };
      const mockPlayers = [{ id: 'player1', ready: false }];
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      
      gateway.handleGetRoomInfo(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('room-info', expect.objectContaining({
        room: expect.objectContaining({
          name: 'test-room',
          gameState: 'waiting'
        }),
        gameState: null
      }));
    });

    it('should return room info for playing game', () => {
      const mockPlayerData = {
        room: { name: 'test-room', gameState: 'playing' }
      };
      const mockPlayers = [{ id: 'player1', ready: true }];
      const mockGameState = { gameOver: false };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      
      gateway.handleGetRoomInfo(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('room-info', expect.objectContaining({
        room: expect.objectContaining({
          gameState: 'playing'
        }),
        gameState: expect.objectContaining({
          gameOver: false
        })
      }));
    });

    it('should handle get-room-info error when player not found', () => {
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handleGetRoomInfo(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Player not found in any room'
      });
    });
  });

  describe('reconnection functionality', () => {
    it('should handle heartbeat messages', () => {
      const mockPlayerData = {
        player: { id: 'player1', lastSeen: new Date(Date.now() - 1000) },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleHeartbeat(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('heartbeat-ack');
      expect(mockPlayerData.player.lastSeen.getTime()).toBeGreaterThan(Date.now() - 100);
    });

    it('should handle reconnection requests successfully', () => {
      const mockRoom = { 
        name: 'test-room', 
        gameState: 'waiting' as const,
        players: new Map([
          ['player1', { 
            id: 'player1', 
            name: 'testPlayer', 
            isConnected: false,
            reconnectionToken: 'valid-token'
          }]
        ])
      };
      const mockReconnectedPlayer = { 
        id: 'player1', 
        name: 'testPlayer', 
        isConnected: true 
      };
      
      (roomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (roomService.reconnectPlayer as jest.Mock).mockReturnValue(mockReconnectedPlayer);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue([mockReconnectedPlayer]);
      
      gateway.handleReconnectionRequest({
        roomName: 'test-room',
        playerName: 'testPlayer',
        reconnectionToken: 'valid-token'
      }, mockClient as Socket);
      
      expect(mockClient.join).toHaveBeenCalledWith('test-room');
      expect(mockClient.emit).toHaveBeenCalledWith('reconnection-success', expect.objectContaining({
        player: mockReconnectedPlayer
      }));
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
    });

    it('should handle reconnection request with invalid token', () => {
      const mockRoom = { 
        name: 'test-room', 
        gameState: 'waiting' as const,
        players: new Map([
          ['player1', { 
            id: 'player1', 
            name: 'testPlayer', 
            isConnected: false,
            reconnectionToken: 'valid-token'
          }]
        ])
      };
      
      (roomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      
      gateway.handleReconnectionRequest({
        roomName: 'test-room',
        playerName: 'testPlayer',
        reconnectionToken: 'invalid-token'
      }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('reconnection-error', {
        message: 'Invalid reconnection token'
      });
    });

    it('should handle reconnection request for non-existent room', () => {
      (roomService.getRoom as jest.Mock).mockReturnValue(null);
      
      gateway.handleReconnectionRequest({
        roomName: 'non-existent-room',
        playerName: 'testPlayer'
      }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('reconnection-error', {
        message: 'Room not found'
      });
    });

    it('should handle disconnection with reconnection data', () => {
      const mockDisconnectionData = {
        player: { id: 'player1', name: 'testPlayer' },
        room: { name: 'test-room', gameState: 'waiting' }
      };
      const mockPlayers = [{ id: 'player2', isConnected: true }];
      
      (roomService.markPlayerDisconnected as jest.Mock).mockReturnValue(mockDisconnectionData);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      
      gateway.handleDisconnect(mockClient as Socket);
      
      expect(roomService.markPlayerDisconnected).toHaveBeenCalledWith(mockClient.id);
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('player-disconnected', expect.objectContaining({
        playerId: 'player1',
        playerName: 'testPlayer',
        canReconnect: true
      }));
    });

    it('should detect reconnection in join-room handler', () => {
      const mockPlayer = { 
        id: 'player1', 
        name: 'testPlayer', 
        isConnected: true,
        reconnectionToken: 'token123'
      };
      const mockRoom = { name: 'test-room', gameState: 'playing' };
      const mockGameState = { gameOver: false };
      
      (roomService.addPlayerToRoom as jest.Mock).mockReturnValue(mockPlayer);
      (roomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue([mockPlayer]);
      
      gateway.handleJoinRoom({
        roomName: 'test-room',
        playerName: 'testPlayer',
        reconnectionToken: 'token123'
      }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('join-room-success', expect.objectContaining({
        isReconnection: true,
        gameState: { gameOver: false, players: {} }
      }));
    });
  });

  describe('quit-game event', () => {
    it('should handle solo game quit', async () => {
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'playing', players: new Map([['player1', { id: 'player1' }]]) }
      };
      const mockGameState = { 
        players: new Map([['player1', { id: 'player1', isAlive: true }]]),
        gameOver: false 
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (roomService.endGame as jest.Mock).mockResolvedValue(true);
      
      await gateway.handleQuitGame(mockClient as Socket);
      
      expect(mockGameState.gameOver).toBe(true);
      expect(mockGameState.players.get('player1')?.isAlive).toBe(false);
      expect(roomService.endGame).toHaveBeenCalledWith('test-room');
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-ended', expect.objectContaining({
        winner: null,
        reason: 'Player quit'
      }));
    });

    it('should handle multiplayer game quit without ending game', async () => {
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { 
          name: 'test-room', 
          gameState: 'playing', 
          players: new Map([
            ['player1', { id: 'player1' }],
            ['player2', { id: 'player2' }]
          ]) 
        }
      };
      const mockGameState = { 
        players: new Map([['player1', { id: 'player1', isAlive: true }]]),
        gameOver: false 
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (gameService.checkForGameOver as jest.Mock).mockReturnValue(false);
      
      await gateway.handleQuitGame(mockClient as Socket);
      
      expect(mockGameState.players.get('player1')?.isAlive).toBe(false);
      expect(gameService.checkForGameOver).toHaveBeenCalledWith('test-room');
      expect(roomService.endGame).not.toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('player-quit', expect.objectContaining({
        playerId: 'player1'
      }));
    });

    it('should handle multiplayer game quit that ends game', async () => {
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { 
          name: 'test-room', 
          gameState: 'playing', 
          players: new Map([
            ['player1', { id: 'player1' }],
            ['player2', { id: 'player2' }]
          ]) 
        }
      };
      const mockGameState = { 
        players: new Map([['player1', { id: 'player1', isAlive: true }]]),
        gameOver: false,
        winner: 'player2'
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (gameService.checkForGameOver as jest.Mock).mockReturnValue(true);
      (roomService.endGame as jest.Mock).mockResolvedValue(true);
      
      await gateway.handleQuitGame(mockClient as Socket);
      
      expect(mockGameState.players.get('player1')?.isAlive).toBe(false);
      expect(gameService.checkForGameOver).toHaveBeenCalledWith('test-room');
      expect(roomService.endGame).toHaveBeenCalledWith('test-room');
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-ended', expect.objectContaining({
        winner: 'player2',
        reason: 'Player quit'
      }));
    });

    it('should handle quit-game error when player not found', async () => {
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      await gateway.handleQuitGame(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Player not found in any room'
      });
    });

    it('should handle quit-game error when no game in progress', async () => {
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'waiting' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      await gateway.handleQuitGame(mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'No game in progress to quit'
      });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle disconnection when last player leaves during game', () => {
      const mockRoom = { 
        name: 'test-room', 
        gameState: 'playing' as const, 
        players: new Map() // Empty after player disconnection
      };
      
      (roomService.markPlayerDisconnected as jest.Mock).mockReturnValue({
        player: { id: 'player1' },
        room: mockRoom
      });
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue([]);
      
      gateway.handleDisconnect(mockClient as Socket);
      
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('game-paused', {
        reason: 'All players disconnected',
      });
    });

    it('should handle heartbeat for player not found', () => {
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handleHeartbeat(mockClient as Socket);
      
      expect(mockClient.emit).not.toHaveBeenCalledWith('heartbeat-ack');
    });

    it('should handle reconnection request with missing fields', () => {
      gateway.handleReconnectionRequest({
        roomName: '',
        playerName: 'testPlayer'
      }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('reconnection-error', {
        message: 'Room name and player name are required'
      });
    });

    it('should handle reconnection request for non-disconnected player', () => {
      const mockRoom = { 
        name: 'test-room', 
        gameState: 'waiting' as const,
        players: new Map([
          ['player1', { 
            id: 'player1', 
            name: 'testPlayer', 
            isConnected: true // Player is connected
          }]
        ])
      };
      
      (roomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      
      gateway.handleReconnectionRequest({
        roomName: 'test-room',
        playerName: 'testPlayer'
      }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('reconnection-error', {
        message: 'No disconnected player found with that name'
      });
    });

    it('should handle failed reconnection', () => {
      const mockRoom = { 
        name: 'test-room', 
        gameState: 'waiting' as const,
        players: new Map([
          ['player1', { 
            id: 'player1', 
            name: 'testPlayer', 
            isConnected: false
          }]
        ])
      };
      
      (roomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
      (roomService.reconnectPlayer as jest.Mock).mockReturnValue(null);
      
      gateway.handleReconnectionRequest({
        roomName: 'test-room',
        playerName: 'testPlayer'
      }, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('reconnection-error', {
        message: 'Failed to reconnect player'
      });
    });

    it('should handle start-game with fast mode', () => {
      const mockPlayerData = {
        player: { id: 'player1', isHost: true },
        room: { name: 'test-room' }
      };
      const mockGameState = { players: new Map(), gameOver: false };
      const mockPlayers = [{ id: 'player1', ready: true }];
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.canStartGame as jest.Mock).mockReturnValue(true);
      (roomService.startGame as jest.Mock).mockReturnValue(true);
      (gameService.getGameState as jest.Mock).mockReturnValue(mockGameState);
      (roomService.getRoomPlayers as jest.Mock).mockReturnValue(mockPlayers);
      
      gateway.handleStartGame({ fast: true }, mockClient as Socket);
      
      expect(roomService.startGame).toHaveBeenCalledWith('test-room', true);
      expect(mockServer.emit).toHaveBeenCalledWith('game-started', expect.objectContaining({
        fastMode: true
      }));
    });

    it('should handle start-game when cannot start due to not ready players', () => {
      const mockRoom = { 
        name: 'test-room', 
        maxPlayers: 2, 
        players: new Map([
          ['player1', { id: 'player1', isConnected: true, isReady: true }],
          ['player2', { id: 'player2', isConnected: true, isReady: false }]
        ])
      };
      const mockPlayerData = {
        player: { id: 'player1', isHost: true },
        room: mockRoom
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.canStartGame as jest.Mock).mockReturnValue(false);
      
      gateway.handleStartGame({}, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        message: 'Waiting for all players to be ready (1/2 ready)'
      }));
    });

    it('should handle start-game with unknown condition', () => {
      const mockRoom = { 
        name: 'test-room', 
        maxPlayers: 2, 
        players: new Map([
          ['player1', { id: 'player1', isConnected: true, isReady: true }],
          ['player2', { id: 'player2', isConnected: true, isReady: true }]
        ])
      };
      const mockPlayerData = {
        player: { id: 'player1', isHost: true },
        room: mockRoom
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (roomService.canStartGame as jest.Mock).mockReturnValue(false);
      
      gateway.handleStartGame({}, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        message: 'Cannot start game. Unknown reason.'
      }));
    });

    it('should handle game action that fails processing', () => {
      const actionData = { action: 'move-left' as const };
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'playing' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.processPlayerAction as jest.Mock).mockReturnValue(false);
      
      gateway.handleGameAction(actionData, mockClient as Socket);
      
      expect(gameService.processPlayerAction).toHaveBeenCalledWith('test-room', 'player1', 'move-left');
      expect(mockServer.emit).not.toHaveBeenCalledWith('game-state-update');
    });

    it('should handle game action with null game state', () => {
      const actionData = { action: 'move-left' as const };
      const mockPlayerData = {
        player: { id: 'player1' },
        room: { name: 'test-room', gameState: 'playing' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      (gameService.processPlayerAction as jest.Mock).mockReturnValue(true);
      (gameService.getGameState as jest.Mock).mockReturnValue(null);
      
      gateway.handleGameAction(actionData, mockClient as Socket);
      
      expect(mockServer.emit).not.toHaveBeenCalledWith('game-state-update');
    });

    it('should handle serializeGameState with null input', () => {
      const result = (gateway as any).serializeGameState(null);
      expect(result).toBeNull();
    });

    it('should serialize GameState properly', () => {
      const gameState = {
        players: new Map([['player1', { id: 'player1' }]]),
        gameOver: false,
        winner: null
      };
      
      const result = (gateway as any).serializeGameState(gameState);
      
      expect(result).toEqual({
        players: { player1: { id: 'player1' } },
        gameOver: false,
        winner: null
      });
    });
  });

  describe('chat-message event', () => {
    it('should broadcast chat message to room', () => {
      const chatData = { message: 'Hello everyone!' };
      const mockPlayerData = {
        player: { id: 'player1', name: 'TestPlayer' },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleChatMessage(chatData, mockClient as Socket);
      
      expect(mockServer.to).toHaveBeenCalledWith('test-room');
      expect(mockServer.emit).toHaveBeenCalledWith('chat-message', {
        playerId: 'player1',
        playerName: 'TestPlayer',
        message: 'Hello everyone!',
        timestamp: expect.any(String)
      });
    });

    it('should handle empty message', () => {
      const chatData = { message: '' };
      const mockPlayerData = {
        player: { id: 'player1', name: 'TestPlayer' },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleChatMessage(chatData, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Message cannot be empty'
      });
      expect(mockServer.emit).not.toHaveBeenCalledWith('chat-message', expect.anything());
    });

    it('should handle chat message when player not found', () => {
      const chatData = { message: 'Hello!' };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(null);
      
      gateway.handleChatMessage(chatData, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Player not found in any room'
      });
    });

    it('should trim long messages', () => {
      const longMessage = 'a'.repeat(600); // 600 characters
      const chatData = { message: longMessage };
      const mockPlayerData = {
        player: { id: 'player1', name: 'TestPlayer' },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleChatMessage(chatData, mockClient as Socket);
      
      expect(mockServer.emit).toHaveBeenCalledWith('chat-message', {
        playerId: 'player1',
        playerName: 'TestPlayer',
        message: 'a'.repeat(500), // Should be trimmed to 500 characters
        timestamp: expect.any(String)
      });
    });

    it('should handle whitespace-only message', () => {
      const chatData = { message: '   \n\t   ' };
      const mockPlayerData = {
        player: { id: 'player1', name: 'TestPlayer' },
        room: { name: 'test-room' }
      };
      
      (roomService.getPlayerBySocketId as jest.Mock).mockReturnValue(mockPlayerData);
      
      gateway.handleChatMessage(chatData, mockClient as Socket);
      
      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Message cannot be empty'
      });
    });
  });
});
