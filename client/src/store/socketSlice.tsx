import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';

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
  opponent4: ''
};

export const connectSocket = createAsyncThunk(
  'socket/connect',
  async (payload: ConnectPayload, { dispatch }) => {
    if (socket) {
      socket.disconnect();
    }
    socket = io("http://localhost:3001");
    socket.on('connect', () => {
      dispatch(onConnect());
    });
    socket.on('disconnect', () => {
      dispatch(onDisconnect());
    });
    socket.on('join-room-success', (data) => {
      console.log('Join room success: ' + JSON.stringify(data, null, 2));
      dispatch(onJoinRoomSuccess());
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
    onConnect(state) {
      state.connected = true;
    },
    onDisconnect(state) {
      state.connected = false;
      state.joined = false;
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
    onError(state, action) {
      state.isError = true;
      state.contentError = action.payload;
    },
  },
});

export const { onConnect, onDisconnect, onJoinRoomSuccess, onSetReadySuccess, onStartGameSuccess, onError } = socketSlice.actions;
export default socketSlice.reducer;
