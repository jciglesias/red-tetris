import React, { useState }  from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';


import { useNavigate } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
};

export default App;
