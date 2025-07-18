import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";


const socket = io("http://localhost:3001");

function GameRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const { playerName } = useParams<{ playerName: string }>();
  const [playerReady, setPlayerReady] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [hasStarted, sethasStarted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [contentError, setContentError] = useState("");

    useEffect(() => {
  
    socket.on('connect', () => {
      console.log('connect')
    })

    socket.on('disconnect', () => {
      console.log('disconnect')
    })

    socket.on('join-room-success', (data) => {
      console.log('Join room success: ' + JSON.stringify(data, null, 2));
      setHasJoinedRoom(true);
    });

    socket.on('join-room-error', (data) => {
      console.log('Join room error: ' + JSON.stringify(data, null, 2));
      setHasJoinedRoom(false);
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
      console.log('Player ready check = ' + roomName + "_" + playerName);
      console.log('Player ready check = ' + data.playerId );
      if (data.playerId === roomName + "_" + playerName) {
        setPlayerReady(data.ready);
        console.log('Player ready changed! ' + data.ready);
      }      
    });

    // Game events
    socket.on('game-started', (data) => {
      console.log('Game started: ' + JSON.stringify(data, null, 2));
      sethasStarted(true);
      setIsError(false);
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
      setIsError(true);
      setContentError(JSON.stringify(data, null, 2));
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

  function setReady() {
    socket.emit('player-ready', {
        ready: !playerReady
    });
    console.log('player-ready');
  }

  function startGame() {
    socket.emit('start-game');
    console.log('start-game')
  }
  return (
    <div className="game-room">
      <h2>Room: {roomName}</h2>
      <h2>Player: {playerName}</h2>
      <p>Joined: {hasJoinedRoom ? 'Yes' : 'No'}</p>
      <p>Ready: {playerReady ? 'Yes' : 'No'}</p>
      {!hasJoinedRoom && (
        <button onClick={joinRoom}>Join Room</button>
      )}
      {!playerReady && hasJoinedRoom && (
        <button onClick={setReady}>set Ready</button>
      )}
      {!hasStarted && playerReady && (
        <button onClick={startGame}>start Game</button>
      )}
      {isError && (
        <div className="error-container">
          <p>Error :</p>
          <p>{contentError}</p>
        </div>
      )}
      {hasStarted && (
        <div className="game-container">
          {/* Game board and other components will go here */}
          <p>Game room placeholder</p>
        </div>
      )}
    </div>
  );
};

export default GameRoom;