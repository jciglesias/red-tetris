import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Board } from '../../types/index.ts';

interface GameSliceState {
  board: Board;
  score: number;
  level: number;
  lines: number;
  gameState: GameState;
  isPaused: boolean;
}

const initialState: GameSliceState = {
  board: Array(20).fill(null).map(() => Array(10).fill(0)),
  score: 0,
  level: 1,
  lines: 0,
  gameState: GameState.WAITING,
  isPaused: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    updateBoard: (state, action: PayloadAction<Board>) => {
      state.board = action.payload;
    },
    updateScore: (state, action: PayloadAction<number>) => {
      state.score = action.payload;
    },
    updateGameState: (state, action: PayloadAction<GameState>) => {
      state.gameState = action.payload;
    },
    togglePause: (state) => {
      state.isPaused = !state.isPaused;
    },
  },
});

export const { updateBoard, updateScore, updateGameState, togglePause } = gameSlice.actions;
export default gameSlice.reducer;