// Action creators for socket middleware
export const socketConnect = (room: string, playerName: string) => ({
  type: 'socket/connect',
  payload: { room, playerName },
});

export const socketDisconnect = () => ({
  type: 'socket/disconnect',
});

export const socketEmit = (event: string, payload?: any) => ({
  type: `socket/emit/${event}`,
  payload,
});
