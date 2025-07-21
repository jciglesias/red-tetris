import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket } from '../store/socketSlice';
import { RootState, AppDispatch } from '../store';
import './GameRoom.css';


function GameRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const { playerName } = useParams<{ playerName: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const connected = useSelector((state: RootState) => state.socket.connected);

  useEffect(() => {
    dispatch(connectSocket({ room: roomName!, playerName: playerName! }));
    return () => {
      dispatch(disconnectSocket());
    };
  }, [roomName, playerName, dispatch]);


  return (
    <div className="game-room">
      <div className="room-header">
        <h2>Room: {roomName}</h2>
        <h2>Player: {playerName}</h2>
        <h3>Status: {connected ? 'Connected' : 'Disconnected'}</h3>
      </div>
    </div>
  );
};

export default GameRoom;