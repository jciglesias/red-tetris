import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Room } from '../../../../shared/src/types';

interface RoomSliceState {
  currentRoom: Room | null;
  isConnected: boolean;
  error: string | null;
}

const initialState: RoomSliceState = {
  currentRoom: null,
  isConnected: false,
  error: null,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoom: (state, action: PayloadAction<Room>) => {
      state.currentRoom = action.payload;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearRoom: (state) => {
      state.currentRoom = null;
    },
  },
});

export const { setRoom, setConnected, setError, clearRoom } = roomSlice.actions;
export default roomSlice.reducer;