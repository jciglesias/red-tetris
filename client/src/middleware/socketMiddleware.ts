import { Middleware } from '@reduxjs/toolkit';
import { io, Socket } from 'socket.io-client';

interface ConnectPayload {
  room: string;
  playerName: string;
}

const socketMiddleware: any = (storeAPI: any) => {
  let socket: Socket | null = null;

  return (next: any) => (action: any) => {
    switch (action.type) {
      case 'socket/connect': {
        const { room, playerName } = action.payload as ConnectPayload;
        if (socket) {
          socket.disconnect();
        }
        socket = io(window.location.origin, {
          query: { room, playerName },
        });
        socket.on('connect', () => {
          storeAPI.dispatch({ type: 'socket/on/connect' });
        });
        socket.on('disconnect', () => {
          storeAPI.dispatch({ type: 'socket/on/disconnect' });
        });
        // ... you can add more event listeners here and dispatch actions
        break;
      }
      case 'socket/disconnect': {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        break;
      }
      default: {
        if (action.type && action.type.startsWith('socket/emit/')) {
          if (socket) {
            const event = action.type.replace('socket/emit/', '');
            socket.emit(event, action.payload);
          }
        }
      }
    }

    return next(action);
  };
};

export default socketMiddleware;
