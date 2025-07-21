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
}

const initialState: SocketState = { 
  connected: false, 
  joined: false,
  playerReady: false,
  started: false
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
    socket.on('game-started', (data) => {
      console.log('Game started: ' + JSON.stringify(data, null, 2));
      dispatch(onStartGameSuccess());
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

export const startGame = createAsyncThunk(
  'socket/startGame',
  async () => {
    if (socket) {
      socket.emit('start-game', {
        fast: false
      });
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
    onStartGameSuccess(state) {
      state.started = true;
    },
  },
});

export const { onConnect, onDisconnect, onJoinRoomSuccess, onSetReadySuccess, onStartGameSuccess } = socketSlice.actions;
export default socketSlice.reducer;
