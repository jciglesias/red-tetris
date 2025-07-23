import React, { useState } from 'react';
import Modal from './Modal';
import { LeaderboardStats } from './Interfaces';
import { NetworkUtils } from '../utils/NetworkUtils';

const LeaderboardStatsModal = () => {
  const [statsData, setStatsData] = useState<LeaderboardStats | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const serverUrl = await NetworkUtils.findWorkingServerUrl();
      const response = await fetch(`${serverUrl}/api/leaderboard/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStatsData(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatDuration = (second: number) => {
    const seconds = Math.floor(second);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <button className="modal-button" onClick={fetchStats}>World Records</button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#333',
          fontSize: '24px'
        }}>
            🏆 World Records 🏆
        </h2>
        {statsData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🏆 Top Score</h3>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{statsData.topScore.toLocaleString()}</p>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>by {statsData.topScorePlayer}</p>
              </div>
              
              <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>📊 Most Lines Cleared</h3>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{statsData.mostLinesCleared}</p>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>by {statsData.mostLinesClearedPlayer}</p>
              </div>
              
              <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>⏱️ Longest Game</h3>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{formatDuration(statsData.longestGameDuration)}</p>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>by {statsData.longestGamePlayer}</p>
              </div>
              
              <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🎮 Total Games</h3>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{statsData.totalGames}</p>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>games played</p>
              </div>
            </div>
          </div>
        ) : (
          <p>Loading stats...</p>
        )}
      </Modal>
    </div>
  );
};

export default LeaderboardStatsModal;
