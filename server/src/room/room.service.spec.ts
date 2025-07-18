import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from './room.service';
import { GameService } from '../game/game.service';
import { GameLoopService } from '../game/game-loop.service';

describe('RoomService', () => {
  let service: RoomService;
  let gameService: GameService;
  let gameLoopService: GameLoopService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: GameService,
          useValue: {
            createGame: jest.fn(),
            endGame: jest.fn(),
            getGameState: jest.fn(),
          },
        },
        {
          provide: GameLoopService,
          useValue: {
            addActiveGame: jest.fn(),
            removeActiveGame: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    gameService = module.get<GameService>(GameService);
    gameLoopService = module.get<GameLoopService>(GameLoopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a new room', () => {
      const roomName = 'test-room';
      const room = service.createRoom(roomName);

      expect(room).toBeDefined();
      expect(room.name).toBe(roomName);
      expect(room.players.size).toBe(0);
      expect(room.gameState).toBe('waiting');
    });

    it('should return existing room if already exists', () => {
      const roomName = 'test-room';
      const room1 = service.createRoom(roomName);
      const room2 = service.createRoom(roomName);

      expect(room1).toBe(room2);
    });
  });

  describe('addPlayerToRoom', () => {
    it('should add player to room', () => {
      const roomName = 'test-room';
      const playerName = 'player1';
      const socketId = 'socket123';

      const player = service.addPlayerToRoom(roomName, playerName, socketId);

      expect(player).toBeDefined();
      expect(player?.name).toBe(playerName);
      expect(player?.socketId).toBe(socketId);
      expect(player?.isHost).toBe(true); // First player is host
    });

    it('should not add player with duplicate name', () => {
      const roomName = 'test-room';
      const playerName = 'player1';

      service.addPlayerToRoom(roomName, playerName, 'socket1');
      const duplicate = service.addPlayerToRoom(roomName, playerName, 'socket2');

      expect(duplicate).toBeNull();
    });

    it('should assign host to first player', () => {
      const roomName = 'test-room';
      
      const player1 = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      const player2 = service.addPlayerToRoom(roomName, 'player2', 'socket2');

      expect(player1?.isHost).toBe(true);
      expect(player2?.isHost).toBe(false);
    });
  });

  describe('canStartGame', () => {
    it('should return false for empty room', () => {
      const roomName = 'test-room';
      service.createRoom(roomName);

      const canStart = service.canStartGame(roomName);

      expect(canStart).toBe(false);
    });

    it('should return false for single ready host (room not full)', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      service.setPlayerReady(roomName, player!.id, true);

      const canStart = service.canStartGame(roomName);

      expect(canStart).toBe(false);
    });

    it('should return true when all players are ready', () => {
      const roomName = 'test-room';
      const player1 = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      const player2 = service.addPlayerToRoom(roomName, 'player2', 'socket2');
      
      service.setPlayerReady(roomName, player1!.id, true);
      service.setPlayerReady(roomName, player2!.id, true);

      const canStart = service.canStartGame(roomName);

      expect(canStart).toBe(true);
    });

    it('should return false when not all players are ready', () => {
      const roomName = 'test-room';
      const player1 = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      const player2 = service.addPlayerToRoom(roomName, 'player2', 'socket2');
      
      service.setPlayerReady(roomName, player1!.id, true);
      // player2 not ready

      const canStart = service.canStartGame(roomName);

      expect(canStart).toBe(false);
    });
  });

  describe('startGame', () => {
    it('should start game when conditions are met', () => {
      const roomName = 'test-room';
      const player1 = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      const player2 = service.addPlayerToRoom(roomName, 'player2', 'socket2');
      service.setPlayerReady(roomName, player1!.id, true);
      service.setPlayerReady(roomName, player2!.id, true);

      const result = service.startGame(roomName);

      expect(result).toBe(true);
      expect(gameService.createGame).toHaveBeenCalledWith(roomName, [player1!.id, player2!.id]);
      expect(gameLoopService.addActiveGame).toHaveBeenCalledWith(roomName);
    });

    it('should not start game when conditions are not met', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      // Player not ready

      const result = service.startGame(roomName);

      expect(result).toBe(false);
      expect(gameService.createGame).not.toHaveBeenCalled();
    });
  });

  describe('removePlayerFromRoom', () => {
    it('should remove player from room', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      
      const result = service.removePlayerFromRoom(roomName, player!.id);
      
      expect(result).toBe(true);
      expect(service.getRoomPlayers(roomName)).toHaveLength(0);
    });

    it('should assign new host when host leaves', () => {
      const roomName = 'test-room';
      const player1 = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      const player2 = service.addPlayerToRoom(roomName, 'player2', 'socket2');
      
      // player1 is host initially
      expect(player1?.isHost).toBe(true);
      expect(player2?.isHost).toBe(false);
      
      // Remove host
      service.removePlayerFromRoom(roomName, player1!.id);
      
      const remainingPlayers = service.getRoomPlayers(roomName);
      expect(remainingPlayers).toHaveLength(1);
      expect(remainingPlayers[0].isHost).toBe(true);
    });

    it('should remove room when last player leaves', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      
      service.removePlayerFromRoom(roomName, player!.id);
      
      const room = service.getRoom(roomName);
      expect(room).toBeUndefined();
    });

    it('should return false for non-existent room or player', () => {
      const result1 = service.removePlayerFromRoom('non-existent', 'player1');
      expect(result1).toBe(false);

      const roomName = 'test-room';
      service.createRoom(roomName);
      const result2 = service.removePlayerFromRoom(roomName, 'non-existent-player');
      expect(result2).toBe(false);
    });
  });

  describe('setPlayerReady', () => {
    it('should set player ready state', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      
      const result = service.setPlayerReady(roomName, player!.id, true);
      
      expect(result).toBe(true);
      const players = service.getRoomPlayers(roomName);
      expect(players[0].isReady).toBe(true);
    });

    it('should return false for non-existent room or player', () => {
      const result1 = service.setPlayerReady('non-existent', 'player1', true);
      expect(result1).toBe(false);

      const roomName = 'test-room';
      service.createRoom(roomName);
      const result2 = service.setPlayerReady(roomName, 'non-existent-player', true);
      expect(result2).toBe(false);
    });
  });

  describe('endGame', () => {
    it('should end game and reset player states', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      service.setPlayerReady(roomName, player!.id, true);
      service.startGame(roomName);
      
      const result = service.endGame(roomName);
      
      expect(result).toBe(true);
      expect(gameService.endGame).toHaveBeenCalledWith(roomName);
      expect(gameLoopService.removeActiveGame).toHaveBeenCalledWith(roomName);
      
      const room = service.getRoom(roomName);
      expect(room?.gameState).toBe('finished');
      expect(service.getRoomPlayers(roomName)[0].isReady).toBe(false);
    });

    it('should return false for non-existent room', () => {
      const result = service.endGame('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('resetRoom', () => {
    it('should reset room to waiting state', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      service.setPlayerReady(roomName, player!.id, true);
      service.startGame(roomName);
      
      const result = service.resetRoom(roomName);
      
      expect(result).toBe(true);
      const room = service.getRoom(roomName);
      expect(room?.gameState).toBe('waiting');
      expect(service.getRoomPlayers(roomName)[0].isReady).toBe(false);
    });

    it('should return false for non-existent room', () => {
      const result = service.resetRoom('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getPlayerBySocketId', () => {
    it('should find player by socket ID', () => {
      const roomName = 'test-room';
      const socketId = 'socket123';
      const player = service.addPlayerToRoom(roomName, 'player1', socketId);
      
      const result = service.getPlayerBySocketId(socketId);
      
      expect(result).toBeDefined();
      expect(result?.player.id).toBe(player!.id);
      expect(result?.room.name).toBe(roomName);
    });

    it('should return null for non-existent socket ID', () => {
      const result = service.getPlayerBySocketId('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getAllRooms', () => {
    it('should return all rooms', () => {
      service.createRoom('room1');
      service.createRoom('room2');
      
      const rooms = service.getAllRooms();
      
      expect(rooms).toHaveLength(2);
      expect(rooms.map(r => r.name)).toContain('room1');
      expect(rooms.map(r => r.name)).toContain('room2');
    });

    it('should return empty array when no rooms exist', () => {
      const rooms = service.getAllRooms();
      expect(rooms).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should not add player to room when game is playing', () => {
      const roomName = 'test-room';
      const player1 = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      const player2 = service.addPlayerToRoom(roomName, 'player2', 'socket2');
      service.setPlayerReady(roomName, player1!.id, true);
      service.setPlayerReady(roomName, player2!.id, true);
      service.startGame(roomName);
      
      const player3 = service.addPlayerToRoom(roomName, 'player3', 'socket3');
      
      expect(player3).toBeNull();
    });

    it('should not add player when room is full', () => {
      const roomName = 'test-room';
      
      // Add max players (8)
      for (let i = 0; i < 8; i++) {
        service.addPlayerToRoom(roomName, `player${i}`, `socket${i}`);
      }
      
      // Try to add one more
      const extraPlayer = service.addPlayerToRoom(roomName, 'extra', 'socketExtra');
      
      expect(extraPlayer).toBeNull();
    });

    it('should return false for canStartGame with non-existent room', () => {
      const result = service.canStartGame('non-existent');
      expect(result).toBe(false);
    });

    it('should return false for canStartGame when game is not in waiting state', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      service.setPlayerReady(roomName, player!.id, true);
      service.startGame(roomName);
      
      const result = service.canStartGame(roomName);
      expect(result).toBe(false);
    });
  });

  describe('reconnection functionality', () => {
    it('should allow player to reconnect with same name', () => {
      const roomName = 'test-room';
      const playerName = 'player1';
      const socketId1 = 'socket1';
      const socketId2 = 'socket2';

      // Add player initially
      const player1 = service.addPlayerToRoom(roomName, playerName, socketId1);
      expect(player1).toBeTruthy();
      expect(player1?.isConnected).toBe(true);

      // Mark player as disconnected
      const disconnectionData = service.markPlayerDisconnected(socketId1);
      expect(disconnectionData).toBeTruthy();
      expect(disconnectionData?.player.isConnected).toBe(false);

      // Reconnect with new socket
      const reconnectedPlayer = service.addPlayerToRoom(roomName, playerName, socketId2);
      expect(reconnectedPlayer).toBeTruthy();
      expect(reconnectedPlayer?.isConnected).toBe(true);
      expect(reconnectedPlayer?.socketId).toBe(socketId2);
      expect(reconnectedPlayer?.id).toBe(player1?.id); // Same player ID
    });

    it('should generate and store reconnection tokens', () => {
      const roomName = 'test-room';
      const playerName = 'player1';
      const socketId = 'socket1';

      const player = service.addPlayerToRoom(roomName, playerName, socketId);
      expect(player?.reconnectionToken).toBeDefined();
      expect(typeof player?.reconnectionToken).toBe('string');
      expect(player?.reconnectionToken?.length).toBeGreaterThan(10);
    });

    it('should cleanup expired disconnected players', () => {
      const roomName = 'test-room';
      const playerName = 'player1';
      const socketId = 'socket1';

      // Add and disconnect player
      const player = service.addPlayerToRoom(roomName, playerName, socketId);
      expect(player).toBeDefined();
      
      const disconnectionResult = service.markPlayerDisconnected(socketId);
      expect(disconnectionResult).toBeDefined();

      // Verify player is marked as disconnected but still in room
      const room = service.getRoom(roomName);
      expect(room?.players.has(player!.id)).toBe(true);
      const roomPlayer = room?.players.get(player!.id);
      expect(roomPlayer?.isConnected).toBe(false);

      // Manually set an old disconnection time
      const disconnectedPlayers = service['disconnectedPlayers'];
      const disconnectionData = disconnectedPlayers.get(player!.id);
      expect(disconnectionData).toBeDefined();
      if (disconnectionData) {
        disconnectionData.disconnectedAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      }

      // Run cleanup
      service.cleanupExpiredDisconnections();

      // Room should be removed when last player is cleaned up
      const roomAfterCleanup = service.getRoom(roomName);
      expect(roomAfterCleanup).toBeUndefined();
      
      // Player should also be removed from disconnected players tracking
      expect(disconnectedPlayers.has(player!.id)).toBe(false);
    });

    it('should track disconnected players for reconnection', () => {
      const roomName = 'test-room';
      const playerName = 'player1';
      const socketId = 'socket1';

      const player = service.addPlayerToRoom(roomName, playerName, socketId);
      const disconnectionData = service.markPlayerDisconnected(socketId);

      expect(disconnectionData).toBeTruthy();
      expect(disconnectionData?.player.name).toBe(playerName);
      expect(disconnectionData?.room.name).toBe(roomName);

      // Check that disconnected player is tracked
      const disconnectedPlayers = service['disconnectedPlayers'];
      expect(disconnectedPlayers.has(player!.id)).toBe(true);
    });

    it('should handle reconnection during game in progress', () => {
      const roomName = 'test-room';
      const player1Name = 'player1';
      const player2Name = 'player2';

      // Add two players and start game
      const player1 = service.addPlayerToRoom(roomName, player1Name, 'socket1');
      const player2 = service.addPlayerToRoom(roomName, player2Name, 'socket2');
      
      service.setPlayerReady(roomName, player1!.id, true);
      service.setPlayerReady(roomName, player2!.id, true);
      service.startGame(roomName);

      // Disconnect player1
      service.markPlayerDisconnected('socket1');

      // Player1 should be able to reconnect during game
      const reconnectedPlayer = service.addPlayerToRoom(roomName, player1Name, 'socket3');
      expect(reconnectedPlayer).toBeTruthy();
      expect(reconnectedPlayer?.isConnected).toBe(true);
    });

    it('should update socket mappings correctly on reconnection', () => {
      const roomName = 'test-room';
      const playerName = 'player1';
      const socketId1 = 'socket1';
      const socketId2 = 'socket2';

      // Add player
      const player = service.addPlayerToRoom(roomName, playerName, socketId1);
      
      // Verify initial mapping
      const playerData1 = service.getPlayerBySocketId(socketId1);
      expect(playerData1?.player.id).toBe(player?.id);

      // Disconnect and reconnect
      service.markPlayerDisconnected(socketId1);
      service.addPlayerToRoom(roomName, playerName, socketId2);

      // Verify mappings are updated
      const playerData2 = service.getPlayerBySocketId(socketId2);
      expect(playerData2?.player.id).toBe(player?.id);
      
      const oldPlayerData = service.getPlayerBySocketId(socketId1);
      expect(oldPlayerData).toBeNull();
    });
  });
});
