import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

interface ConnectPayload {
  room: string;
  playerName: string;
}

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

export interface SocketState {
  connected: boolean;
}

const initialState: SocketState = { connected: false };

const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    onConnect(state) {
      state.connected = true;
    },
    onDisconnect(state) {
      state.connected = false;
    },
  },
});

export const { onConnect, onDisconnect } = socketSlice.actions;
export default socketSlice.reducer;
