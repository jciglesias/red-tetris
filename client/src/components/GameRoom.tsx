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
      renderBoard(playerState);
      if (data.gameState.nextPieces && data.gameState.nextPieces[0]) {
        renderNextPiece(data.gameState.nextPieces[0]);
      }
    });

    socket.on('game-state-update', (data) => {
      console.log('Game state update: ' + JSON.stringify(data, null, 2));
      // Extract this player's update
      const updateKey = `${roomName}_${playerName}`;
      const updatedState = (data.players as any)[updateKey];
      renderBoard(updatedState);
      if (updatedState.nextPieces && updatedState.nextPieces[0]) {
        renderNextPiece(updatedState.nextPieces[0]);
      }
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

  // render next piece
  function renderNextPiece(nextPiece: any) {
    const next = nextRef.current;
    if (!next) return;
    next.innerHTML = '';
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const cell = document.createElement('div');
        cell.className = 'next-cell';
        if (nextPiece.shape[r][c]) cell.className += ' filled';
        next.appendChild(cell);
      }
    }
  }

  // render board state
  function renderBoardsave(gameState: any) {
    console.log('renderBoard');
    const board = boardRef.current;
    if (!board) return;
    // clear cells
    board.querySelectorAll('.tetris-cell').forEach(c => c.className = 'tetris-cell');
    // draw fixed blocks
    if (gameState.board) {
      gameState.board.forEach((rowArr: number[], r: number) => {
        rowArr.forEach((val, c) => {
          if (val) {
            const cell = document.getElementById(`cell-${playerName}-${r}-${c}`);
            if (cell) cell.className = `tetris-cell filled`;
          }
        });
      });
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