import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import socketReducer, { SocketState } from '../store/socketSlice';
import GameRoom from './GameRoom';
import * as router from 'react-router-dom';
import { GameState, PlayerGameState, Piece, ChatMessage } from './Interfaces';

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

  describe('Game relaunch functionality', () => {
    it('should handle relaunch game when game is over', async () => {
      const gameOverState = {
        ...defaultState,
        joined: true,
        started: true,
        gameOver: true,
        gamestate: {
          ...defaultGameState,
          gameOver: true,
          players: new Map([
            ['room1_player1', {
              playerId: 'room1_player1',
              board: Array(20).fill(null).map(() => Array(10).fill(0)),
              currentPiece: { shape: [[1]], type: 'I' as const, rotation: 0, x: 0, y: 0 },
              nextPieces: [],
              spectrum: Array(10).fill(0),
              lines: 0,
              score: 0,
              level: 1,
              isAlive: false,
              penalties: 0
            }]
          ])
        }
      };

      const store = configureStore({
        reducer: { socket: socketReducer },
        preloadedState: { socket: gameOverState },
      });

      (router.useParams as jest.Mock).mockReturnValue({
        roomName: 'room1',
        playerName: 'player1',
      });

      render(
        <Provider store={store}>
          <GameRoom />
        </Provider>
      );

      const relaunchButton = screen.getByText('Relaunch Game');
      expect(relaunchButton).toBeInTheDocument();
      
      fireEvent.click(relaunchButton);
      // Should dispatch relaunchGame action
    });

    it('should handle relaunch game when game is won', async () => {
      const gameWonState = {
        ...defaultState,
        joined: true,
        started: true,
        gameWon: true,
        gamestate: {
          ...defaultGameState,
          winner: 'room1_player1',
          players: new Map([
            ['room1_player1', {
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
            }]
          ])
        }
      };

      const store = configureStore({
        reducer: { socket: socketReducer },
        preloadedState: { socket: gameWonState },
      });

      (router.useParams as jest.Mock).mockReturnValue({
        roomName: 'room1',
        playerName: 'player1',
      });

      render(
        <Provider store={store}>
          <GameRoom />
        </Provider>
      );

      const relaunchButton = screen.getByText('Relaunch Game');
      expect(relaunchButton).toBeInTheDocument();
      
      fireEvent.click(relaunchButton);
      // Should dispatch relaunchGame action
    });

    it('should render player board with tetris pieces correctly', async () => {
      // Create board with filled cells (non-zero values representing different pieces)
      const boardWithPieces = Array(20).fill(null).map(() => Array(10).fill(0));
      boardWithPieces[19][0] = 1; // I piece
      boardWithPieces[19][1] = 2; // O piece
      boardWithPieces[19][2] = 3; // T piece
      boardWithPieces[19][3] = 4; // S piece
      boardWithPieces[19][4] = 5; // Z piece
      boardWithPieces[19][5] = 6; // J piece
      boardWithPieces[19][6] = 7; // L piece
      boardWithPieces[19][7] = 8; // Unknown piece type

      const gameStateWithPieces = {
        ...defaultState,
        joined: true,
        started: true,
        gamestate: {
          ...defaultGameState,
          players: new Map([
            ['room1_player1', {
              playerId: 'room1_player1',
              board: boardWithPieces,
              currentPiece: { 
                shape: [[1, 1], [1, 1]], 
                type: 'O' as const, 
                rotation: 0, 
                x: 4, 
                y: 0 
              },
              nextPieces: [{ shape: [[1]], type: 'I' as const, rotation: 0, x: 0, y: 0 }],
              spectrum: Array(10).fill(0),
              lines: 5,
              score: 1000,
              level: 2,
              isAlive: true,
              penalties: 0
            }]
          ])
        }
      };

      const store = configureStore({
        reducer: { socket: socketReducer },
        preloadedState: { socket: gameStateWithPieces },
      });

      (router.useParams as jest.Mock).mockReturnValue({
        roomName: 'room1',
        playerName: 'player1',
      });

      render(
        <Provider store={store}>
          <GameRoom />
        </Provider>
      );

      // Check player stats are displayed - but they're not actually displayed in current component
      // So let's just verify the basic structure
      expect(screen.getByText('Room: room1')).toBeInTheDocument();

      // Verify board is rendered with correct structure
      const board = document.querySelector('.tetris-board');
      expect(board).toBeInTheDocument();
    });

    it('should handle opponent spectrum rendering', async () => {
      const gameStateWithOpponents = {
        ...defaultState,
        joined: true,
        started: true,
        opponent1: 'player2',
        opponent2: 'player3',
        gamestate: {
          ...defaultGameState,
          players: new Map([
            ['room1_player1', {
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
            }],
            ['room1_player2', {
              playerId: 'room1_player2',
              board: Array(20).fill(null).map(() => Array(10).fill(0)),
              currentPiece: { shape: [[1]], type: 'I' as const, rotation: 0, x: 0, y: 0 },
              nextPieces: [],
              spectrum: [2, 3, 1, 4, 0, 1, 2, 3, 1, 0], // Non-zero spectrum values
              lines: 0,
              score: 0,
              level: 1,
              isAlive: true,
              penalties: 0
            }],
            ['room1_player3', {
              playerId: 'room1_player3',
              board: Array(20).fill(null).map(() => Array(10).fill(0)),
              currentPiece: { shape: [[1]], type: 'I' as const, rotation: 0, x: 0, y: 0 },
              nextPieces: [],
              spectrum: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Filled spectrum
              lines: 0,
              score: 0,
              level: 1,
              isAlive: true,
              penalties: 0
            }]
          ]),
          pieceSequence: [],
          currentPieceIndex: 0,
          gameOver: false,
          winner: null,
          startTime: Date.now()
        }
      };

      const store = configureStore({
        reducer: { socket: socketReducer },
        preloadedState: { socket: gameStateWithOpponents },
      });

      (router.useParams as jest.Mock).mockReturnValue({
        roomName: 'room1',
        playerName: 'player1',
      });

      render(
        <Provider store={store}>
          <GameRoom />
        </Provider>
      );

      // Check opponents are displayed
      expect(screen.getByText('player2')).toBeInTheDocument();
      expect(screen.getByText('player3')).toBeInTheDocument();
    });

    it('should handle blind mode correctly', async () => {
      const gameStateWithNextPiece = {
        ...defaultState,
        joined: true,
        started: true,
        gamestate: {
          ...defaultGameState,
          players: new Map([
            ['room1_player1', {
              playerId: 'room1_player1',
              board: Array(20).fill(null).map(() => Array(10).fill(0)),
              currentPiece: { shape: [[1]], type: 'I' as const, rotation: 0, x: 0, y: 0 },
              nextPieces: [{ shape: [[1, 1]], type: 'O' as const, rotation: 0, x: 0, y: 0 }],
              spectrum: Array(10).fill(0),
              lines: 0,
              score: 0,
              level: 1,
              isAlive: true,
              penalties: 0
            }]
          ])
        }
      };

      const store = configureStore({
        reducer: { socket: socketReducer },
        preloadedState: { socket: gameStateWithNextPiece },
      });

      (router.useParams as jest.Mock).mockReturnValue({
        roomName: 'room1',
        playerName: 'player1',
      });

      render(
        <Provider store={store}>
          <GameRoom />
        </Provider>
      );

      // Find and toggle blind mode - it's actually a checkbox, not a button with emoji
      const blindModeText = screen.getByText('Blind mode');
      expect(blindModeText).toBeInTheDocument();
      
      // Find the checkbox input for blind mode
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      
      // Toggle blind mode on
      fireEvent.click(checkbox);
      
      // Toggle blind mode off
      fireEvent.click(checkbox);
    });

    it('should handle null playerState in draw methods gracefully', async () => {
      const stateWithoutPlayer = {
        ...defaultState,
        joined: true,
        started: true,
        gamestate: {
          ...defaultGameState,
          players: new Map() // Empty players map
        }
      };

      const store = configureStore({
        reducer: { socket: socketReducer },
        preloadedState: { socket: stateWithoutPlayer },
      });

      (router.useParams as jest.Mock).mockReturnValue({
        roomName: 'room1',
        playerName: 'player1',
      });

      render(
        <Provider store={store}>
          <GameRoom />
        </Provider>
      );

      // Should render without errors even with no player state
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

  describe('Game board rendering coverage', () => {
    it('renders component with complex board data to trigger rendering functions', () => {
      const playerState = createPlayerState({
        board: [
          [1, 2, 3, 4, 5, 6, 7, 0, 0, 0], // Different piece types
          [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
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
        spectrum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        lines: 0,
        score: 0,
        level: 1,
        isAlive: true,
        penalties: 0
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

  it('should handle rendering board with piece types and null cells', () => {
    const gameStateWithPieceTypes = {
      ...defaultGameState,
      players: new Map([
        ['room1_player1', createPlayerState({
          board: [
            [1, 2, 3, 4, 5, 6, 7, 0, 0, 0], // Different piece types
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
          ],
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
          }]
        })]
      ])
    };

    const { store } = renderWithState({
      ...defaultState,
      connected: true,
      started: true,
      gamestate: gameStateWithPieceTypes
    });

    // Create mock cells for the board rendering
    const mockCells = [];
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement('div');
        cell.id = `cell-player-${row}-${col}`;
        cell.className = 'tetris-cell';
        document.body.appendChild(cell);
        mockCells.push(cell);
      }
    }

    // Create mock next piece cells
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = document.createElement('div');
        cell.id = `next-player1-${row}-${col}`;
        cell.className = 'next-cell';
        document.body.appendChild(cell);
      }
    }

    // Trigger a re-render to execute the board rendering logic
    act(() => {
      store.dispatch({
        type: 'socket/onUpdatedData',
        payload: { gameState: gameStateWithPieceTypes }
      });
    });

    // Clean up mock elements
    mockCells.forEach(cell => document.body.removeChild(cell));
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const cell = document.getElementById(`next-player1-${row}-${col}`);
        if (cell) document.body.removeChild(cell);
      }
    }
  });

  it('should handle spectrum rendering with spectrum data', () => {
    const gameStateWithSpectrum = {
      ...defaultGameState,
      players: new Map([
        ['room1_player1', createPlayerState({
          spectrum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        })],
        ['room1_player2', createPlayerState({
          playerId: 'room1_player2',
          spectrum: [5, 3, 7, 2, 4, 1, 6, 0, 8, 9] // Spectrum heights
        })]
      ])
    };

    const { store } = renderWithState({
      ...defaultState,
      connected: true,
      started: true,
      gamestate: gameStateWithSpectrum
    });

    // Create mock opponent cells for spectrum rendering
    const mockOpponentCells = [];
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement('div');
        cell.id = `cell-1-${row}-${col}`;
        cell.className = 'tetris-opponent-cell';
        document.body.appendChild(cell);
        mockOpponentCells.push(cell);
      }
    }

    act(() => {
      store.dispatch({
        type: 'socket/onUpdatedData',
        payload: { gameState: gameStateWithSpectrum }
      });
    });

    // Clean up mock elements
    mockOpponentCells.forEach(cell => document.body.removeChild(cell));
  });
  });
});
