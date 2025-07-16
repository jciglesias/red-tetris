import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Player } from '../../types/index.ts';

interface PlayerSliceState {
  currentPlayer: Player | null;
  playerId: string | null;
}

const initialState: PlayerSliceState = {
  currentPlayer: null,
  playerId: null,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayer: (state, action: PayloadAction<Player>) => {
      state.currentPlayer = action.payload;
    },
    setPlayerId: (state, action: PayloadAction<string>) => {
      state.playerId = action.payload;
    },
    clearPlayer: (state) => {
      state.currentPlayer = null;
      state.playerId = null;
    },
  },
});

export const { setPlayer, setPlayerId, clearPlayer } = playerSlice.actions;
export default playerSlice.reducer;