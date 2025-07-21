import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

// Mock useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Home', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Home component with correct title and form elements', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('Red Tetris')).toBeTruthy();
    expect(screen.getByPlaceholderText('Room Name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Player Name')).toBeTruthy();
    expect(screen.getByText('Join Room')).toBeTruthy();
  });

  it('updates room name input value when typing', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const roomInput = screen.getByPlaceholderText('Room Name') as HTMLInputElement;
    fireEvent.change(roomInput, { target: { value: 'test-room' } });
    
    expect(roomInput.value).toBe('test-room');
  });

  it('updates player name input value when typing', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const playerInput = screen.getByPlaceholderText('Player Name') as HTMLInputElement;
    fireEvent.change(playerInput, { target: { value: 'test-player' } });
    
    expect(playerInput.value).toBe('test-player');
  });

  it('navigates to game room when both inputs are filled and button is clicked', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const roomInput = screen.getByPlaceholderText('Room Name');
    const playerInput = screen.getByPlaceholderText('Player Name');
    const joinButton = screen.getByText('Join Room');

    fireEvent.change(roomInput, { target: { value: 'test-room' } });
    fireEvent.change(playerInput, { target: { value: 'test-player' } });
    fireEvent.click(joinButton);

    expect(mockNavigate).toHaveBeenCalledWith('/test-room/test-player');
  });

  it('does not navigate when room name is empty', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const playerInput = screen.getByPlaceholderText('Player Name');
    const joinButton = screen.getByText('Join Room');

    fireEvent.change(playerInput, { target: { value: 'test-player' } });
    fireEvent.click(joinButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when player name is empty', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const roomInput = screen.getByPlaceholderText('Room Name');
    const joinButton = screen.getByText('Join Room');

    fireEvent.change(roomInput, { target: { value: 'test-room' } });
    fireEvent.click(joinButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when both inputs are empty', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const joinButton = screen.getByText('Join Room');
    fireEvent.click(joinButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when inputs contain only whitespace', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const roomInput = screen.getByPlaceholderText('Room Name');
    const playerInput = screen.getByPlaceholderText('Player Name');
    const joinButton = screen.getByText('Join Room');

    fireEvent.change(roomInput, { target: { value: '   ' } });
    fireEvent.change(playerInput, { target: { value: '   ' } });
    fireEvent.click(joinButton);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('renders with correct CSS classes', () => {
    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(container.querySelector('.home')).toBeTruthy();
    expect(container.querySelector('.join-form')).toBeTruthy();
  });
});
