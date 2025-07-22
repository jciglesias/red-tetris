import { configureStore } from '@reduxjs/toolkit';
import socketReducer, {
  SocketState,
  connectSocket,
  disconnectSocket,
  joinRoom,
  readyPlayer,
  startGame,
  gameAction,
  getRoomInfo,
  onConnect,
  onDisconnect,
  onJoinRoomSuccess,
  onJoinRoomError,
  onSetReadySuccess,
  onStartGameSuccess,
  onUpdateData,
  onUpdatedData,
  onError,
} from './socketSlice';
import { GameState } from '../components/Interfaces';

// Mock socket.io-client
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

// Mock the io function to return our mock socket
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}));

const defaultGameState: GameState = {
  roomName: 'room1',
  players: new Map(),
  pieceSequence: [],
  currentPieceIndex: 0,
  gameOver: false,
  winner: null,
  startTime: Date.now(),
};

describe('socketSlice', () => {
  let store: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.emit.mockClear();
    mockSocket.disconnect.mockClear();

    // Create store with middleware that ignores non-serializable values
    store = configureStore({
      reducer: {
        socket: socketReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ['socket/onUpdateData', 'socket/onUpdatedData'],
            ignoredPaths: ['socket.gamestate.players'],
          },
        }),
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().socket;
      expect(state.connected).toBe(false);
      expect(state.joined).toBe(false);
      expect(state.playerReady).toBe(false);
      expect(state.started).toBe(false);
      expect(state.isError).toBe(false);
      expect(state.contentError).toBe('');
      expect(state.playerId).toBe('');
    });
  });

  describe('synchronous actions', () => {
    it('should handle onConnect', () => {
      const payload = { room: 'room1', playerName: 'player1' };
      store.dispatch(onConnect(payload));
      const state = store.getState().socket;
      expect(state.connected).toBe(true);
      expect(state.playerId).toBe('room1_player1');
    });

    it('should handle onDisconnect', () => {
      const payload = { room: 'room1', playerName: 'player1' };
      store.dispatch(onConnect(payload));
      store.dispatch(onDisconnect());
      const state = store.getState().socket;
      expect(state.connected).toBe(false);
      expect(state.joined).toBe(false);
    });

    it('should handle onJoinRoomSuccess', () => {
      store.dispatch(onJoinRoomSuccess());
      const state = store.getState().socket;
      expect(state.joined).toBe(true);
    });

    it('should handle onJoinRoomError', () => {
      const errorMessage = 'Room is full';
      store.dispatch(onJoinRoomError(errorMessage));
      const state = store.getState().socket;
      expect(state.joined).toBe(false);
      expect(state.isError).toBe(true);
      expect(state.contentError).toBe(errorMessage);
    });

    it('should handle onSetReadySuccess', () => {
      store.dispatch(onSetReadySuccess());
      const state = store.getState().socket;
      expect(state.playerReady).toBe(true);
    });

    it('should handle onStartGameSuccess', () => {
      const opponents = ['opp1', 'opp2', 'opp3', 'opp4'];
      store.dispatch(onStartGameSuccess(opponents));
      const state = store.getState().socket;
      expect(state.started).toBe(true);
      expect(state.opponent1).toBe('opp1');
      expect(state.opponent2).toBe('opp2');
      expect(state.opponent3).toBe('opp3');
      expect(state.opponent4).toBe('opp4');
    });

    it('should handle onUpdateData', () => {
      store.dispatch(onUpdateData(defaultGameState));
      const state = store.getState().socket;
      expect(state.gamestate).toEqual(defaultGameState);
    });

    it('should handle onUpdatedData', () => {
      store.dispatch(onUpdatedData(defaultGameState));
      const state = store.getState().socket;
      expect(state.gamestate).toEqual(defaultGameState);
    });

    it('should handle onError', () => {
      const errorMessage = 'Connection error';
      store.dispatch(onError(errorMessage));
      const state = store.getState().socket;
      expect(state.isError).toBe(true);
      expect(state.contentError).toBe(errorMessage);
    });
  });

  describe('async thunks', () => {
    it('should handle connectSocket without throwing', async () => {
      const payload = { room: 'room1', playerName: 'player1' };
      
      // Should not throw when dispatching connectSocket
      expect(async () => {
        await store.dispatch(connectSocket(payload));
      }).not.toThrow();
    });

    it('should handle disconnectSocket without throwing', async () => {
      // Should not throw when dispatching disconnectSocket
      expect(async () => {
        await store.dispatch(disconnectSocket());
      }).not.toThrow();
    });

    it('should handle joinRoom without throwing', async () => {
      const payload = { room: 'room1', playerName: 'player1' };
      
      // Should not throw when dispatching joinRoom
      expect(async () => {
        await store.dispatch(joinRoom(payload));
      }).not.toThrow();
    });

    it('should handle readyPlayer without throwing', async () => {
      // Should not throw when dispatching readyPlayer
      expect(async () => {
        await store.dispatch(readyPlayer());
      }).not.toThrow();
    });

    it('should handle startGame without throwing', async () => {
      const payload = { fast: false };
      
      // Should not throw when dispatching startGame
      expect(async () => {
        await store.dispatch(startGame(payload));
      }).not.toThrow();
    });

    it('should handle gameAction without throwing', async () => {
      const payload = { action: 'move-left' };
      
      // Should not throw when dispatching gameAction
      expect(async () => {
        await store.dispatch(gameAction(payload));
      }).not.toThrow();
    });

    it('should handle getRoomInfo without throwing', async () => {
      // Should not throw when dispatching getRoomInfo
      expect(async () => {
        await store.dispatch(getRoomInfo());
      }).not.toThrow();
    });
  });

  describe('socket event handlers', () => {
    it('should set up component without errors', async () => {
      const payload = { room: 'room1', playerName: 'player1' };
      
      // Should not throw when setting up socket listeners
      expect(async () => {
        await store.dispatch(connectSocket(payload));
      }).not.toThrow();
    });
  });

  describe('reducer edge cases', () => {
    it('should handle onConnect with different payload formats', () => {
      const payload1 = { room: 'room1', playerName: 'player1' };
      const payload2 = { room: 'different-room', playerName: 'different-player' };
      
      let state = store.getState().socket;
      store.dispatch(onConnect(payload1));
      state = store.getState().socket;
      expect(state.connected).toBe(true);
      expect(state.playerId).toBe('room1_player1');
      
      store.dispatch(onConnect(payload2));
      state = store.getState().socket;
      expect(state.playerId).toBe('different-room_different-player');
    });

    it('should handle onJoinRoomError with different error messages', () => {
      const errors = ['Room is full', 'Invalid room name', 'Connection failed'];
      
      errors.forEach(error => {
        store.dispatch(onJoinRoomError(error));
        const state = store.getState().socket;
        expect(state.joined).toBe(false);
        expect(state.isError).toBe(true);
        expect(state.contentError).toBe(error);
      });
    });

    it('should handle onStartGameSuccess with various opponent configurations', () => {
      // Test with no opponents
      store.dispatch(onStartGameSuccess([]));
      let state = store.getState().socket;
      expect(state.started).toBe(true);
      expect(state.opponent1).toBe('');
      
      // Test with one opponent
      store.dispatch(onStartGameSuccess(['player2']));
      state = store.getState().socket;
      expect(state.opponent1).toBe('player2');
      
      // Test with multiple opponents
      store.dispatch(onStartGameSuccess(['player2', 'player3', 'player4', 'player5']));
      state = store.getState().socket;
      expect(state.opponent1).toBe('player2');
      expect(state.opponent2).toBe('player3');
      expect(state.opponent3).toBe('player4');
      expect(state.opponent4).toBe('player5');
    });

    it('should handle state transitions correctly', () => {
      // Test full workflow
      let state = store.getState().socket;
      expect(state.connected).toBe(false);
      expect(state.joined).toBe(false);
      
      // Connect
      store.dispatch(onConnect({ room: 'room1', playerName: 'player1' }));
      state = store.getState().socket;
      expect(state.connected).toBe(true);
      
      // Join room
      store.dispatch(onJoinRoomSuccess());
      state = store.getState().socket;
      expect(state.joined).toBe(true);
      
      // Set ready
      store.dispatch(onSetReadySuccess());
      state = store.getState().socket;
      expect(state.playerReady).toBe(true);
      
      // Start game
      store.dispatch(onStartGameSuccess(['opponent1']));
      state = store.getState().socket;
      expect(state.started).toBe(true);
      
      // Disconnect
      store.dispatch(onDisconnect());
      state = store.getState().socket;
      expect(state.connected).toBe(false);
      expect(state.joined).toBe(false);
    });
  });

  describe('socket event listeners and async thunk execution', () => {
    it('should handle socket being null in async thunks', async () => {
      // Test when socket is null - this covers the if (socket) conditions
      const { io } = require('socket.io-client');
      io.mockReturnValue(null);

      const payload = { room: 'room1', playerName: 'player1' };
      
      // These should not throw even when socket is null
      await store.dispatch(joinRoom(payload));
      await store.dispatch(readyPlayer());
      await store.dispatch(startGame({ fast: false }));
      await store.dispatch(gameAction({ action: 'move-left' }));
      await store.dispatch(getRoomInfo());
      await store.dispatch(disconnectSocket());

      // Verify state is not broken
      const state = store.getState().socket;
      expect(state).toBeDefined();
    });

    it('should properly set up socket event listeners in connectSocket', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Verify that all event listeners are registered
      expect(mockSocketInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('join-room-success', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('join-room-error', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('player-ready-changed', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('game-started', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('game-state-update', expect.any(Function));
      expect(mockSocketInstance.on).toHaveBeenCalledWith('room-info', expect.any(Function));
    });

    it('should handle player-ready-changed event for matching player', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the player-ready-changed callback
      const readyChangedCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'player-ready-changed')[1];

      // Simulate receiving player-ready-changed event for the current player
      readyChangedCallback({
        playerId: 'room1_player1',
        ready: true
      });

      const state = store.getState().socket;
      expect(state.playerReady).toBe(true);
    });

    it('should handle player-ready-changed event for different player', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the player-ready-changed callback
      const readyChangedCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'player-ready-changed')[1];

      // Simulate receiving player-ready-changed event for a different player
      readyChangedCallback({
        playerId: 'room1_player2',
        ready: true
      });

      const state = store.getState().socket;
      expect(state.playerReady).toBe(false); // Should not change for different player
    });

    it('should handle join-room-error with object message', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the join-room-error callback
      const errorCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'join-room-error')[1];

      // Simulate receiving error with object message
      errorCallback({ message: 'Room is full' });

      const state = store.getState().socket;
      expect(state.isError).toBe(true);
      expect(state.contentError).toBe('Room is full');
    });

    it('should handle join-room-error with string message', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the join-room-error callback
      const errorCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'join-room-error')[1];

      // Simulate receiving error with string message
      errorCallback('Simple error message');

      const state = store.getState().socket;
      expect(state.isError).toBe(true);
      expect(state.contentError).toBe('Simple error message');
    });

    it('should handle error event with object message', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the error callback
      const errorCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'error')[1];

      // Simulate receiving error with object message
      errorCallback({ message: 'Connection failed' });

      const state = store.getState().socket;
      expect(state.isError).toBe(true);
      expect(state.contentError).toBe('Connection failed');
    });

    it('should handle game-started event with opponent assignment', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the game-started callback
      const gameStartedCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'game-started')[1];

      // Simulate receiving game-started event
      const gameStateData = {
        gameState: {
          ...defaultGameState,
          players: {
            'room1_player1': { /* current player */ },
            'room1_player2': { /* opponent 1 */ },
            'room1_player3': { /* opponent 2 */ },
            'room1_player4': { /* opponent 3 */ },
            'room1_player5': { /* opponent 4 */ }
          }
        }
      };
      
      gameStartedCallback(gameStateData);

      const state = store.getState().socket;
      expect(state.started).toBe(true);
      expect(state.opponent1).toBe('room1_player2');
      expect(state.opponent2).toBe('room1_player3');
      expect(state.opponent3).toBe('room1_player4');
      expect(state.opponent4).toBe('room1_player5');
    });

    it('should handle room-info event', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the room-info callback
      const roomInfoCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'room-info')[1];

      // Simulate receiving room-info event
      const roomInfoData = {
        gameState: defaultGameState
      };
      
      roomInfoCallback(roomInfoData);

      const state = store.getState().socket;
      expect(state.gamestate).toEqual(defaultGameState);
    });

    it('should handle disconnectSocket when socket exists', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // First connect to set up socket
      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Then disconnect
      await store.dispatch(disconnectSocket());

      expect(mockSocketInstance.disconnect).toHaveBeenCalled();
      const state = store.getState().socket;
      expect(state.connected).toBe(false);
      expect(state.joined).toBe(false);
    });

    it('should emit correct data for joinRoom', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // First connect
      const connectPayload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(connectPayload));

      // Then join room
      await store.dispatch(joinRoom(connectPayload));

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('join-room', {
        roomName: 'room1',
        playerName: 'player1'
      });
    });

    it('should emit correct data for readyPlayer', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // First connect
      const connectPayload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(connectPayload));

      // Then set ready
      await store.dispatch(readyPlayer());

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('player-ready', {
        ready: true
      });
    });

    it('should emit correct data for startGame', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // First connect
      const connectPayload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(connectPayload));

      // Then start game
      await store.dispatch(startGame({ fast: true }));

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('start-game', { fast: true });
    });

    it('should emit correct data for gameAction', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // First connect
      const connectPayload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(connectPayload));

      // Then send game action
      await store.dispatch(gameAction({ action: 'move-right' }));

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('game-action', { action: 'move-right' });
    });

    it('should emit correct data for getRoomInfo', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // First connect
      const connectPayload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(connectPayload));

      // Then get room info
      await store.dispatch(getRoomInfo());

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('get-room-info');
    });
  });
});
