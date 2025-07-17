import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// Mock des composants pour isoler le test du composant App
jest.mock('./components/Home', () => () => <div data-testid="home-page">Home Page</div>);
jest.mock('./components/GameRoom', () => () => <div data-testid="game-room">Game Room</div>);

describe('App', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders App component with correct CSS class', () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(container.querySelector('.App')).toBeTruthy();
  });

  it('handles route parameters correctly', () => {
    render(
      <MemoryRouter initialEntries={["/my-room/john-doe"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('game-room')).toBeTruthy();
  });

  it('handles special characters in route parameters', () => {
    render(
      <MemoryRouter initialEntries={["/room-123/player_test"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('game-room')).toBeTruthy();
  });
});
