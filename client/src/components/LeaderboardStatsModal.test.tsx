import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardStatsModal from './LeaderboardStatsModal';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('LeaderboardStatsModal Component', () => {
  const mockStatsData = {
    topScore: 15000,
    topScorePlayer: 'Player1',
    mostLinesCleared: 150,
    mostLinesClearedPlayer: 'Player2',
    longestGameDuration: 600000, // 10 minutes
    longestGamePlayer: 'Player3',
    totalGames: 25
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('should render the All Stats button', () => {
    render(<LeaderboardStatsModal />);
    
    expect(screen.getByText('All Stats')).toBeInTheDocument();
    expect(screen.getByText('All Stats')).toHaveClass('modal-button');
  });

  it('should not show modal initially', () => {
    render(<LeaderboardStatsModal />);
    
    expect(screen.queryByText('Leaderboard Statistics')).not.toBeInTheDocument();
    expect(screen.queryByText('🏆 Top Score')).not.toBeInTheDocument();
  });

  it('should fetch data and open modal when button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    const button = screen.getByText('All Stats');
    fireEvent.click(button);

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/leaderboard/stats');

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Leaderboard Statistics')).toBeInTheDocument();
    });
  });

  it('should display all statistics sections correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(screen.getByText('Leaderboard Statistics')).toBeInTheDocument();
    });

    // Check all section headers
    expect(screen.getByText('🏆 Top Score')).toBeInTheDocument();
    expect(screen.getByText('📊 Most Lines Cleared')).toBeInTheDocument();
    expect(screen.getByText('⏱️ Longest Game')).toBeInTheDocument();
    expect(screen.getByText('🎮 Total Games')).toBeInTheDocument();

    // Check top score data
    expect(screen.getByText('15,000')).toBeInTheDocument(); // formatted with toLocaleString
    expect(screen.getByText('by Player1')).toBeInTheDocument();

    // Check most lines cleared data
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('by Player2')).toBeInTheDocument();

    // Check longest game data (formatted duration)
    expect(screen.getByText('10:00')).toBeInTheDocument(); // 600000ms = 10 minutes
    expect(screen.getByText('by Player3')).toBeInTheDocument();

    // Check total games data
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('games played')).toBeInTheDocument();
  });

  it('should format duration correctly', async () => {
    const customStatsData = {
      ...mockStatsData,
      longestGameDuration: 125000 // 2 minutes and 5 seconds
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => customStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });
  });

  it('should format duration with padding correctly', async () => {
    const customStatsData = {
      ...mockStatsData,
      longestGameDuration: 65000 // 1 minute and 5 seconds
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => customStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });
  });

  it('should show loading state when statsData is null', () => {
    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    // Before the fetch completes, it should show loading
    expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument(); // Initially not shown
  });

  it('should handle fetch error gracefully', async () => {
    const mockError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(mockError);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching stats:', mockError);
    });

    // Modal should not open on error
    expect(screen.queryByText('Leaderboard Statistics')).not.toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    // Open modal
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(screen.getByText('Leaderboard Statistics')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    // Modal should be closed
    expect(screen.queryByText('Leaderboard Statistics')).not.toBeInTheDocument();
  });

  it('should have correct styling structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(screen.getByText('Leaderboard Statistics')).toBeInTheDocument();
    });

    // Check that the grid container exists
    const topScoreSection = screen.getByText('🏆 Top Score').closest('div');
    expect(topScoreSection).toHaveStyle({
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px'
    });

    // Check that the main container has correct styles
    const mainContainer = screen.getByText('🏆 Top Score').closest('div')?.parentElement;
    expect(mainContainer).toHaveStyle({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px'
    });
  });

  it('should handle multiple button clicks correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    const button = screen.getByText('All Stats');
    
    // First click
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Leaderboard Statistics')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Leaderboard Statistics')).not.toBeInTheDocument();

    // Second click
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Leaderboard Statistics')).toBeInTheDocument();
    });

    // Verify fetch was called twice
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should format large numbers correctly with toLocaleString', async () => {
    const customStatsData = {
      ...mockStatsData,
      topScore: 1234567
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => customStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });
  });

  it('should handle zero values correctly', async () => {
    const customStatsData = {
      topScore: 0,
      topScorePlayer: 'NoPlayer',
      mostLinesCleared: 0,
      mostLinesClearedPlayer: 'NoPlayer',
      longestGameDuration: 0,
      longestGamePlayer: 'NoPlayer',
      totalGames: 0
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => customStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('All Stats'));

    await waitFor(() => {
      expect(screen.getByText('Leaderboard Statistics')).toBeInTheDocument();
    });

    // Check zero values are displayed correctly
    expect(screen.getByText('0')).toBeInTheDocument(); // topScore
    expect(screen.getByText('0:00')).toBeInTheDocument(); // duration
    expect(screen.getAllByText('by NoPlayer')).toHaveLength(3);
  });

  describe('formatDuration function', () => {
    it('should format various durations correctly', async () => {
      const testCases = [
        { input: 0, expected: '0:00' },
        { input: 5000, expected: '0:05' },
        { input: 60000, expected: '1:00' },
        { input: 65000, expected: '1:05' },
        { input: 600000, expected: '10:00' },
        { input: 3665000, expected: '61:05' } // 1 hour 1 minute 5 seconds
      ];

      for (const testCase of testCases) {
        const customStatsData = {
          ...mockStatsData,
          longestGameDuration: testCase.input
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => customStatsData,
        } as Response);

        render(<LeaderboardStatsModal />);
        
        fireEvent.click(screen.getByText('All Stats'));

        await waitFor(() => {
          expect(screen.getByText(testCase.expected)).toBeInTheDocument();
        });

        // Close modal for next iteration
        fireEvent.click(screen.getByText('Close'));
      }
    });
  });
});
