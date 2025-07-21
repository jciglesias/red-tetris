import { configureStore, combineReducers } from '@reduxjs/toolkit';
import socketReducer from './socketSlice';

// Add your feature reducers here
const rootReducer = combineReducers({
  socket: socketReducer,
  // ...reducers
});

export const store = configureStore({
  reducer: rootReducer,
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
