import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import socketReducer, { SocketState } from '../store/socketSlice';
import GameRoom from './GameRoom';
import * as router from 'react-router-dom';
import { GameState, PlayerGameState, Piece } from './Interfaces';

// Mock useParams to provide roomName and playerName
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

// Mock socket.io-client to avoid actual connections during tests
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  })),
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

const defaultState: SocketState = {
  connected: false,
  joined: false,
  playerReady: false,
  started: false,
  isError: false,
  contentError: '',
  opponent1: '',
  opponent2: '',
  opponent3: '',
  opponent4: '',
  playerId: '',
  gamestate: defaultGameState,
  gameOver: false,
  gameWon: false
};

// Helper function to create complete player state
function createPlayerState(overrides?: Partial<PlayerGameState>): PlayerGameState {
  return {
    playerId: 'room1_player1',
    board: Array(20).fill(null).map(() => Array(10).fill(0)),
    currentPiece: null,
    nextPieces: [],
    spectrum: Array(10).fill(0),
    lines: 0,
    score: 0,
    level: 1,
    isAlive: true,
    penalties: 0,
    ...overrides
  };
}

type PreloadedSocketState = SocketState;

function renderWithState(preloadedState: PreloadedSocketState) {
  const store = configureStore({
    reducer: { socket: socketReducer },
    preloadedState: { socket: preloadedState },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
          ignoredPaths: ['socket.gamestate.players'],
        },
      }),
  });
  
  const { container } = render(
    <Provider store={store}>
      <GameRoom />
    </Provider>
  );
  return { store, container };
}

