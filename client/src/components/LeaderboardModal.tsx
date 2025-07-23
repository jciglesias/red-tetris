import React, { useState } from 'react';
import Modal from './Modal';
import { LeaderboardEntry } from './Interfaces';
import { findWorkingServerUrl } from '../utils/NetworkUtils';

const LeaderboardModal = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchData = async () => {
    try {
      const serverUrl = await findWorkingServerUrl();
      const response = await fetch(`${serverUrl}/api/leaderboard/top?limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      //console.log('Fetched leaderboard data:', data); // Debugging line
      setLeaderboardData(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
      <button className="modal-button" onClick={fetchData}>Best Scores</button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#333',
          fontSize: '24px'
        }}>
          🏆 Top 10 All Time 🏆
        </h2>
        {leaderboardData.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                  <th style={{ 
                    padding: '12px 8px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #1976d2'
                  }}>
                    🏅 Rank
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #1976d2'
                  }}>
                    👤 Player
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #1976d2'
                  }}>
                    💰 Score
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #1976d2'
                  }}>
                    ⏱️ Duration
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #1976d2'
                  }}>
                    📊 Lines
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #1976d2'
                  }}>
                    🎯 Level
                  </th>
                  <th style={{ 
                    padding: '12px 8px', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    borderBottom: '2px solid #1976d2'
                  }}>
                    🏠 Room
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player, index) => (
                  <tr key={player.id} style={{
                    backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e3f2fd';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                  }}>
                    <td style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e0e0e0',
                      fontWeight: 'bold',
                      color: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#666'
                    }}>
                      {index + 1}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e0e0e0',
                      fontWeight: '500',
                      color: '#333'
                    }}>
                      {player.playerName}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e0e0e0',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: '#2e7d32',
                      fontSize: '14px'
                    }}>
                      {player.score.toLocaleString()}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e0e0e0',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      color: '#666'
                    }}>
                      {formatDuration(player.gameDuration)}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e0e0e0',
                      textAlign: 'center',
                      fontWeight: '500',
                      color: '#1976d2'
                    }}>
                      {player.linesCleared}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e0e0e0',
                      textAlign: 'center',
                      fontWeight: '500',
                      color: '#7b1fa2'
                    }}>
                      {player.level}
                    </td>
                    <td style={{ 
                      padding: '10px 8px', 
                      borderBottom: '1px solid #e0e0e0',
                      textAlign: 'center',
                      fontSize: '12px',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>
                      {player.roomName || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#666',
            fontSize: '16px'
          }}>
            <p>📊 No leaderboard data available</p>
            <p style={{ fontSize: '14px', marginTop: '10px' }}>
              Play some games to see the leaderboard!
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeaderboardModal;