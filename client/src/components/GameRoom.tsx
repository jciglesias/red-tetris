import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";
import './GameRoom.css';


const socket = io("http://localhost:3001");

function GameRoom() {
  const { roomName } = useParams<{ roomName: string }>();
  const { playerName } = useParams<{ playerName: string }>();
  const [playerReady, setPlayerReady] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [hasStarted, sethasStarted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [contentError, setContentError] = useState("");
  const boardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  // keep last player state for periodic rendering
  const playerStateRef = useRef<any>(null);

  useEffect(() => {

    initializeNextPiece();
    initializeBoard();
  
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
      initializeBoard();
      initializeNextPiece();
      console.log('Game started data : ' + JSON.stringify(data.gameState, null, 2));
      // Extract this player's state from the serialized gameState object
      const key = `${roomName}_${playerName}`;
      const playerState = (data.gameState.players as any)[key];
      playerStateRef.current = playerState;
      renderBoard(playerState);
      if (playerState.nextPieces && playerState.nextPieces[0]) {
        renderNextPiece(playerState.nextPieces[0]);
      }
    });

    socket.on('game-state-update', (data) => {
      console.log('Game state update: ' + JSON.stringify(data, null, 2));
      // Extract this player's update
      const updateKey = `${roomName}_${playerName}`;
      const updatedState = (data.players as any)[updateKey];
      playerStateRef.current = updatedState;
      renderBoard(updatedState);
      if (updatedState.nextPieces && updatedState.nextPieces[0]) {
        renderNextPiece(updatedState.nextPieces[0]);
      }
    });

    socket.on('room-info', (data) => {
      // Handle room-info safely
      if (!data || !data.gameState) {
        console.warn('room-info: missing gameState', data);
        return;
      }
      console.log('Room info:', JSON.stringify(data.gameState, null, 2));
      const key = `${roomName}_${playerName}`;
      const updatedState = (data.gameState.players as any)?.[key];
      if (!updatedState) {
        console.warn(`room-info: no state for key ${key}`, data.gameState.players);
        return;
      }
      playerStateRef.current = updatedState;
      renderBoard(updatedState);
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

    document.addEventListener('keydown', function(event) {
      switch(event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            socket.emit('game-action', {action: 'move-left'});
            break;
        case 'ArrowRight':
            event.preventDefault();
            socket.emit('game-action', {action: 'move-right'});
            break;
        case 'ArrowUp':
            event.preventDefault();
            socket.emit('game-action', {action: 'rotate'});
            break;
        case 'ArrowDown':
            event.preventDefault();
            socket.emit('game-action', {action: 'soft-drop'});
            break;
        case ' ':
            event.preventDefault();
            socket.emit('game-action', {action: 'hard-drop'});
            break;
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };

  }, []);

  // call renderBoard every second using the last known state
  useEffect(() => {
    if (!hasStarted) return;
    const intervalId = setInterval(() => {
      console.log('Requesting room info');
      socket.emit('get-room-info');
    }, 1000);
    return () => clearInterval(intervalId);
  }, [hasStarted]);

  function initializeNextPiece() {
    const nextPiece = nextRef.current;
    if (!nextPiece) return;
    nextPiece.innerHTML = '';
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const cell = document.createElement('div');
            cell.className = 'next-cell';
            cell.id = `next-${playerName}-${row}-${col}`;
            nextPiece.appendChild(cell);
        }
    }
  }

  // render next piece
  function renderNextPiece(nextPiece: any) {
    if (!nextPiece?.shape || !Array.isArray(nextPiece.shape)) {
      console.error('renderNextPiece: invalid nextPiece', nextPiece);
      return;
    }
    console.log('Rendering next piece shape:', nextPiece.shape);
    // Reset grid
    initializeNextPiece();
    // Fill cells according to shape
    for (let row = 0; row < nextPiece.shape.length; row++) {
      for (let col = 0; col < nextPiece.shape[row].length; col++) {
        if (nextPiece.shape[row][col]) {
          const cell = document.getElementById(`next-${playerName}-${row}-${col}`);
          if (cell) {
            const pieceType = nextPiece.type;
            cell.className = `next-cell filled${pieceType ? ' piece-' + pieceType : ''}`;
            console.log(`Set next piece cell [${row},${col}] to piece-${pieceType}`);
          }
        }
      }
    }
  }

  function initializeBoard() {
    const board = boardRef.current;
    if (!board) return;
    board.innerHTML = '';
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement('div');
        cell.className = 'tetris-cell';
        cell.id = `cell-${playerName}-${row}-${col}`;
        board.appendChild(cell);
      }
    }
  }

  // render board state
  function renderBoard(gameState: any) {
    console.log('renderBoard');
    const board = boardRef.current;
    if (!board) return;
    // clear cells
    board.querySelectorAll('.tetris-cell').forEach(c => c.className = 'tetris-cell');
    // draw fixed blocks
    if (gameState.board && Array.isArray(gameState.board)) {      
      for (let row = 0; row < Math.min(gameState.board.length, 20); row++) {
        for (let col = 0; col < Math.min(gameState.board[row].length, 10); col++) {
          const cellValue = gameState.board[row][col];
          if (cellValue !== 0) {
            const cell = document.getElementById(`cell-${playerName}-${row}-${col}`);
            if (cell) {
              const pieceTypes = ['', 'I', 'O', 'T', 'S', 'Z', 'J', 'L'];
              const pieceType = pieceTypes[cellValue] || '';
              if (pieceType) {
                cell.className = `tetris-cell filled piece-${pieceType}`;
              } else {
                cell.className = 'tetris-cell filled';
              }
            }
          }
        }
      }
    }
    // draw current piece
    if (gameState.currentPiece) {
      const p = gameState.currentPiece;
      p.shape.forEach((rowArr: number[], r: number) => {
        rowArr.forEach((val, c) => {
          if (val) {
            const rr = p.y + r, cc = p.x + c;
            const cell = document.getElementById(`cell-${playerName}-${rr}-${cc}`);
            if (cell) cell.className = 'tetris-cell current';
          }
        });
      });
    }
  }

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
      <div className="room-header">
        <h2>Room: {roomName}</h2>
        <h2>Player: {playerName}</h2>
      </div>
      <div className="status-panel">
        <div className="status-indicator">
          <p>Joined: {hasJoinedRoom ? 'Yes' : 'No'}</p>
        </div>
        <div className="status-indicator">
          <p>Ready: {playerReady ? 'Yes' : 'No'}</p>
        </div>
      </div>
      <div className="button-group">
        {!hasJoinedRoom && <button onClick={joinRoom}>Join Room</button>}
        {hasJoinedRoom && !playerReady && <button onClick={setReady}>Set Ready</button>}
        {playerReady && !hasStarted && <button onClick={startGame}>Start Game</button>}
      </div>
      {isError && (
        <div className="error-container">
          <p>Error :</p>
          <p>{contentError}</p>
        </div>
      )}
      <div className="game-container">
        <div ref={nextRef} className="next-piece" />
        <div ref={boardRef} className="tetris-board" />
      </div>
    </div>
  );
};

export default GameRoom;