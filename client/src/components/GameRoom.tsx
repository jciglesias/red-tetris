import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, joinRoom, readyPlayer } from '../store/socketSlice';
import { RootState, AppDispatch } from '../store';
import './GameRoom.css';

function GameRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const { playerName } = useParams<{ playerName: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const connected = useSelector((state: RootState) => state.socket.connected);
  const joined = useSelector((state: RootState) => state.socket.joined);
  const playerReady = useSelector((state: RootState) => state.socket.playerReady);

  useEffect(() => {

    dispatch(connectSocket({ room: roomName!, playerName: playerName! }));
    
    return () => {
      dispatch(disconnectSocket());
    };

  }, [roomName, playerName, dispatch]);


  function handleJoin() {
    if (roomName && playerName) {
      dispatch(joinRoom({ room: roomName, playerName }));
    }
    console.log('joinRoom')
  }

  function handleReady() {
    if (roomName && playerName) {
      dispatch(readyPlayer());
    }
    console.log('player-ready')
  }

  return (
    <div className="game-room">
      <div className="room-header">
        <h2>Room: {roomName}</h2>
        <h2>Player: {playerName}</h2>
        <h3>Status: {connected ? 'Connected' : 'Disconnected'}</h3>
      </div>
       <div className="status-panel">
        <div className="status-indicator">
          <p>Joined: {joined ? 'Yes' : 'No'}</p>
          <p>Ready: {playerReady ? 'Yes' : 'No'}</p>
        </div>
      </div>
      <div className="button-group">
        {!joined && <button onClick={handleJoin}>Join Room</button>}
        {joined && !playerReady && <button onClick={handleReady}>Set Ready</button>}
      </div>
    </div>
  );
};

export default GameRoom;