import { configureStore, combineReducers } from '@reduxjs/toolkit';
import socketReducer from './socketSlice';

const rootReducer = combineReducers({
  socket: socketReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
