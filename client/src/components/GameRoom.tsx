import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, joinRoom, readyPlayer, startGame, gameAction, getRoomInfo } from '../store/socketSlice';
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
  const gamestate = useSelector((state: RootState) => state.socket.gamestate);
  const boardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);
  const board1Ref = useRef<HTMLDivElement>(null);
  const board2Ref = useRef<HTMLDivElement>(null);
  const board3Ref = useRef<HTMLDivElement>(null);
  const board4Ref = useRef<HTMLDivElement>(null);
  const player1StateRef = useRef<any>(null);
  const player2StateRef = useRef<any>(null);
  const player3StateRef = useRef<any>(null);
  const player4StateRef = useRef<any>(null);

  initializeNextPiece();
  initializeBoards();


    useEffect(() => {

    document.addEventListener('keydown', function(event) {
      switch(event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            dispatch(gameAction({action: 'move-left'}));
            break;
        case 'ArrowRight':
            event.preventDefault();
            dispatch(gameAction({action: 'move-right'}));
            break;
        case 'ArrowUp':
            event.preventDefault();
            dispatch(gameAction({action: 'rotate'}));
            break;
        case 'ArrowDown':
            event.preventDefault();
            dispatch(gameAction({action: 'soft-drop'}));
            break;
        case ' ':
            event.preventDefault();
            dispatch(gameAction({action: 'hard-drop'}));
            break;
      }
    }); 

  }, []);


  useEffect(() => {

    dispatch(connectSocket({ room: roomName!, playerName: playerName! }));
    return () => {
      dispatch(disconnectSocket());
    };

  }, [roomName, playerName, dispatch]);


  useEffect(() => {
    renderBoard();
    //renderSpectrums();
  }, [gamestate]);

  useEffect(() => {
    if (!started) return;
    const intervalId = setInterval(() => {
      //console.log('Requesting room info');
      dispatch(getRoomInfo());
    }, 1000);
    return () => clearInterval(intervalId);
  }, [started]);
  


  function renderSpectrum(gameState: any, boardReference: HTMLDivElement | null, number: number) {
    const board = boardReference;
    if (!board) return;
    // Clear previous spectrum
    board.querySelectorAll('.tetris-opponent-cell').forEach(c => c.className = 'tetris-opponent-cell');
    // Render new spectrum
    //console.log('Rendering spectrum:', JSON.stringify(gameState.spectrum, null, 2));
    for (let col = 0; col < 10; col++) {
        for (let row = 0; row < gameState.spectrum[col]; row++) {
          const cell = document.getElementById(`cell-${number}-${19 - row}-${col}`);
          if (cell) {
            cell.className = 'tetris-opponent-cell filled';
          }
        }
      }
  }

  function renderSpectrums() {
    const playersMap = gamestate.players as Record<string, any>;
    const keys = Object.keys(playersMap).filter(k => k !== `${roomName}_${playerName}`);
    if (keys[0]) {
      console.log('renderSpectrums', keys[0]);
      const updatedState1 = (gamestate.players as any)[keys[0]];
      player1StateRef.current = updatedState1;
      renderSpectrum(player1StateRef.current, board1Ref.current, 1);
    }
    if (keys[1]) {
      console.log('renderSpectrums', keys[1]);
      const updatedState2 = (gamestate.players as any)[keys[1]];
      player2StateRef.current = updatedState2;
      renderSpectrum(player2StateRef.current, board2Ref.current, 2);
    }
    if (keys[2]) {
      console.log('renderSpectrums', keys[2]);
      const updatedState3 = (gamestate.players as any)[keys[2]];
      player3StateRef.current = updatedState3;
      renderSpectrum(player3StateRef.current, board3Ref.current, 3);
    }
    if (keys[3]) {
      console.log('renderSpectrums', keys[3]);
      const updatedState4 = (gamestate.players as any)[keys[3]];
      player4StateRef.current = updatedState4;
      renderSpectrum(player4StateRef.current, board4Ref.current, 4);
    }
  }

  function renderBoard() {
    // guard against undefined gamestate or players
    if (!gamestate?.players) return;
    // guard against missing players map or this player state
    const playerKey = `${roomName}_${playerName}`;
    const playersMap = gamestate.players as Record<string, any>;
    const playerState = playersMap[playerKey];

     // draw fixed blocks
    if (playerState && Array.isArray(playerState.board)) {
      for (let row = 0; row < Math.min(playerState.board.length, 20); row++) {
        for (let col = 0; col < Math.min(playerState.board[row].length, 10); col++) {
          const cellValue = playerState.board[row][col];
          if (cellValue !== 0) {
            const cell = document.getElementById(`cell-player-${row}-${col}`);
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

    if (!playerState?.currentPiece?.shape) return;
    const p = playerState.currentPiece;
    // draw current piece
    p.shape.forEach((rowArr: number[], r: number) => {
      rowArr.forEach((val, c) => {
        if (val) {
          const rr = p.y + r, cc = p.x + c;
          const cell = document.getElementById(`cell-player-${rr}-${cc}`);
          if (cell) cell.className = 'tetris-cell current';
        }
      });
    });


    if (!playerState?.nextPieces?.[0]) return;
    const np = playerState.nextPieces[0];
    initializeNextPiece();
    for (let row = 0; row < np.shape.length; row++) {
      for (let col = 0; col < np.shape[row].length; col++) {
        if (np.shape[row][col]) {
          const cell = document.getElementById(`next-${playerName}-${row}-${col}`);
          if (cell) {
            const pieceType = np.type;
            cell.className = `next-cell filled${pieceType ? ' piece-' + pieceType : ''}`;
            //console.log(`Set next piece cell [${row},${col}] to piece-${pieceType}`);
          }
        }
      }
    }

  }

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

    function initializePlayerBoard(ref: HTMLDivElement | null) {
    const board = ref;
    if (!board) return;
    board.innerHTML = '';
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement('div');
        cell.className = 'tetris-cell';
        cell.id = `cell-player-${row}-${col}`;
        board.appendChild(cell);
      }
    }
  }

  function initializeOpponentBoard(ref: HTMLDivElement | null, number: number = 1) {
    const board = ref;
    if (!board) return;
    board.innerHTML = '';
    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement('div');
        cell.className = 'tetris-opponent-cell';
        cell.id = `cell-${number}-${row}-${col}`;
        board.appendChild(cell);
      }
    }
  }

  function initializeBoards() {
    initializePlayerBoard(boardRef.current);
    initializeOpponentBoard(board1Ref.current, 1);
    initializeOpponentBoard(board2Ref.current, 2);
    initializeOpponentBoard(board3Ref.current, 3);
    initializeOpponentBoard(board4Ref.current, 4);
  }

  return (
    <div className="game-room">
      <div className="room-header">
        <h2>Room: {roomName}</h2>
        <h2>Player: {playerName}</h2>
      </div>
       <div className="status-panel">
        <div className="status-indicator">
          <p>Connected: {connected ? 'Yes' : 'No'}</p>
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
          <div ref={board1Ref} className="tetris-opponent-board" />
          <p>{opponent3}</p>
          <div ref={board3Ref} className="tetris-opponent-board" />
        </div>
        <div className='player-container'>
          <div ref={nextRef} className="next-piece" />
          <div ref={boardRef} className="tetris-board" />
        </div>
        <div className="opponent-column">
          <p>{opponent2}</p>
          <div ref={board2Ref} className="tetris-opponent-board" />
          <p>{opponent4}</p>
          <div ref={board4Ref} className="tetris-opponent-board" />
        </div>
      </div>
    </div>
  );
};

export default GameRoom;