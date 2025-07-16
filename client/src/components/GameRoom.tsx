import React from 'react';
import { useParams } from 'react-router-dom';

const GameRoom: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();

  return (
    <div className="game-room">
      <h2>Room: {roomName}</h2>
      <div className="game-container">
        {/* Game board and other components will go here */}
        <p>Game room placeholder</p>
      </div>
    </div>
  );
};

export default GameRoom;