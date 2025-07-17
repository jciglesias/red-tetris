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

    it('should return true for single ready host', () => {
      const roomName = 'test-room';
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      service.setPlayerReady(roomName, player!.id, true);

      const canStart = service.canStartGame(roomName);

      expect(canStart).toBe(true);
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
      const player = service.addPlayerToRoom(roomName, 'player1', 'socket1');
      service.setPlayerReady(roomName, player!.id, true);

      const result = service.startGame(roomName);

      expect(result).toBe(true);
      expect(gameService.createGame).toHaveBeenCalledWith(roomName, [player!.id]);
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
      service.setPlayerReady(roomName, player1!.id, true);
      service.startGame(roomName);
      
      const player2 = service.addPlayerToRoom(roomName, 'player2', 'socket2');
      
      expect(player2).toBeNull();
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
});
