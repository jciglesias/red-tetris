import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';
import { GameState } from '../components/Interfaces';

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
  gamestate: {} as GameState
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

    socket.on('game-started', (data) => {
      console.log('Game started: ' + JSON.stringify(data, null, 2));
      const playersMap = data.gameState.players as Record<string, any>;
      const keys = Object.keys(playersMap).filter(k => k !== `${payload.room}_${payload.playerName}`);
      dispatch(onStartGameSuccess(keys));
      dispatch(onUpdateData(data.gameState));
    });

    socket.on('game-state-update', (data) => {
      console.log('Game state update: ' + JSON.stringify(data, null, 2));
      dispatch(onUpdatedData(data));
    });
    
    socket.on('room-info', (data) => {
      console.log('Room info: ' + JSON.stringify(data, null, 2));
      dispatch(onUpdateData(data.gameState));
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
    },
    onJoinRoomError(state, action) {
      state.joined = false;
      state.isError = true;
      state.contentError = action.payload;
    },
    onJoinRoomSuccess(state) {
      state.joined = true;
    },
    onSetReadySuccess(state) {
      state.playerReady = true;
    },
    onStartGameSuccess(state, action) {
      state.started = true;
      if (action.payload[0]) state.opponent1 = action.payload[0];
      if (action.payload[1]) state.opponent2 = action.payload[1];
      if (action.payload[2]) state.opponent3 = action.payload[2];
      if (action.payload[3]) state.opponent4 = action.payload[3];
    },
    onUpdateData(state, action) {
      state.gamestate = action.payload;
    },
    onUpdatedData(state, action) {
      state.gamestate = action.payload;
    },
    onError(state, action) {
      state.isError = true;
      state.contentError = action.payload;
    },
  },
});

export const { onConnect, onDisconnect, onJoinRoomSuccess, onJoinRoomError, onSetReadySuccess, onStartGameSuccess, onUpdateData, onUpdatedData, onError } = socketSlice.actions;
export default socketSlice.reducer;
