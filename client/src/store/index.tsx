import { configureStore, combineReducers } from '@reduxjs/toolkit';
import socketReducer from './socketSlice';

// Add your feature reducers here
const rootReducer = combineReducers({
  socket: socketReducer,
  // ...reducers
});

export const store = configureStore({
  reducer: rootReducer,
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