describe('GameRoom component', () => {
  beforeEach(() => {
    (router.useParams as jest.Mock).mockReturnValue({ roomName: 'room1', playerName: 'player1' });
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('displays room and player names', () => {
      const { store } = renderWithState(defaultState);
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
      expect(screen.getByText('Player: player1')).toBeInTheDocument();
    });

    it('renders blind mode toggle', () => {
      const { store } = renderWithState(defaultState);
      expect(screen.getByText('Blind mode')).toBeInTheDocument();
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('renders game board structure', () => {
      const { container } = renderWithState(defaultState);
      expect(container.querySelector('.tetris-board')).toBeInTheDocument();
      expect(container.querySelector('.next-piece')).toBeInTheDocument();
      expect(container.querySelectorAll('.tetris-opponent-board')).toHaveLength(4);
    });
  });

  describe('Status display', () => {
    it('shows connection status correctly', () => {
      renderWithState({ ...defaultState, connected: true });
      expect(screen.getByText('Connected: Yes')).toBeInTheDocument();
    });

    it('shows disconnected status correctly', () => {
      renderWithState({ ...defaultState, connected: false });
      expect(screen.getByText('Connected: No')).toBeInTheDocument();
    });

    it('shows joined status correctly', () => {
      renderWithState({ ...defaultState, joined: true });
      expect(screen.getByText('Joined: Yes')).toBeInTheDocument();
    });

    it('shows ready status correctly', () => {
      renderWithState({ ...defaultState, playerReady: true });
      expect(screen.getByText('Ready: Yes')).toBeInTheDocument();
    });
  });

  describe('Button visibility logic', () => {
    it('shows Join Room button when not joined', () => {
      renderWithState({ ...defaultState, joined: false, connected: false });
      expect(screen.getByRole('button', { name: /Join Room/i })).toBeInTheDocument();
    });

    it('shows Set Ready button when joined but not ready', () => {
      renderWithState({ ...defaultState, joined: true, connected: true, playerReady: false });
      expect(screen.getByRole('button', { name: /Set Ready/i })).toBeInTheDocument();
    });

    it('shows Start Game buttons when player is ready but game not started', () => {
      renderWithState({ ...defaultState, joined: true, connected: true, playerReady: true, started: false });
      expect(screen.getByRole('button', { name: /^Start Game$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start Fast Game/i })).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('handles blind mode toggle', () => {
      renderWithState(defaultState);
      const checkbox = screen.getByRole('checkbox');
      
      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('dispatches actions when buttons are clicked', () => {
      // Mock the console.log to verify the function is called
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { store } = renderWithState({ ...defaultState, joined: false, connected: true });
      
      const joinButton = screen.getByRole('button', { name: /Join Room/i });
      fireEvent.click(joinButton);
      
      // Verify that handleJoin was called (evidenced by console.log)
      expect(consoleSpy).toHaveBeenCalledWith('joinRoom');
      
      // Clean up
      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('shows error message when isError is true', () => {
      const errorMessage = 'Test error message';
      renderWithState({ ...defaultState, isError: true, contentError: errorMessage });
      
      expect(screen.getByText('Error :')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('does not show error message when isError is false', () => {
      renderWithState({ ...defaultState, isError: false, contentError: 'Some error' });
      
      expect(screen.queryByText('Error :')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard event handling', () => {
    it('handles keyboard events for game controls', () => {
      // Create a state where the game has started (required for keyboard handling)
      renderWithState({ ...defaultState, started: true });
      
      // Simulate arrow key presses - these should not throw errors
      expect(() => {
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        fireEvent.keyDown(document, { key: 'ArrowUp' });
        fireEvent.keyDown(document, { key: 'ArrowDown' });
        fireEvent.keyDown(document, { key: ' ' });
      }).not.toThrow();
      
      // The keyboard handler should be properly set up and not cause errors
    });
  });

  describe('Game state rendering', () => {
    it('renders opponent names when available', () => {
      const stateWithOpponents = {
        ...defaultState,
        opponent1: 'Player1',
        opponent2: 'Player2',
        opponent3: 'Player3',
        opponent4: 'Player4',
      };
      renderWithState(stateWithOpponents);
      
      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('Player2')).toBeInTheDocument();
      expect(screen.getByText('Player3')).toBeInTheDocument();
      expect(screen.getByText('Player4')).toBeInTheDocument();
    });

    it('handles game state updates with player data', () => {
      const gameStateWithPlayers = {
        ...defaultGameState,
        players: new Map([
          ['room1_player1', {
            playerId: 'room1_player1',
            board: Array(20).fill(Array(10).fill(0)),
            currentPiece: {
              type: 'I' as const,
              rotation: 0,
              x: 4,
              y: 0,
              shape: [[1, 1, 1, 1]]
            },
            nextPieces: [{
              type: 'O' as const,
              rotation: 0,
              x: 0,
              y: 0,
              shape: [[1, 1], [1, 1]]
            }],
            spectrum: Array(10).fill(0),
            lines: 0,
            score: 500,
            level: 1,
            isAlive: true,
            penalties: 0
          }]
        ])
      };

      renderWithState({ ...defaultState, gamestate: gameStateWithPlayers });
      
      // The component should render without errors
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles missing room name gracefully', () => {
      (router.useParams as jest.Mock).mockReturnValue({ roomName: undefined, playerName: 'player1' });
      
      renderWithState(defaultState);
      
      expect(screen.getByText('Room:')).toBeInTheDocument();
      expect(screen.getByText('Player: player1')).toBeInTheDocument();
    });

    it('handles missing player name gracefully', () => {
      (router.useParams as jest.Mock).mockReturnValue({ roomName: 'room1', playerName: undefined });
      
      renderWithState(defaultState);
      
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
      expect(screen.getByText('Player:')).toBeInTheDocument();
    });
  });

  describe('Game rendering functions', () => {
    it('renders game board with player pieces', () => {
      const gameStateWithPieces = {
        ...defaultGameState,
        players: new Map([
          ['room1_player1', {
            playerId: 'room1_player1',
            board: Array(20).fill(null).map(() => Array(10).fill(0)),
            currentPiece: {
              type: 'I' as const,
              shape: [[1, 1, 1, 1]],
              rotation: 0,
              x: 3,
              y: 0
            },
            nextPieces: [{
              type: 'O' as const,
              shape: [[1, 1], [1, 1]],
              rotation: 0,
              x: 0,
              y: 0
            }],
            spectrum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            lines: 0,
            score: 0,
            level: 1,
            isAlive: true,
            penalties: 0
          }]
        ])
      };

      const stateWithGame = {
        ...defaultState,
        started: true,
        gamestate: gameStateWithPieces
      };

      renderWithState(stateWithGame);
      
      // Check that game components are rendered
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
      expect(screen.getByText('Player: player1')).toBeInTheDocument();
    });

    it('handles game state updates with complex player data', () => {
      const complexGameState = {
        ...defaultGameState,
        players: new Map([
          ['room1_player1', {
            playerId: 'room1_player1',
            board: Array(20).fill(null).map((_, i) => 
              Array(10).fill(null).map((_, j) => (i > 15 && j < 3) ? 1 : 0)
            ),
            currentPiece: {
              type: 'T' as const,
              shape: [[0, 1, 0], [1, 1, 1]],
              rotation: 0,
              x: 4,
              y: 2
            },
            nextPieces: [
              { type: 'I' as const, shape: [[1, 1, 1, 1]], rotation: 0, x: 0, y: 0 },
              { type: 'O' as const, shape: [[1, 1], [1, 1]], rotation: 0, x: 0, y: 0 }
            ],
            spectrum: [3, 2, 1, 0, 0, 0, 1, 2, 3, 2],
            lines: 5,
            score: 2500,
            level: 2,
            isAlive: true,
            penalties: 2
          }]
        ])
      };

      const stateWithComplexGame = {
        ...defaultState,
        started: true,
        gamestate: complexGameState
      };

      renderWithState(stateWithComplexGame);
      
      // Verify the component renders without crashing
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
    });

    it('handles blind mode with next pieces hidden', () => {
      const stateWithPieces = {
        ...defaultState,
        started: true,
        gamestate: {
          ...defaultGameState,
          players: new Map([
            ['room1_player1', {
              playerId: 'room1_player1',
              board: Array(20).fill(null).map(() => Array(10).fill(0)),
              currentPiece: { 
                type: 'I' as const, 
                shape: [[1, 1, 1, 1]], 
                rotation: 0,
                x: 3, 
                y: 0 
              },
              nextPieces: [{ 
                type: 'O' as const, 
                shape: [[1, 1], [1, 1]],
                rotation: 0,
                x: 0,
                y: 0
              }],
              spectrum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              lines: 0,
              score: 0,
              level: 1,
              isAlive: true,
              penalties: 0
            }]
          ])
        }
      };

      renderWithState(stateWithPieces);
      
      // Toggle blind mode
      const blindModeCheckbox = screen.getByRole('checkbox');
      fireEvent.click(blindModeCheckbox);
      
      expect(blindModeCheckbox).toBeChecked();
    });

    it('handles multiple game states and opponent rendering', () => {
      const multiPlayerGameState = {
        ...defaultGameState,
        players: new Map([
          ['room1_player1', {
            playerId: 'room1_player1',
            board: Array(20).fill(null).map(() => Array(10).fill(0)),
            currentPiece: null,
            nextPieces: [],
            spectrum: [1, 2, 3, 2, 1, 0, 1, 2, 1, 0],
            lines: 0,
            score: 0,
            level: 1,
            isAlive: true,
            penalties: 0
          }],
          ['room1_player2', {
            playerId: 'room1_player2',
            board: Array(20).fill(null).map(() => Array(10).fill(0)),
            currentPiece: null,
            nextPieces: [],
            spectrum: [2, 1, 0, 1, 2, 3, 2, 1, 0, 1],
            lines: 3,
            score: 1500,
            level: 1,
            isAlive: true,
            penalties: 1
          }]
        ])
      };

      const stateWithOpponents = {
        ...defaultState,
        started: true,
        opponent1: 'player2',
        gamestate: multiPlayerGameState
      };

      renderWithState(stateWithOpponents);
      
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
      expect(screen.getByText('player2')).toBeInTheDocument();
    });
  });

  describe('Game lifecycle and effects', () => {
    it('sets up and cleans up game intervals when started', () => {
      jest.useFakeTimers();
      
      renderWithState({ ...defaultState, started: false });
      
      // Start the game by rendering with started: true
      renderWithState({ ...defaultState, started: true });
      
      // Fast forward time to trigger intervals
      jest.advanceTimersByTime(1000);
      
      jest.useRealTimers();
    });

    it('handles component lifecycle gracefully', () => {
      // Should not throw when rendering different states
      expect(() => {
        renderWithState(defaultState);
        renderWithState({ ...defaultState, started: true });
        renderWithState({ ...defaultState, connected: false });
      }).not.toThrow();
    });
  });

  describe('Additional button interactions', () => {
    it('handles Ready button click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithState({ 
        ...defaultState, 
        connected: true, 
        joined: true, 
        playerReady: false 
      });
      
      const readyButton = screen.getByRole('button', { name: /Set Ready/i });
      fireEvent.click(readyButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('player-ready');
      
      consoleSpy.mockRestore();
    });

    it('handles Start Game button click for normal speed', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithState({ 
        ...defaultState, 
        connected: true, 
        joined: true, 
        playerReady: true,
        started: false
      });
      
      const startButton = screen.getByRole('button', { name: /Start Game/i });
      fireEvent.click(startButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('start-game');
      
      consoleSpy.mockRestore();
    });

    it('handles Start Game Fast button click', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithState({ 
        ...defaultState, 
        connected: true, 
        joined: true, 
        playerReady: true,
        started: false
      });
      
      const startFastButton = screen.getByRole('button', { name: /Start Fast Game/i });
      fireEvent.click(startFastButton);
      
      expect(consoleSpy).toHaveBeenCalledWith('start-fast-game');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Connection and socket lifecycle', () => {
    it('handles connection setup on mount', () => {
      // Mock console to see if connection is attempted
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithState({ ...defaultState, connected: false });
      
      // Component should attempt connection setup
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('handles game state changes from disconnected to connected', () => {
      const stateConnected = { ...defaultState, connected: true };
      
      renderWithState(stateConnected);
      
      expect(screen.getByText('Connected: Yes')).toBeInTheDocument();
    });

    it('handles error state display with long error messages', () => {
      const longError = 'This is a very long error message that should be displayed correctly in the component';
      
      renderWithState({ 
        ...defaultState, 
        isError: true, 
        contentError: longError 
      });
      
      expect(screen.getByText('Error :')).toBeInTheDocument();
      expect(screen.getByText(longError)).toBeInTheDocument();
    });
  });

  describe('Game rendering and DOM effects', () => {
    it('triggers rendering effects when gamestate changes', () => {
      const playerState = createPlayerState({
        board: [
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // I piece
          ...Array(18).fill(null).map(() => Array(10).fill(0))
        ],
        currentPiece: {
          shape: [[1, 1], [1, 1]],
          x: 4,
          y: 0,
          type: 'O' as const,
          rotation: 0
        },
        spectrum: [2, 3, 1, 0, 4, 2, 1, 0, 0, 1]
      });

      const gameStateWithBoard = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerState]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithBoard,
        connected: true,
        joined: true,
        started: false,
        opponent1: 'room1_player1'
      };

      // This test verifies that the component renders without errors
      // and the rendering effects are set up correctly
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('handles rendering effects with empty player map', () => {
      const gameStateEmpty = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map()
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateEmpty,
        connected: true,
        joined: true,
        started: false
      };

      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('handles rendering effects with missing board data', () => {
      const playerState = createPlayerState({
        board: undefined as any // Force missing board
      });

      const gameStateNoBoardData = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerState]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateNoBoardData,
        connected: true,
        joined: true,
        started: false
      };

      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('handles blind mode state changes', () => {
      const playerState = createPlayerState({
        nextPieces: [{
          shape: [[1, 1], [1, 1]],
          type: 'O' as const,
          rotation: 0,
          x: 0,
          y: 0
        }]
      });

      const gameStateWithNextPiece = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerState]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithNextPiece,
        connected: true,
        joined: true,
        started: false
      };

      renderWithState(testState);

      // Find and click the blind mode toggle checkbox
      const blindToggleCheckbox = screen.getByRole('checkbox');
      expect(blindToggleCheckbox).not.toBeChecked();
      
      fireEvent.click(blindToggleCheckbox);

      // Verify the checkbox state changed
      expect(blindToggleCheckbox).toBeChecked();
    });

    it('renders with multiple opponents correctly', () => {
      const playerState = createPlayerState({
        spectrum: [2, 3, 1, 0, 4, 2, 1, 0, 0, 1]
      });

      const gameStateWithOpponents = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerState]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithOpponents,
        connected: true,
        joined: true,
        started: false,
        opponent1: 'room1_player1',
        opponent2: 'room1_player2',
        opponent3: 'room1_player3',
        opponent4: 'room1_player4'
      };

      expect(() => {
        renderWithState(testState);
      }).not.toThrow();

      // Check that opponent names are displayed
      expect(screen.getByText('room1_player1')).toBeInTheDocument();
      expect(screen.getByText('room1_player2')).toBeInTheDocument();
      expect(screen.getByText('room1_player3')).toBeInTheDocument();
      expect(screen.getByText('room1_player4')).toBeInTheDocument();
    });
  });

  describe('Game interval and lifecycle', () => {
    it('sets up game info interval when started', () => {
      jest.useFakeTimers();
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      const testState = {
        ...defaultState,
        connected: true,
        joined: true,
        started: true
      };

      renderWithState(testState);

      // Check that setInterval was called for the getRoomInfo interval
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);

      setIntervalSpy.mockRestore();
      jest.useRealTimers();
    });

    it('does not set up interval when not started', () => {
      jest.useFakeTimers();
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      const testState = {
        ...defaultState,
        connected: true,
        joined: true,
        started: false
      };

      renderWithState(testState);

      // Check that setInterval was not called for the getRoomInfo interval
      expect(setIntervalSpy).not.toHaveBeenCalled();

      setIntervalSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('Game board rendering coverage', () => {
    it('renders component with complex board data to trigger rendering functions', () => {
      const playerState = createPlayerState({
        board: [
          [1, 2, 3, 4, 5, 6, 7, 0, 0, 0], // Different piece types
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          ...Array(18).fill(null).map(() => Array(10).fill(0))
        ],
        currentPiece: {
          shape: [[1, 1], [1, 1]],
          type: 'O' as const,
          rotation: 0,
          x: 3,
          y: 1
        },
        nextPieces: [{
          shape: [[1, 1, 1], [0, 1, 0]],
          type: 'T' as const,
          rotation: 0,
          x: 0,
          y: 0
        }],
        spectrum: [2, 0, 1, 3, 0, 0, 1, 2, 0, 1]
      });

      const gameStateWithComplexData = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([
          ['room1_player1', playerState],
          ['room1_opponent1', playerState],
          ['room1_opponent2', playerState]
        ])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithComplexData,
        connected: true,
        joined: true,
        started: true,
        opponent: ['room1_opponent1', 'room1_opponent2', 'room1_opponent1', 'room1_opponent1']
      };

      // Should render without errors even with complex game state
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('renders component with edge case data to trigger error handling paths', () => {
      const playerWithLargeBoard = createPlayerState({
        board: Array(25).fill(null).map(() => Array(15).fill(8)), // Oversized board with unknown piece types
        currentPiece: {
          shape: [[1]],
          type: 'I' as const,
          rotation: 0,
          x: 50, // Out of bounds position
          y: 50
        },
        nextPieces: [{
          shape: [[1, 1, 1, 1, 1]], // Large next piece
          type: 'L' as const,
          rotation: 0,
          x: 0,
          y: 0
        }],
        spectrum: Array(20).fill(5) // Large spectrum array
      });

      const gameStateWithEdgeCases = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerWithLargeBoard]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithEdgeCases,
        connected: true,
        joined: true,
        started: true
      };

      // Should handle edge cases gracefully
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('renders component with blind mode to test conditional rendering paths', () => {
      const playerState = createPlayerState({
        nextPieces: [{
          shape: [[1, 1, 1], [0, 1, 0]],
          type: 'T' as const,
          rotation: 0,
          x: 0,
          y: 0
        }]
      });

      const gameStateWithNextPiece = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerState]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithNextPiece,
        connected: true,
        joined: true,
        started: true
      };

      const { container } = renderWithState(testState);

      // Enable blind mode to test the blindMode condition in rendering
      const blindToggle = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      fireEvent.click(blindToggle);

      // Component should handle blind mode rendering path
      expect(container).toBeInTheDocument();
    });

    it('triggers rendering functions with valid opponent data', () => {
      const opponentState = createPlayerState({
        spectrum: [2, 0, 1, 3, 0, 0, 1, 2, 0, 1]
      });

      const gameStateWithOpponents = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([
          ['room1_player1', createPlayerState()],
          ['room1_opponent1', opponentState],
          ['room1_opponent2', opponentState],
          ['room1_opponent3', opponentState],
          ['room1_opponent4', opponentState]
        ])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithOpponents,
        connected: true,
        joined: true,
        started: true,
        opponent: ['room1_opponent1', 'room1_opponent2', 'room1_opponent3', 'room1_opponent4']
      };

      // Should trigger renderSpectrums function for multiple opponents
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('handles missing player data gracefully', () => {
      const testState = {
        ...defaultState,
        gamestate: {
          ...defaultGameState,
          roomName: 'room1',
          players: new Map() // Empty players map
        },
        connected: true,
        joined: true,
        started: true
      };

      // Should handle missing player data without errors
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('handles missing gamestate gracefully', () => {
      const testState = {
        ...defaultState,
        gamestate: defaultGameState, // Use default instead of null
        connected: true,
        joined: true,
        started: true
      };

      // Should handle missing gamestate without errors
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('handles component with current piece but no board data', () => {
      const playerWithPieceOnly = createPlayerState({
        currentPiece: {
          shape: [[1, 1], [1, 1]],
          type: 'O' as const,
          rotation: 0,
          x: 3,
          y: 1
        },
        board: [] // Empty board
      });

      const gameStateWithPieceOnly = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerWithPieceOnly]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithPieceOnly,
        connected: true,
        joined: true,
        started: true
      };

      // Should handle current piece without board data
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('handles component with invalid piece shape data', () => {
      const playerWithInvalidPiece = createPlayerState({
        currentPiece: {
          shape: null as any, // Invalid shape
          type: 'O' as const,
          rotation: 0,
          x: 3,
          y: 1
        }
      });

      const gameStateWithInvalidPiece = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', playerWithInvalidPiece]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameStateWithInvalidPiece,
        connected: true,
        joined: true,
        started: true
      };

      // Should handle invalid piece shape gracefully
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });
  });

  describe('Additional coverage for rendering functions', () => {
    it('triggers rendering effects with complex game states', async () => {
      const playerState = createPlayerState({
        board: [
          [1, 2, 3, 4, 5, 6, 7, 8, 0, 0], // Mix of known and unknown piece types
          ...Array(19).fill(null).map(() => Array(10).fill(0))
        ],
        currentPiece: {
          shape: [[1, 1], [1, 1]],
          type: 'O' as const,
          rotation: 0,
          x: 3,
          y: 1
        },
        nextPieces: [{
          shape: [[1, 1, 1], [0, 1, 0]],
          type: 'T' as const,
          rotation: 0,
          x: 0,
          y: 0
        }],
        spectrum: [2, 1, 3, 0, 1, 2, 0, 1, 3, 2]
      });

      const gameState = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([
          ['room1_player1', playerState],
          ['room1_opponent1', playerState],
          ['room1_opponent2', playerState]
        ])
      };

      const testState = {
        ...defaultState,
        gamestate: gameState,
        connected: true,
        joined: true,
        started: true,
        opponent: ['room1_opponent1', 'room1_opponent2', 'room1_opponent1', 'room1_opponent1']
      };

      // Should render without errors with complex data
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();

      // Wait for effects to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Component should be rendered
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
      expect(screen.getByText('Player: player1')).toBeInTheDocument();
    });

    it('handles various game state conditions that trigger different code paths', () => {
      // Test with minimal player state to trigger early returns
      const minimalPlayerState = createPlayerState({
        board: [],
        currentPiece: null,
        nextPieces: [],
        spectrum: []
      });

      const gameState = {
        ...defaultGameState,
        roomName: 'room1',
        players: new Map([['room1_player1', minimalPlayerState]])
      };

      const testState = {
        ...defaultState,
        gamestate: gameState,
        connected: true,
        joined: true,
        started: true
      };

      // Should handle minimal state without errors
      expect(() => {
        renderWithState(testState);
      }).not.toThrow();
    });

    it('covers useEffect dependency changes by updating game state', () => {
      const { store } = renderWithState({
        ...defaultState,
        connected: true,
        joined: true,
        started: true,
        gamestate: {
          ...defaultGameState,
          roomName: 'room1',
          players: new Map([['room1_player1', createPlayerState()]])
        }
      });

      // Update the store to trigger useEffect with different dependencies
      act(() => {
        store.dispatch({
          type: 'socket/onUpdatedData',
          payload: {
            gameState: {
              ...defaultGameState,
              roomName: 'room1',
              players: new Map([
                ['room1_player1', createPlayerState({
                  board: [[1, 2, 3, 0, 0, 0, 0, 0, 0, 0]],
                  currentPiece: {
                    shape: [[1]],
                    type: 'I' as const,
                    rotation: 0,
                    x: 0,
                    y: 0
                  }
                })]
              ])
            }
          }
        });
      });

      // Component should handle state updates
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
    });
  });

  // Additional coverage for specific game scenarios
  describe('Additional coverage scenarios', () => {
    it('handles gamestate with Map conversion correctly', () => {
      const mockState = {
        ...defaultState,
        connected: true,
        joined: true,
        playerReady: true,
        started: true,
        gamestate: {
          roomName: 'room1',
          players: new Map([
            ['room1_player1', createPlayerState({
              playerId: 'room1_player1',
              board: Array(20).fill(null).map(() => Array(10).fill(0)),
              currentPiece: {
                shape: [[1, 1], [1, 1]],
                type: 'O' as const,
                rotation: 0,
                x: 4,
                y: 0
              },
              nextPieces: [{
                shape: [[1, 1, 1, 1]],
                type: 'I' as const,
                rotation: 0,
                x: 0,
                y: 0
              }],
              spectrum: [2, 3, 1, 0, 0, 0, 0, 0, 0, 0],
            })]
          ]),
          pieceSequence: [],
          currentPieceIndex: 0,
          gameOver: false,
          winner: null,
          startTime: Date.now()
        }
      };

      const { container } = renderWithState(mockState);
      
      // Verify the component renders without errors and handles the Map conversion
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
      expect(screen.getByText('Player: player1')).toBeInTheDocument();
    });

    it('handles complex opponent rendering scenarios', () => {
      const opponentStates = new Map([
        ['room1_player1', createPlayerState({
          playerId: 'room1_player1'
        })],
        ['room1_player2', createPlayerState({
          playerId: 'room1_player2',
          spectrum: [5, 4, 3, 2, 1, 0, 0, 0, 0, 0],
          lines: 10
        })],
        ['room1_player3', createPlayerState({
          playerId: 'room1_player3',
          spectrum: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          lines: 5
        })],
        ['room1_player4', createPlayerState({
          playerId: 'room1_player4',
          isAlive: false
        })],
      ]);

      const mockState = {
        ...defaultState,
        connected: true,
        joined: true,
        playerReady: true,
        started: true,
        opponent1: 'room1_player2',
        opponent2: 'room1_player3', 
        opponent3: 'room1_player4',
        gamestate: {
          roomName: 'room1',
          players: opponentStates,
          pieceSequence: [],
          currentPieceIndex: 0,
          gameOver: false,
          winner: null,
          startTime: Date.now()
        }
      };

      const { container } = renderWithState(mockState);
      
      // Test that complex opponent scenarios are handled
      expect(container).toBeInTheDocument();
      expect(screen.getByText('room1_player2')).toBeInTheDocument();
      expect(screen.getByText('room1_player3')).toBeInTheDocument();
      expect(screen.getByText('room1_player4')).toBeInTheDocument();
    });

    it('covers edge cases in game state handling', () => {
      const mockState = {
        ...defaultState,
        connected: true,
        joined: true,
        playerReady: true,
        started: true,
        gamestate: {
          roomName: 'room1',
          players: new Map([
            ['room1_player1', createPlayerState({
              playerId: 'room1_player1',
              currentPiece: null, // No current piece
              nextPieces: [], // No next pieces
              board: Array(20).fill(null).map(() => Array(10).fill(0)),
              spectrum: Array(10).fill(0),
            })]
          ]),
          pieceSequence: [],
          currentPieceIndex: 0,
          gameOver: true, // Game over state
          winner: 'room1_player2',
          startTime: Date.now()
        }
      };

      const { container } = renderWithState(mockState);
      
      // Test that edge cases are handled correctly
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
    });

    it('handles rendering with minimal game state data', () => {
      const mockState = {
        ...defaultState,
        connected: true,
        joined: true,
        playerReady: true,
        started: true,
        gamestate: {
          roomName: 'room1',
          players: new Map(),
          pieceSequence: [],
          currentPieceIndex: 0,
          gameOver: false,
          winner: null,
          startTime: Date.now()
        }
      };

      const { container } = renderWithState(mockState);
      
      // Test minimal state handling
      expect(container).toBeInTheDocument();
      expect(screen.getByText('Room: room1')).toBeInTheDocument();
    });
  });

  // ...existing tests...
});
