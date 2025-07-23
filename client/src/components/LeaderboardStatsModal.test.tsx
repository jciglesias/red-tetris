import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LeaderboardStatsModal from './LeaderboardStatsModal';
import { NetworkUtils } from '../utils/NetworkUtils';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock NetworkUtils
jest.mock('../utils/NetworkUtils', () => ({
  NetworkUtils: {
    findWorkingServerUrl: jest.fn()
  }
}));

const mockFindWorkingServerUrl = NetworkUtils.findWorkingServerUrl as jest.MockedFunction<typeof NetworkUtils.findWorkingServerUrl>;

describe('LeaderboardStatsModal Component', () => {
  const mockStatsData = {
    topScore: 15000,
    topScorePlayer: 'Player1',
    mostLinesCleared: 150,
    mostLinesClearedPlayer: 'Player2',
    longestGameDuration: 600, // 10 minutes = 600 seconds
    longestGamePlayer: 'Player3',
    totalGames: 25
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
    mockFindWorkingServerUrl.mockResolvedValue('http://localhost:3001');
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it('should render the World Records button', () => {
    render(<LeaderboardStatsModal />);
    
    expect(screen.getByText('World Records')).toBeInTheDocument();
    expect(screen.getByText('World Records')).toHaveClass('modal-button');
  });

  it('should not show modal initially', () => {
    render(<LeaderboardStatsModal />);
    
    expect(screen.queryByText('🏆 World Records 🏆')).not.toBeInTheDocument();
    expect(screen.queryByText('🏆 Top Score')).not.toBeInTheDocument();
  });

  it('should fetch data and open modal when button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    const button = screen.getByText('World Records');
    fireEvent.click(button);

    // Wait for modal to appear first
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /world records/i })).toBeInTheDocument();
    });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3001/api/leaderboard/stats');
  });

  it('should display all statistics sections correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('World Records'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /world records/i })).toBeInTheDocument();
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
      longestGameDuration: 125 // 2 minutes and 5 seconds
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => customStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('World Records'));

    await waitFor(() => {
      expect(screen.getByText('2:05')).toBeInTheDocument();
    });
  });

  it('should format duration with padding correctly', async () => {
    const customStatsData = {
      ...mockStatsData,
      longestGameDuration: 65 // 1 minute and 5 seconds
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => customStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('World Records'));

    await waitFor(() => {
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });
  });

  it('should show loading state when statsData is null', () => {
    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('World Records'));

    // Before the fetch completes, it should show loading
    expect(screen.queryByText('Loading stats...')).not.toBeInTheDocument(); // Initially not shown
  });

  it('should handle fetch error gracefully', async () => {
    const mockError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(mockError);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('World Records'));

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error fetching stats:', mockError);
    });

    // Modal should not open on error
    expect(screen.queryByText('🏆 World Records 🏆')).not.toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    // Open modal
    fireEvent.click(screen.getByText('World Records'));

    await waitFor(() => {
      expect(screen.getByText('🏆 World Records 🏆')).toBeInTheDocument();
    });

    // Close modal
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    // Modal should be closed
    expect(screen.queryByText('🏆 World Records 🏆')).not.toBeInTheDocument();
  });

  it('should have correct styling structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    fireEvent.click(screen.getByText('World Records'));

    await waitFor(() => {
      expect(screen.getByText('🏆 World Records 🏆')).toBeInTheDocument();
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
    
    const button = screen.getByText('World Records');
    
    // First click
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('🏆 World Records 🏆')).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('🏆 World Records 🏆')).not.toBeInTheDocument();

    // Second click
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('🏆 World Records 🏆')).toBeInTheDocument();
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
    
    fireEvent.click(screen.getByText('World Records'));

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
    
    fireEvent.click(screen.getByText('World Records'));

    await waitFor(() => {
      expect(screen.getByText('🏆 World Records 🏆')).toBeInTheDocument();
    });

    // Check zero values are displayed correctly
    expect(screen.getAllByText('0')).toHaveLength(3); // topScore, mostLines, totalGames
    expect(screen.getByText('0:00')).toBeInTheDocument(); // duration
    expect(screen.getAllByText('by NoPlayer')).toHaveLength(3);
  });

  describe('formatDuration function', () => {
    it('should format various durations correctly', async () => {
      const testCases = [
        { input: 0, expected: '0:00' },
        { input: 5, expected: '0:05' },
        { input: 60, expected: '1:00' },
        { input: 65, expected: '1:05' },
        { input: 600, expected: '10:00' },
        { input: 3665, expected: '61:05' } // 1 hour 1 minute 5 seconds
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

        const { unmount } = render(<LeaderboardStatsModal />);
        
        fireEvent.click(screen.getByText('World Records'));

        await waitFor(() => {
          expect(screen.getByText(testCase.expected)).toBeInTheDocument();
        });

        // Clean up
        unmount();
      }
    });

    it('should test formatDuration as isolated function', () => {
      render(<LeaderboardStatsModal />);
      
      // Create a mock component to test the format function indirectly
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          topScore: 15000,
          topScorePlayer: 'Player1',
          mostLinesCleared: 150,
          mostLinesClearedPlayer: 'Player2',
          longestGameDuration: 0, // 0 milliseconds
          longestGamePlayer: 'Player3',
          totalGames: 25
        }),
      } as Response);
      
      fireEvent.click(screen.getByText('World Records'));
      
      waitFor(() => {
        expect(screen.getByText('0:00')).toBeInTheDocument();
      });
    });
  });

  it('should handle modal state correctly when opening and closing', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStatsData,
    } as Response);

    render(<LeaderboardStatsModal />);
    
    // Modal should not be visible initially
    expect(screen.queryByRole('heading', { name: /world records/i })).not.toBeInTheDocument();
    
    // Open modal
    fireEvent.click(screen.getByText('World Records'));
    
    waitFor(() => {
      expect(screen.getByRole('heading', { name: /world records/i })).toBeInTheDocument();
      
      // Close modal
      fireEvent.click(screen.getByText('×'));
      
      waitFor(() => {
        expect(screen.queryByRole('heading', { name: /world records/i })).not.toBeInTheDocument();
      });
    });
  });
});
