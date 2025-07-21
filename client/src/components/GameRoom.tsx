import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, joinRoom, readyPlayer, startGame } from '../store/socketSlice';
import { RootState, AppDispatch } from '../store';
import './GameRoom.css';

function GameRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const { playerName } = useParams<{ playerName: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const connected = useSelector((state: RootState) => state.socket.connected);
  const joined = useSelector((state: RootState) => state.socket.joined);
  const playerReady = useSelector((state: RootState) => state.socket.playerReady);
  const started = useSelector((state: RootState) => state.socket.started);
  const isError = useSelector((state: RootState) => state.socket.isError);
  const contentError = useSelector((state: RootState) => state.socket.contentError);
  const opponent1 = useSelector((state: RootState) => state.socket.opponent1);
  const opponent2 = useSelector((state: RootState) => state.socket.opponent2);
  const opponent3 = useSelector((state: RootState) => state.socket.opponent3);
  const opponent4 = useSelector((state: RootState) => state.socket.opponent4);

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
    if (joined) {
      dispatch(readyPlayer());
    }
    console.log('player-ready')
  }

  function handleStart() {
    if (playerReady) {
      dispatch(startGame({ fast: false }));
    }
    console.log('start-game')
  }

  function handleFastStart() {
    if (playerReady) {
      dispatch(startGame({ fast: true }));
    }
    console.log('start-fast-game')
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
        {playerReady && !started && <button onClick={handleStart}>Start Game</button>}
        {playerReady && !started && <button onClick={handleFastStart}>Start Fast Game</button>}
      </div>
      {isError && (
        <div className="error-container">
          <p>Error :</p>
          <p>{contentError}</p>
        </div>
      )}
      <div className="game-container">
        <div className="opponent-column">
          <p>{opponent1}</p>
          <div className="tetris-opponent-board" />
          <p>{opponent3}</p>
          <div className="tetris-opponent-board" />
        </div>
        <div className="opponent-column">
          <p>{opponent2}</p>
          <div className="tetris-opponent-board" />
          <p>{opponent4}</p>
          <div className="tetris-opponent-board" />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;