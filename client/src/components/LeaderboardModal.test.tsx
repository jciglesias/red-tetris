import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardModal from './LeaderboardModal';
import { NetworkUtils } from '../utils/NetworkUtils';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock NetworkUtils
jest.mock('../utils/NetworkUtils', () => ({
  NetworkUtils: {
    findWorkingServerUrl: jest.fn()
  }
}));

const mockFindWorkingServerUrl = NetworkUtils.findWorkingServerUrl as jest.MockedFunction<typeof NetworkUtils.findWorkingServerUrl>;

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
    mockFindWorkingServerUrl.mockResolvedValue('http://localhost:3001');
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

    // Wait for modal to appear first
    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/leaderboard/top?limit=10');
    
    // Verify the leaderboard data is displayed in the modal
    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
      expect(screen.getByText('15,000')).toBeInTheDocument();
    });
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

  it('should handle mouse hover events on table rows', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Get the first data row (not the header)
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row

    // Test mouse enter event
    fireEvent.mouseEnter(firstDataRow);
    expect(firstDataRow).toHaveStyle('background-color: #e3f2fd');

    // Test mouse leave event (should restore original color)
    fireEvent.mouseLeave(firstDataRow);
    expect(firstDataRow).toHaveStyle('background-color: #f8f9fa'); // First row should be gray
  });

  it('should apply different background colors for even and odd rows', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Index 0 in data (even)
    const secondDataRow = rows[2]; // Index 1 in data (odd)

    // First row (even index) should have gray background
    expect(firstDataRow).toHaveStyle('background-color: #f8f9fa');
    
    // Second row (odd index) should have white background
    expect(secondDataRow).toHaveStyle('background-color: white');
  });

  it('should display special colors for top 3 ranks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    
    // Check first place (gold color) - get the first cell of the first data row
    const firstRankCell = rows[1].querySelector('td:first-child') as HTMLElement;
    expect(firstRankCell).toHaveStyle('color: #FFD700');
    
    // Check second place (silver color)
    const secondRankCell = rows[2].querySelector('td:first-child') as HTMLElement;
    expect(secondRankCell).toHaveStyle('color: #C0C0C0');
    
    // Check third place (bronze color)
    const thirdRankCell = rows[3].querySelector('td:first-child') as HTMLElement;
    expect(thirdRankCell).toHaveStyle('color: #CD7F32');
  });

  it('should handle HTTP response that is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    // Wait a bit to ensure the fetch completed and error was logged
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });

    // Modal should not open when response is not ok
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should format duration correctly for different time values', async () => {
    const mockDataWithVariousDurations = [
      {
        id: 1,
        playerName: 'Player1',
        score: 1000,
        linesCleared: 10,
        level: 1,
        gameDuration: 60, // 1:00
        roomName: 'room1',
        createdAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 2,
        playerName: 'Player2',
        score: 2000,
        linesCleared: 20,
        level: 2,
        gameDuration: 75, // 1:15
        roomName: 'room2',
        createdAt: new Date('2024-01-01T11:00:00Z')
      },
      {
        id: 3,
        playerName: 'Player3',
        score: 3000,
        linesCleared: 30,
        level: 3,
        gameDuration: 3661, // 61:01
        roomName: 'room3',
        createdAt: new Date('2024-01-01T12:00:00Z')
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataWithVariousDurations,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Check various duration formats
    expect(screen.getByText('1:00')).toBeInTheDocument(); // 60 seconds
    expect(screen.getByText('1:15')).toBeInTheDocument(); // 75 seconds
    expect(screen.getByText('61:01')).toBeInTheDocument(); // 3661 seconds
  });

  it('should display all table headers correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Check all headers are present
    expect(screen.getByText('🏅 Rank')).toBeInTheDocument();
    expect(screen.getByText('👤 Player')).toBeInTheDocument();
    expect(screen.getByText('💰 Score')).toBeInTheDocument();
    expect(screen.getByText('⏱️ Duration')).toBeInTheDocument();
    expect(screen.getByText('📊 Lines')).toBeInTheDocument();
    expect(screen.getByText('🎯 Level')).toBeInTheDocument();
    expect(screen.getByText('🏠 Room')).toBeInTheDocument();
  });

  it('should display correct data in all table columns', async () => {
    const singlePlayerData = [
      {
        id: 1,
        playerName: 'TestPlayer',
        score: 50000,
        linesCleared: 100,
        level: 8,
        gameDuration: 180, // 3:00
        roomName: 'TestRoom',
        createdAt: new Date('2024-01-01T10:00:00Z')
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => singlePlayerData,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Check all data fields are displayed correctly
    expect(screen.getByText('1')).toBeInTheDocument(); // Rank
    expect(screen.getByText('TestPlayer')).toBeInTheDocument(); // Player name
    expect(screen.getByText('50,000')).toBeInTheDocument(); // Formatted score
    expect(screen.getByText('3:00')).toBeInTheDocument(); // Formatted duration
    expect(screen.getByText('100')).toBeInTheDocument(); // Lines cleared
    expect(screen.getByText('8')).toBeInTheDocument(); // Level
    expect(screen.getByText('TestRoom')).toBeInTheDocument(); // Room name
  });

  it('should handle zero duration correctly', async () => {
    const mockDataWithZeroDuration = [
      {
        id: 1,
        playerName: 'QuickPlayer',
        score: 1000,
        linesCleared: 1,
        level: 1,
        gameDuration: 0, // 0:00
        roomName: 'room1',
        createdAt: new Date('2024-01-01T10:00:00Z')
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataWithZeroDuration,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    // Check zero duration is formatted as 0:00
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('should handle HTTP response with non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    // Wait a bit to ensure the fetch completed and error was logged
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });

    // Modal should not open when response is not ok
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should display correct rank colors for positions beyond top 3', async () => {
    const mockDataWith4Players = [
      {
        id: 1,
        playerName: 'Player1',
        score: 1000,
        linesCleared: 10,
        level: 1,
        gameDuration: 60,
        roomName: 'room1',
        createdAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: 2,
        playerName: 'Player2',
        score: 900,
        linesCleared: 9,
        level: 1,
        gameDuration: 55,
        roomName: 'room2',
        createdAt: new Date('2024-01-01T11:00:00Z')
      },
      {
        id: 3,
        playerName: 'Player3',
        score: 800,
        linesCleared: 8,
        level: 1,
        gameDuration: 50,
        roomName: 'room3',
        createdAt: new Date('2024-01-01T12:00:00Z')
      },
      {
        id: 4,
        playerName: 'Player4',
        score: 700,
        linesCleared: 7,
        level: 1,
        gameDuration: 45,
        roomName: 'room4',
        createdAt: new Date('2024-01-01T13:00:00Z')
      }
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockDataWith4Players,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    
    // Check fourth place (should have default color #666)
    const fourthRankCell = rows[4].querySelector('td:first-child') as HTMLElement;
    expect(fourthRankCell).toHaveStyle('color: #666');
  });

  it('should handle mouse leave event for odd row indices', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLeaderboardData,
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(screen.getByText("🏆 Top 10 All Time 🏆")).toBeInTheDocument();
    });

    const rows = screen.getAllByRole('row');
    const secondDataRow = rows[2]; // Index 1 in data (odd)

    // Test mouse enter event
    fireEvent.mouseEnter(secondDataRow);
    expect(secondDataRow).toHaveStyle('background-color: #e3f2fd');

    // Test mouse leave event (should restore white background for odd rows)
    fireEvent.mouseLeave(secondDataRow);
    expect(secondDataRow).toHaveStyle('background-color: white');
  });

  it('should properly handle fetch with successful response but ok=false', async () => {
    // Mock response with ok: false but valid JSON
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    render(<LeaderboardModal />);
    
    fireEvent.click(screen.getByText('Best Scores'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/leaderboard/top?limit=10');
    });

    // Wait for error to be logged
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });

    // Modal should not be displayed when response is not ok
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    expect(screen.queryByText('🏆 Top 10 All Time 🏆')).not.toBeInTheDocument();
  });

});
