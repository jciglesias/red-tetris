import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";


const socket = io("http://localhost:3001");

function GameRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const { playerName } = useParams<{ playerName: string }>();

    useEffect(() => {
  
    socket.on('connect', () => {
      console.log('connect')
    })

    socket.on('disconnect', () => {
      console.log('disconnect')
    })

    socket.on('join-room-success', (data) => {
      console.log('Join room success: ' + JSON.stringify(data, null, 2));
    });

    socket.on('join-room-error', (data) => {
      console.log('Join room error: ' + JSON.stringify(data, null, 2));
    });

    socket.on('player-joined', (data) => {
      console.log('Player joined: ' + JSON.stringify(data, null, 2));
    });

    socket.on('player-left', (data) => {
      console.log('Player left: ' + JSON.stringify(data, null, 2));
    });

    socket.on('player-disconnected', (data) => {
      console.log('Player disconnected: ' + JSON.stringify(data, null, 2));
    });

    socket.on('player-reconnected', (data) => {
      console.log('Player reconnected: ' + JSON.stringify(data, null, 2));
    });

    socket.on('player-ready-changed', (data) => {
      console.log('Player ready changed: ' + JSON.stringify(data, null, 2));
    });

    // Game events
    socket.on('game-started', (data) => {
      console.log('Game started: ' + JSON.stringify(data, null, 2));
    });

    socket.on('game-state-update', (data) => {
      console.log('Game state update: ' + JSON.stringify(data, null, 2));
    });

    socket.on('game-ended', (data) => {
      console.log('Game ended: ' + JSON.stringify(data, null, 2));
    });

    socket.on('game-paused', (data) => {
      console.log('Game paused: ' + JSON.stringify(data, null, 2));
    });

    socket.on('game-reset', (data) => {
      console.log('Game reset: ' + JSON.stringify(data, null, 2));
    });

    // Reconnection events
    socket.on('reconnection-success', (data) => {
      console.log('Reconnection success: ' + JSON.stringify(data, null, 2));
    });

    socket.on('reconnection-error', (data) => {
      console.log('Reconnection error: ' + JSON.stringify(data, null, 2));
    });

    socket.on('heartbeat-ack', () => {
      console.log('Heartbeat acknowledged');
    });

    // Error events
    socket.on('error', (data) => {
      console.log('Error: ' + JSON.stringify(data, null, 2));
    });

  return () => {
      socket.off('connect');
      socket.off('disconnect');
    };

  }, []);

  function joinRoom() {
    socket.emit('join-room', {
        roomName: roomName,
        playerName: playerName
    });
    console.log('joinRoom')
  }

  return (
    <div className="game-room">
      <h2>Room: {roomName}</h2>
      <h2>Player: {playerName}</h2>
      <button onClick={joinRoom}>Join Room</button>
      <div className="game-container">
        {/* Game board and other components will go here */}
        <p>Game room placeholder</p>
      </div>
    </div>
  );
};

export default GameRoom;