import React, { useEffect }  from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import GameRoom from './components/GameRoom';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomName" element={<GameRoom />} />
      </Routes>
    </div>
  );
};

export default App;
