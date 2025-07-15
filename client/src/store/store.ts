import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import roomReducer from './slices/roomSlice';
import playerReducer from './slices/playerSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    room: roomReducer,
    player: playerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;