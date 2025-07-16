import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice.ts';
import roomReducer from './slices/roomSlice.ts';
import playerReducer from './slices/playerSlice.ts';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    room: roomReducer,
    player: playerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;