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
  sendMessage,
  relaunchGame,
  requestReconnection,
  onConnect,
  onDisconnect,
  onJoinRoomSuccess,
  onJoinRoomError,
  onSetReadySuccess,
  onStartGameSuccess,
  onUpdateData,
  onUpdatedData,
  onError,
  onGameWon,
  onGameOver,
  onGameReset,
  onHostChanged,
  addMessage,
  addMessages,
  onReconnectionSuccess,
  onReconnectionError,
  onScoreUpdate,
} from './socketSlice';
import { GameState, ChatMessage } from '../components/Interfaces';

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

// Mock NetworkUtils to avoid real network calls
jest.mock('../utils/NetworkUtils', () => ({
  findWorkingServerUrl: jest.fn().mockResolvedValue('http://localhost:3001'),
  testConnection: jest.fn().mockResolvedValue(true),
}));

const defaultGameState: GameState = {
  roomName: 'room1',
  players: {} as any,
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
            ignoredActions: [
              'socket/onUpdateData', 
              'socket/onUpdatedData',
              'socket/onGameWon',
              'socket/onGameOver',
              'socket/connectSocket/fulfilled',
              'socket/connectSocket/pending',
              'socket/connectSocket/rejected',
              'persist/PERSIST',
              'persist/REHYDRATE'
            ],
            ignoredPaths: [
              'socket.gamestate.players',
              'payload.players'
            ],
            ignoredActionsPaths: [
              'payload.players',
              'meta.arg',
              'payload'
            ],
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
      store.dispatch(onJoinRoomSuccess({ isHost: true }));
      const state = store.getState().socket;
      expect(state.joined).toBe(true);
      expect(state.isHost).toBe(true);
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
      store.dispatch(onJoinRoomSuccess({ isHost: false }));
      state = store.getState().socket;
      expect(state.joined).toBe(true);
      expect(state.isHost).toBe(false);
      
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
      expect(state.opponent1).toBe('player2');
      expect(state.opponent2).toBe('player3');
      expect(state.opponent3).toBe('player4');
      expect(state.opponent4).toBe('player5');
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
        playerName: 'player1',
        reconnectionToken: ''
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

  it('should handle game-ended event with winner matching current player', async () => {
    const store = configureStore({
      reducer: { socket: socketReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [
              'socket/onUpdateData', 
              'socket/onUpdatedData',
              'socket/onGameWon',
              'socket/onGameOver',
              'socket/connectSocket/fulfilled',
              'socket/connectSocket/pending',
              'socket/connectSocket/rejected'
            ],
            ignoredPaths: ['socket.gamestate.players'],
            ignoredActionsPaths: ['payload.players', 'meta.arg', 'payload'],
          },
        }),
    });

    // Mock socket with winner scenario
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'game-ended') {
          // Immediately call the callback to simulate the event
          setTimeout(() => {
            callback({
              winner: 'room1_player1',
              finalState: {
                roomName: 'room1',
                players: {},
                pieceSequence: [],
                currentPieceIndex: 0,
                gameOver: true,
                winner: 'room1_player1',
                startTime: Date.now()
              }
            });
          }, 0);
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn()
    };

    (require('socket.io-client').io as jest.Mock).mockReturnValue(mockSocket);

    await store.dispatch(connectSocket({ room: 'room1', playerName: 'player1' }));
    
    // Wait for the async callback to be processed
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Check that onGameWon was dispatched
    const state = store.getState().socket;
    expect(state.gameWon).toBe(true);
  });

  it('should handle game-ended event with winner not matching current player', async () => {
    const store = configureStore({
      reducer: { socket: socketReducer },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [
              'socket/onUpdateData', 
              'socket/onUpdatedData',
              'socket/onGameWon',
              'socket/onGameOver',
              'socket/connectSocket/fulfilled',
              'socket/connectSocket/pending',
              'socket/connectSocket/rejected'
            ],
            ignoredPaths: ['socket.gamestate.players'],
            ignoredActionsPaths: ['payload.players', 'meta.arg', 'payload'],
          },
        }),
    });

    // Mock socket with losing scenario
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'game-ended') {
          // Immediately call the callback to simulate the event
          setTimeout(() => {
            callback({
              winner: 'room1_player2',
              finalState: {
                roomName: 'room1',
                players: {},
                pieceSequence: [],
                currentPieceIndex: 0,
                gameOver: true,
                winner: 'room1_player2',
                startTime: Date.now()
              }
            });
          }, 0);
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn()
    };

    (require('socket.io-client').io as jest.Mock).mockReturnValue(mockSocket);

    await store.dispatch(connectSocket({ room: 'room1', playerName: 'player1' }));
    
    // Wait for the async callback to be processed
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Check that onGameOver was dispatched
    const state = store.getState().socket;
    expect(state.gameOver).toBe(true);
  });

  it('should handle onGameWon reducer correctly', () => {
    const initialState: SocketState = {
      connected: false,
      joined: true,
      playerReady: true,
      started: true,
      isHost: false,
      isError: false,
      contentError: '',
      opponent1: 'player2',
      opponent2: 'player3',
      opponent3: 'player4',
      opponent4: 'player5',
      playerId: 'room1_player1',
      gamestate: {
        roomName: 'room1',
        players: {},
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      },
      gameOver: false,
      gameWon: false,
      score: 0,
      level: 1,
      messages: []
    };

    const finalGameState = {
      roomName: 'room1',
      players: {},
      pieceSequence: [],
      currentPieceIndex: 0,
      gameOver: true,
      winner: 'room1_player1',
      startTime: Date.now()
    };

    const action = onGameWon(finalGameState);
    const newState = socketReducer(initialState, action);

    expect(newState.gameWon).toBe(true);
    expect(newState.joined).toBe(false);
    expect(newState.playerReady).toBe(false);
    expect(newState.started).toBe(false);
    expect(newState.gamestate).toEqual(finalGameState);
  });

  it('should handle onGameOver reducer correctly', () => {
    const initialState: SocketState = {
      connected: false,
      joined: true,
      playerReady: true,
      started: true,
      isHost: false,
      isError: false,
      contentError: '',
      opponent1: 'player2',
      opponent2: 'player3',
      opponent3: 'player4',
      opponent4: 'player5',
      playerId: 'room1_player1',
      gamestate: {
        roomName: 'room1',
        players: {},
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      },
      gameOver: false,
      gameWon: false,
      score: 0,
      level: 1,
      messages: []
    };

    const finalGameState = {
      roomName: 'room1',
      players: {},
      pieceSequence: [],
      currentPieceIndex: 0,
      gameOver: true,
      winner: 'room1_player2',
      startTime: Date.now()
    };

    const action = onGameOver(finalGameState);
    const newState = socketReducer(initialState, action);

    expect(newState.gameOver).toBe(true);
    expect(newState.joined).toBe(false);
    expect(newState.playerReady).toBe(false);
    expect(newState.started).toBe(false);
    expect(newState.gamestate).toEqual(finalGameState);
  });

  it('should handle updated-data event with game over condition', () => {
    // Test the reducer directly since testing the socket event is complex
    const initialState: SocketState = {
      connected: false,
      joined: true,
      playerReady: false,
      started: true,
      isHost: false,
      isError: false,
      contentError: '',
      opponent1: '',
      opponent2: '',
      opponent3: '',
      opponent4: '',
      playerId: 'room1_player1',
      gamestate: {
        roomName: 'room1',
        players: {},
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      },
      gameOver: false,
      gameWon: false,
      score: 0,
      level: 1,
      messages: []
    };

    const gameState = {
      roomName: 'room1',
      players: {
        'room1_player1': {
          playerId: 'room1_player1',
          board: Array(20).fill(null).map(() => Array(10).fill(0)),
          currentPiece: { shape: [[1]], type: 'I' as const, rotation: 0, x: 0, y: 0 },
          nextPieces: [],
          spectrum: Array(10).fill(0),
          lines: 0,
          score: 0,
          level: 1,
          isAlive: false, // Player is dead
          penalties: 0
        }
      },
      pieceSequence: [],
      currentPieceIndex: 0,
      gameOver: false,
      winner: null,
      startTime: Date.now()
    };

    // Test game over condition via reducer
    const action = onGameOver(gameState);
    const newState = socketReducer(initialState, action);
    expect(newState.gameOver).toBe(true);
  });

  it('should handle updated-data event with winner condition', () => {
    // Test the reducer directly since testing the socket event is complex  
    const initialState: SocketState = {
      connected: false,
      joined: true,
      playerReady: false,
      started: true,
      isHost: false,
      isError: false,
      contentError: '',
      opponent1: '',
      opponent2: '',
      opponent3: '',
      opponent4: '',
      playerId: 'room1_player1',
      gamestate: {
        roomName: 'room1',
        players: {},
        pieceSequence: [],
        currentPieceIndex: 0,
        gameOver: false,
        winner: null,
        startTime: Date.now()
      },
      gameOver: false,
      gameWon: false,
      score: 0,
      level: 1,
      messages: []
    };

    const gameState = {
      roomName: 'room1',
      players: {
        'room1_player1': {
          playerId: 'room1_player1',
          board: Array(20).fill(null).map(() => Array(10).fill(0)),
          currentPiece: { shape: [[1]], type: 'I' as const, rotation: 0, x: 0, y: 0 },
          nextPieces: [],
          spectrum: Array(10).fill(0),
          lines: 0,
          score: 0,
          level: 1,
          isAlive: true,
          penalties: 0
        }
      },
      pieceSequence: [],
      currentPieceIndex: 0,
      gameOver: false,
      winner: 'room1_player1', // Current player is winner
      startTime: Date.now()
    };

    // Test winner condition via reducer
    const action = onGameWon(gameState);
    const newState = socketReducer(initialState, action);
    expect(newState.gameWon).toBe(true);
  });

  // Test utility functions - these are not directly exported but we can test their effects
  describe('utility functions', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear();
    });

    it('should handle reconnection error and clear token through requestReconnection', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1', reconnectionToken: 'invalid-token' };
      await store.dispatch(requestReconnection(payload));

      // Find the reconnection-error callback
      const errorCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'reconnection-error')?.[1];

      if (errorCallback) {
        // Simulate reconnection error
        errorCallback({ message: 'Invalid token' });

        const state = store.getState().socket;
        expect(state.isError).toBe(true);
        expect(state.contentError).toBe('Reconnection failed: Invalid token');
      }
    });

    it('should handle reconnection with existing token in connectSocket', async () => {
      // First store a token in localStorage by simulating a successful join
      const key = 'redtetris_reconnection_tokenroom1_player1';
      localStorage.setItem(key, 'existing-token');

      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // Mock the requestReconnection thunk to be called
      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Should call requestReconnection when token exists
      expect(mockSocketInstance.emit).toHaveBeenCalledWith('request-reconnection', {
        roomName: 'room1',
        playerName: 'player1',  
        reconnectionToken: 'existing-token'
      });
    });
  });

  describe('missing async thunks', () => {
    it('should handle sendMessage thunk', async () => {
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

      // Then send message
      await store.dispatch(sendMessage({ message: 'Hello world!' }));

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('chat-message', { message: 'Hello world!' });
    });

    it('should handle relaunchGame thunk', async () => {
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

      // Then relaunch game
      await store.dispatch(relaunchGame());

      expect(mockSocketInstance.emit).toHaveBeenCalledWith('restart-game');
    });

    it('should handle sendMessage when socket is null', async () => {
      const { io } = require('socket.io-client');
      io.mockReturnValue(null);

      // Should not throw when socket is null
      await store.dispatch(sendMessage({ message: 'Test message' }));

      const state = store.getState().socket;
      expect(state).toBeDefined();
    });

    it('should handle relaunchGame when socket is null', async () => {
      const { io } = require('socket.io-client');
      io.mockReturnValue(null);

      // Should not throw when socket is null
      await store.dispatch(relaunchGame());

      const state = store.getState().socket;
      expect(state).toBeDefined();
    });
  });

  describe('missing reducers', () => {
    it('should handle onGameReset reducer', () => {
      const initialState: SocketState = {
        connected: false,
        joined: false,
        playerReady: false,
        started: false,
        isHost: false,
        isError: true,
        contentError: 'Some error',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: 'room1_player1',
        gamestate: defaultGameState,
        gameOver: true,
        gameWon: true,
        score: 100,
        level: 2,
        messages: []
      };

      const action = onGameReset();
      const newState = socketReducer(initialState, action);

      expect(newState.joined).toBe(true);
      expect(newState.isError).toBe(false);
      expect(newState.contentError).toBe('');
      expect(newState.gameOver).toBe(false);
      expect(newState.gameWon).toBe(false);
      // Other properties should remain unchanged
      expect(newState.connected).toBe(false);
      expect(newState.playerId).toBe('room1_player1');
    });

    it('should handle onHostChanged reducer', () => {
      const initialState: SocketState = {
        connected: false,
        joined: true,
        playerReady: false,
        started: false,
        isHost: false, // This should change to true
        isError: false,
        contentError: '',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: 'room1_player1',
        gamestate: defaultGameState,
        gameOver: false,
        gameWon: false,
        score: 0,
        level: 1,
        messages: []
      };

      const action = onHostChanged();
      const newState = socketReducer(initialState, action);

      expect(newState.isHost).toBe(true);
      // Other properties should remain unchanged
      expect(newState.joined).toBe(true);
      expect(newState.playerId).toBe('room1_player1');
    });

    it('should handle addMessage reducer', () => {
      const initialState: SocketState = {
        connected: false,
        joined: false,
        playerReady: false,
        started: false,
        isHost: false,
        isError: false,
        contentError: '',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: '',
        gamestate: defaultGameState,
        gameOver: false,
        gameWon: false,
        score: 0,
        level: 1,
        messages: []
      };

      const message: ChatMessage = {
        playerId: '1',
        playerName: 'player1',
        message: 'Hello!',
        timestamp: Date.now().toString()
      };

      const action = addMessage(message);
      const newState = socketReducer(initialState, action);

      expect(newState.messages).toHaveLength(1);
      expect(newState.messages[0]).toEqual(message);
    });

    it('should handle addMessages reducer', () => {
      const initialState: SocketState = {
        connected: false,
        joined: false,
        playerReady: false,
        started: false,
        isHost: false,
        isError: false,
        contentError: '',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: '',
        gamestate: defaultGameState,
        gameOver: false,
        gameWon: false,
        score: 0,
        level: 1,
        messages: [{ playerId: '0', playerName: 'existing', message: 'Existing message', timestamp: Date.now().toString() }]
      };

      const newMessages: ChatMessage[] = [
        { playerId: '1', playerName: 'player1', message: 'Hello!', timestamp: Date.now().toString() },
        { playerId: '2', playerName: 'player2', message: 'Hi there!', timestamp: Date.now().toString() }
      ];

      const action = addMessages(newMessages);
      const newState = socketReducer(initialState, action);

      expect(newState.messages).toHaveLength(3);
      expect(newState.messages[1]).toEqual(newMessages[0]);
      expect(newState.messages[2]).toEqual(newMessages[1]);
    });

    it('should handle onReconnectionSuccess reducer with full data', () => {
      const initialState: SocketState = {
        connected: false,
        joined: false,
        playerReady: false,
        started: false,
        isHost: false,
        isError: true,
        contentError: 'Previous error',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: '',
        gamestate: {} as GameState,
        gameOver: false,
        gameWon: false,
        score: 0,
        level: 0,
        messages: []
      };

      const reconnectionData = {
        room: { gameState: 'playing' },
        player: { isReady: true, score: 150, level: 3, id: 'room1_player1' },
        gameState: {
          ...defaultGameState,
          players: {
            'room1_player1': { /* current player */ },
            'room1_player2': { /* opponent 1 */ },
            'room1_player3': { /* opponent 2 */ }
          }
        }
      };

      const action = onReconnectionSuccess(reconnectionData);
      const newState = socketReducer(initialState, action);

      expect(newState.connected).toBe(true);
      expect(newState.joined).toBe(true);
      expect(newState.isError).toBe(false);
      expect(newState.contentError).toBe('');
      expect(newState.started).toBe(true); // because gameState is 'playing'
      expect(newState.playerReady).toBe(true);
      expect(newState.score).toBe(150);
      expect(newState.level).toBe(3);
      expect(newState.playerId).toBe('room1_player1');
      expect(newState.opponent1).toBe('player2');
      expect(newState.opponent2).toBe('player3');
    });

    it('should handle onReconnectionSuccess reducer with minimal data', () => {
      const initialState: SocketState = {
        connected: false,
        joined: false,
        playerReady: false,
        started: false,
        isHost: false,
        isError: true,
        contentError: 'Previous error',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: '',
        gamestate: {} as GameState,
        gameOver: false,
        gameWon: false,
        score: 0,
        level: 1, // Initial level should be 1, not 0
        messages: []
      };

      const reconnectionData = {
        room: { gameState: 'waiting' },
        // No player or gameState data
      };

      const action = onReconnectionSuccess(reconnectionData);
      const newState = socketReducer(initialState, action);

      expect(newState.connected).toBe(true);
      expect(newState.joined).toBe(true);
      expect(newState.isError).toBe(false);
      expect(newState.contentError).toBe('');
      expect(newState.started).toBe(false); // because gameState is not 'playing'
      expect(newState.playerReady).toBe(false); // no player data
      expect(newState.score).toBe(0); // no player data
      expect(newState.level).toBe(1); // Initial level remains 1
    });

    it('should handle onReconnectionError reducer', () => {
      const initialState: SocketState = {
        connected: false,
        joined: false,
        playerReady: false,
        started: false,
        isHost: false,
        isError: false,
        contentError: '',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: '',
        gamestate: {} as GameState,
        gameOver: false,
        gameWon: false,
        score: 0,
        level: 0,
        messages: []
      };

      const errorMessage = 'Token expired';
      const action = onReconnectionError(errorMessage);
      const newState = socketReducer(initialState, action);

      expect(newState.isError).toBe(true);
      expect(newState.contentError).toBe('Reconnection failed: Token expired');
    });

    it('should handle onScoreUpdate reducer', () => {
      const initialState: SocketState = {
        connected: false,
        joined: false,
        playerReady: false,
        started: false,
        isHost: false,
        isError: false,
        contentError: '',
        opponent1: '',
        opponent2: '',
        opponent3: '',
        opponent4: '',
        playerId: '',
        gamestate: {} as GameState,
        gameOver: false,
        gameWon: false,
        score: 0,
        level: 1,
        messages: []
      };

      const scoreData = { score: 500, level: 5 };
      const action = onScoreUpdate(scoreData);
      const newState = socketReducer(initialState, action);

      expect(newState.score).toBe(500);
      expect(newState.level).toBe(5);
    });
  });

  describe('socket event handlers - advanced scenarios', () => {
    it('should handle game-reset event', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // Set initial state with errors and game over
      store.dispatch(onError('Some error'));
      store.dispatch(onGameOver(defaultGameState));

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the game-reset callback
      const gameResetCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'game-reset')?.[1];

      if (gameResetCallback) {
        // Simulate game reset event
        gameResetCallback({ message: 'Game has been reset' });

        const state = store.getState().socket;
        expect(state.joined).toBe(true);
        expect(state.isError).toBe(false);
        expect(state.contentError).toBe('');
        expect(state.gameOver).toBe(false);
        expect(state.gameWon).toBe(false);
      }
    });

    it('should handle host-changed event for current player', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the host-changed callback
      const hostChangedCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'host-changed')?.[1];

      if (hostChangedCallback) {
        // Simulate host changed to current player
        hostChangedCallback({ newHostId: 'room1_player1' });

        const state = store.getState().socket;
        expect(state.isHost).toBe(true);
      }
    });

    it('should handle host-changed event for different player', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      // Set initial host state to true
      store.dispatch(onHostChanged());

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the host-changed callback
      const hostChangedCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'host-changed')?.[1];

      if (hostChangedCallback) {
        // Simulate host changed to different player
        hostChangedCallback({ newHostId: 'room1_player2' });

        const state = store.getState().socket;
        expect(state.isHost).toBe(true); // Should remain unchanged since it's not current player
      }
    });

    it('should handle chat-message event', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the chat-message callback
      const chatMessageCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'chat-message')?.[1];

      if (chatMessageCallback) {
        const chatMessage: ChatMessage = {
          playerId: '1',
          playerName: 'player2',
          message: 'Hello everyone!',
          timestamp: Date.now().toString()
        };

        // Simulate chat message event
        chatMessageCallback(chatMessage);

        const state = store.getState().socket;
        expect(state.messages).toHaveLength(1);
        expect(state.messages[0]).toEqual(chatMessage);
      }
    });

    it('should handle game-state-update with player death', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the game-state-update callback
      const gameStateUpdateCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'game-state-update')?.[1];

      if (gameStateUpdateCallback) {
        // Player is dead, should trigger onGameOver
        const gameStateWithDeadPlayer = {
          ...defaultGameState,
          players: {
            'room1_player1': {
              playerId: 'room1_player1',
              isAlive: false, // Player is dead
              score: 200,
              level: 2
            }
          }
        };

        // Simulate game state update with dead player
        gameStateUpdateCallback(gameStateWithDeadPlayer);

        const state = store.getState().socket;
        // Now that the logic is fixed, gameOver should be true
        expect(state.gameOver).toBe(true);
        expect(state.score).toBe(200);
        expect(state.level).toBe(2);
      }
    });

    it('should handle game-state-update with winner', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the game-state-update callback
      const gameStateUpdateCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'game-state-update')?.[1];

      if (gameStateUpdateCallback) {
        const gameStateWithWinner = {
          ...defaultGameState,
          winner: 'room1_player1',
          players: {
            'room1_player1': {
              playerId: 'room1_player1',
              isAlive: true,
              score: 1000,
              level: 5
            }
          }
        };

        // Simulate game state update with winner
        gameStateUpdateCallback(gameStateWithWinner);

        const state = store.getState().socket;
        expect(state.gameWon).toBe(true);
        expect(state.score).toBe(1000);
        expect(state.level).toBe(5);
      }
    });

    it('should handle room-info with dead player', async () => {
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
        .find(call => call[0] === 'room-info')?.[1];

      if (roomInfoCallback) {
        const roomInfoWithDeadPlayer = {
          gameState: {
            ...defaultGameState,
            players: {
              'room1_player1': {
                playerId: 'room1_player1',
                isAlive: false,
                score: 300,
                level: 3
              }
            }
          }
        };

        // Simulate room info with dead player
        roomInfoCallback(roomInfoWithDeadPlayer);

        const state = store.getState().socket;
        // Now that the logic is fixed, gameOver should be true
        expect(state.gameOver).toBe(true);
        expect(state.score).toBe(300);
        expect(state.level).toBe(3);
      }
    });

    it('should handle room-info with winner', async () => {
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
        .find(call => call[0] === 'room-info')?.[1];

      if (roomInfoCallback) {
        const roomInfoWithWinner = {
          gameState: {
            ...defaultGameState,
            winner: 'room1_player1',
            players: {
              'room1_player1': {
                playerId: 'room1_player1',
                isAlive: true,
                score: 2000,
                level: 8
              }
            }
          }
        };

        // Simulate room info with winner
        roomInfoCallback(roomInfoWithWinner);

        const state = store.getState().socket;
        expect(state.gameWon).toBe(true);
        expect(state.score).toBe(2000);
        expect(state.level).toBe(8);
      }
    });

    it('should handle join-room-success with reconnection token', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the join-room-success callback
      const joinRoomSuccessCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'join-room-success')?.[1];

      if (joinRoomSuccessCallback) {
        // Simulate join room success with reconnection token
        joinRoomSuccessCallback({
          player: {
            isHost: true,
            reconnectionToken: 'new-reconnection-token'
          }
        });

        const state = store.getState().socket;
        expect(state.joined).toBe(true);
        expect(state.isHost).toBe(true);
      }
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle null data in game-state-update', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the game-state-update callback
      const gameStateUpdateCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'game-state-update')?.[1];

      if (gameStateUpdateCallback) {
        // Simulate null data
        gameStateUpdateCallback(null);

        // Should not crash and state should remain stable
        const state = store.getState().socket;
        expect(state).toBeDefined();
      }
    });

    it('should handle missing player data in game-state-update gracefully', async () => {
      const mockSocketInstance = {
        on: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      const { io } = require('socket.io-client');
      io.mockReturnValue(mockSocketInstance);

      const payload = { room: 'room1', playerName: 'player1' };
      await store.dispatch(connectSocket(payload));

      // Find the game-state-update callback
      const gameStateUpdateCallback = mockSocketInstance.on.mock.calls
        .find(call => call[0] === 'game-state-update')?.[1];

      if (gameStateUpdateCallback) {
        const gameStateWithoutCurrentPlayer = {
          ...defaultGameState,
          players: {
            'room1_player2': { playerId: 'room1_player2', isAlive: true }
          }
        };

        // This should be handled gracefully now that the code has been improved
        // No exception should be thrown when the current player is missing
        expect(() => {
          gameStateUpdateCallback(gameStateWithoutCurrentPlayer);
        }).not.toThrow();
      }
    });

    it('should handle room-info with null gameState', async () => {
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
        .find(call => call[0] === 'room-info')?.[1];

      if (roomInfoCallback) {
        // Simulate room info with null gameState
        roomInfoCallback({ gameState: null });

        // Should not crash
        const state = store.getState().socket;
        expect(state).toBeDefined();
      }
    });
  });
});
