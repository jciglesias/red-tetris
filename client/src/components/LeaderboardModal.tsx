import React, { useState } from 'react';
import Modal from './Modal';
import { LeaderboardEntry } from './Interfaces';

const LeaderboardModal = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/leaderboard/top?limit=5');
      const data = await response.json();
      setLeaderboardData(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  fetchData();

  return (
    <div>
      <button className="modal-button" onClick={fetchData}>Best Scores</button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Leaderboard</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Player Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((player) => (
              <tr key={player.id}>
                <td>{player.id}</td>
                <td>{player.playerName}</td>
                <td>{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};

export default LeaderboardModal;