import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { GameState, ChatMessage } from '../components/Interfaces';

let socket: Socket | null = null;

interface ConnectPayload {
  room: string;
  playerName: string;
}

export interface SocketState {
  connected: boolean;
  joined: boolean;
  playerReady: boolean;
  started: boolean;
  isError: boolean;
  contentError: string;
  opponent1: string;
  opponent2: string;
  opponent3: string;
  opponent4: string;
  playerId: string;
  gamestate: GameState;
  gameOver: boolean;
  gameWon: boolean;
  score: number;
  level: number;
  messages: ChatMessage[];
}

const initialState: SocketState = { 
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
  gamestate: {} as GameState,
  gameOver: false,
  gameWon: false,
  score: 0,
  level: 0,
  messages: []
};

export const connectSocket = createAsyncThunk(
  'socket/connect',
  async (payload: ConnectPayload, { dispatch }) => {
    if (socket) {
      socket.disconnect();
    }

    socket = io("http://localhost:3001");

    socket.on('connect', () => {
      dispatch(onConnect(payload));
    });

    socket.on('disconnect', () => {
      dispatch(onDisconnect());
    });

    socket.on('join-room-success', (data) => {
      console.log('Join room success: ' + JSON.stringify(data, null, 2));
      dispatch(onJoinRoomSuccess());
    });

    socket.on('join-room-error', (data) => {
      console.log('Join room error: ' + JSON.stringify(data, null, 2));
      const message = typeof data === 'object' && data !== null && 'message' in data
        ? (data as any).message
        : String(data);
      dispatch(onJoinRoomError(message));
    });

    socket.on('player-ready-changed', (data) => {
      console.log('Player ready changed: ' + JSON.stringify(data, null, 2));
      if (data.playerId === payload.room + "_" + payload.playerName) {
        dispatch(onSetReadySuccess());
        console.log('Player ready changed! ' + data.ready);
      }
    });

    socket.on('error', (data) => {
      console.log('Error: ' + JSON.stringify(data, null, 2));
      const message = typeof data === 'object' && data !== null && 'message' in data
        ? (data as any).message
        : String(data);
      dispatch(onError(message));
    });

    socket.on('game-reset', (data) => {
      console.log('Game reset: ' + JSON.stringify(data, null, 2));
      dispatch(onJoinRoomSuccess());
    });

    socket.on('chat-message', (data) => {
      console.log('Chat message: ' + JSON.stringify(data, null, 2));
      dispatch(addMessage(data));
    });

    socket.on('game-started', (data) => {
      console.log('Game started: ' + JSON.stringify(data, null, 2));
      const playersMap = data.gameState.players as Record<string, any>;
      const keys = Object.keys(playersMap).filter(k => k !== `${payload.room}_${payload.playerName}`);
      dispatch(onStartGameSuccess(keys));
      dispatch(onUpdateData(data.gameState));
    });

    socket.on('game-state-update', (data) => {
      //console.log('Game state update: ' + JSON.stringify(data, null, 2));
      if (data) {
        const key = `${payload.room}_${payload.playerName}`;
        const playerState = (data.players as Record<string, any>)[key];
        //console.log('Game state update: ' + JSON.stringify(playerState, null, 2));
        if (playerState.isAlive && playerState.isAlive === false) {
            dispatch(onGameOver(data));
        }
        if (data.winner && data.winner === key) {
          dispatch(onGameWon(data));
        }
        if (playerState.score && playerState.level) {
          dispatch(onScoreUpdate({ score: playerState.score, level: playerState.level }));
        }
      }
      dispatch(onUpdatedData(data));
    });
    
    socket.on('room-info', (data) => {
      console.log('Room info: ' + JSON.stringify(data, null, 2));
      if (data && data.gameState) {
        const key = `${payload.room}_${payload.playerName}`;
        const playerState = (data.gameState.players as Record<string, any>)[key];
        //console.log('Game state update: ' + JSON.stringify(playerState, null, 2));
        if (playerState.isAlive && playerState.isAlive === false) {
          dispatch(onGameOver(data.gameState));
        }
        if (data.gameState.winner && data.gameState.winner === key) {
          dispatch(onGameWon(data.gameState));
        }
        if (playerState.score && playerState.level) {
          dispatch(onScoreUpdate({ score: playerState.score, level: playerState.level }));
        }
      }
      dispatch(onUpdateData(data.gameState));
    });

    socket.on('game-ended', (data) => {
      console.log('Game ended: ' + JSON.stringify(data, null, 2));
      if (data.winner){
        console.log('Winner : ' + data.winner);
        if (data.winner === `${payload.room}_${payload.playerName}`) {
          dispatch(onGameWon(data.finalState));
        } else {
          dispatch(onGameOver(data.finalState));
        }
      }
    });

  }
);

export const joinRoom = createAsyncThunk(
  'socket/joinRoom',
  async (payload: ConnectPayload) => {
    if (socket) {
      socket.emit('join-room', {
        roomName: payload.room,
        playerName: payload.playerName
      });
    }
  }
);

export const readyPlayer = createAsyncThunk(
  'socket/readyPlayer',
  async () => {
    if (socket) {
      socket.emit('player-ready', {
        ready: true
      });
    }
  }
);

export const startGame = createAsyncThunk<void, { fast: boolean }>(
  'socket/startGame',
  async ({ fast }) => {
    if (socket) {
      socket.emit('start-game', { fast });
    }
  }
);

export const gameAction = createAsyncThunk<void, { action: string }>(
  'socket/gameAction',
  async ({ action }) => {
    if (socket) {
      socket.emit('game-action', { action });
    }
  }
);


export const sendMessage = createAsyncThunk<void, { message: string }>(
  'socket/sendMessage',
  async ({ message }) => {
    if (socket) {
      socket.emit('chat-message', { message });
    }
  }
);

export const relaunchGame = createAsyncThunk(
  'socket/relaunchGame',
  async () => {
    if (socket) {
      socket.emit('restart-game');
    }
  }
);

export const getRoomInfo = createAsyncThunk(
  'socket/getRoomInfo',
  async () => {
    if (socket) {
      socket.emit('get-room-info');
    }
  }
);

export const disconnectSocket = createAsyncThunk(
  'socket/disconnect',
  async (_, { dispatch }) => {
    if (socket) {
      socket.disconnect();
      socket = null;
      dispatch(onDisconnect());
    }
  }
);

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    onConnect(state, action) {
      state.connected = true;
      state.playerId = action.payload.room + "_" + action.payload.playerName;
    },
    onDisconnect(state) {
      state.connected = false;
      state.joined = false;
      state.playerReady = false;
      state.started = false;
    },
    onJoinRoomError(state, action) {
      state.joined = false;
      state.isError = true;
      state.contentError = action.payload;
    },
    onJoinRoomSuccess(state) {
      state.joined = true;
      state.isError = false;
      state.contentError = '';
      state.gameOver = false;
      state.gameWon = false;
    },
    onSetReadySuccess(state) {
      state.playerReady = true;
      state.isError = false;
      state.contentError = '';
    },
    onStartGameSuccess(state, action) {
      state.started = true;
      state.isError = false;
      state.contentError = '';
      if (action.payload[0]) state.opponent1 = action.payload[0].split('_')[1];
      if (action.payload[1]) state.opponent2 = action.payload[1].split('_')[1];
      if (action.payload[2]) state.opponent3 = action.payload[2].split('_')[1];
      if (action.payload[3]) state.opponent4 = action.payload[3].split('_')[1];
    },
    onScoreUpdate(state, action) {
      state.score = action.payload.score;
      state.level = action.payload.level;
    },
    onUpdateData(state, action) {
      state.gamestate = action.payload;
    },
    onUpdatedData(state, action) {
      state.gamestate = action.payload;
    },
    onGameOver(state, action) {
      state.gamestate = action.payload;
      state.gameOver = true;
      state.joined = false;
      state.playerReady = false;
      state.started = false;
    },
    onGameWon(state, action) {
      state.gamestate = action.payload;
      state.gameWon = true;
      state.joined = false;
      state.playerReady = false;
      state.started = false;
    },
    onError(state, action) {
      state.isError = true;
      state.contentError = action.payload;
    },
    addMessage(state, action) {
      state.messages.push(action.payload)
    },
    addMessages(state, action) {
      state.messages = [...state.messages, ...action.payload]
    },
  },
});

export const { onConnect, onDisconnect, onJoinRoomSuccess, onJoinRoomError, onSetReadySuccess, onStartGameSuccess, onUpdateData, onUpdatedData, onGameOver, onGameWon, onScoreUpdate, onError, addMessage, addMessages } = socketSlice.actions;
export default socketSlice.reducer;
