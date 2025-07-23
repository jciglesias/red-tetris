import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (roomName.trim() && playerName.trim()) {
      navigate(`/${roomName}/${playerName}`);
    }
  };

  return (
    <div className="home">
      <div className="title">
        <h1>Red Tetris</h1>
      </div>
      <div className="join-form">
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Player Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Join Room</button>
      </div>
    </div>
  );
};

export default Home;