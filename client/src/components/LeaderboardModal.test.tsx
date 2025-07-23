import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardModal from './LeaderboardModal';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock the Modal component
jest.mock('./Modal', () => {
  return function MockModal({ isOpen, onClose, children }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <button onClick={onClose} data-testid="close-button">×</button>
        {children}
      </div>
    );
  };
});

describe('LeaderboardModal Component', () => {
  const mockLeaderboardData = [
    {
      id: 1,
      playerName: 'Player1',
      score: 15000,
      linesCleared: 150,
      level: 5,
      gameDuration: 300000,
      roomName: 'room1',
      createdAt: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 2,
      playerName: 'Player2',
      score: 12000,
      linesCleared: 120,
      level: 4,
      gameDuration: 250000,
      roomName: 'room2',
      createdAt: new Date('2024-01-01T11:00:00Z')
    },
    {
      id: 3,
      playerName: 'Player3',
      score: 8000,
      linesCleared: 80,
      level: 3,
      gameDuration: 200000,
      roomName: 'room1',
      createdAt: new Date('2024-01-01T12:00:00Z')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should render the Best Scores button', () => {
    render(<LeaderboardModal />);
    
    expect(screen.getByText('Best Scores')).toBeInTheDocument();
    expect(screen.getByText('Best Scores')).toHaveClass('modal-button');
  });

  it('should not show modal initially', () => {
    render(<LeaderboardModal />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    expect(screen.queryByText('🏆 Top 10 All Time 🏆')).not.toBeInTheDocument();
  });

  it('should fetch data and open modal when button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    const button = screen.getByText('Best Scores');
    fireEvent.click(button);

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/leaderboard/top?limit=10');

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Verify console.log was called
    expect(mockConsoleLog).toHaveBeenCalledWith('Fetched leaderboard data:', mockLeaderboardData);
  });

  it('should display leaderboard data in table format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('🏅 Rank')).toBeInTheDocument();
    expect(screen.getByText('👤 Player')).toBeInTheDocument();
    expect(screen.getByText('💰 Score')).toBeInTheDocument();

    // Check table data
    expect(screen.getByText('Player1')).toBeInTheDocument();
    expect(screen.getByText('15,000')).toBeInTheDocument(); // formatted with commas
    expect(screen.getByText('Player2')).toBeInTheDocument();
    expect(screen.getByText('12,000')).toBeInTheDocument(); // formatted with commas
    expect(screen.getByText('Player3')).toBeInTheDocument();
    expect(screen.getByText('8,000')).toBeInTheDocument(); // formatted with commas

    // Verify all rows are present (3 data rows + 1 header row)
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4); // 1 header + 3 data rows
  });

  it('should handle fetch error gracefully', async () => {
    const mockError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(mockError);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching data:', mockError);
    });

    // Modal should not open on error
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should handle empty leaderboard data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('📊 No leaderboard data available')).toBeInTheDocument();
    });

    // Should not show headers when there's no data
    expect(screen.queryByText('🏅 Rank')).not.toBeInTheDocument();
    expect(screen.queryByText('👤 Player')).not.toBeInTheDocument();
    expect(screen.queryByText('💰 Score')).not.toBeInTheDocument();

    // No table should be present
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    // Open modal
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);

    // Modal should be closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should handle multiple button clicks correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    const button = screen.getByText('Best Scores');
    
    // First click
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByTestId('close-button'));
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();

    // Second click
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Verify fetch was called twice
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should format scores with commas correctly', async () => {
    const mockDataWithLargeScores = [
      {
        id: 1,
        playerName: 'HighScorer',
        score: 1234567,
        linesCleared: 150,
        level: 5,
        gameDuration: 300000,
        roomName: 'room1',
        createdAt: new Date('2024-01-01T10:00:00Z')
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataWithLargeScores,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Check formatted score
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should format duration correctly', async () => {
    const mockDataWithDuration = [
      {
        id: 1,
        playerName: 'Player1',
        score: 1000,
        linesCleared: 10,
        level: 1,
        gameDuration: 125, // 2 minutes 5 seconds
        roomName: 'room1',
        createdAt: new Date('2024-01-01T10:00:00Z')
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataWithDuration,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Check formatted duration (125 seconds = 2:05)
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('should handle missing roomName gracefully', async () => {
    const mockDataWithoutRoom = [
      {
        id: 1,
        playerName: 'Player1',
        score: 1000,
        linesCleared: 10,
        level: 1,
        gameDuration: 125,
        createdAt: new Date('2024-01-01T10:00:00Z')
        // roomName is undefined
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataWithoutRoom,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Should show 'N/A' for missing room name
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

});
