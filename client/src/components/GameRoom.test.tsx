import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Déclaration de la variable mockSocket avant la factory
var mockSocket: any;

// Mock de socket.io-client et initialisation de mockSocket dans la factory
jest.mock('socket.io-client', () => {
  mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockSocket),
  };
});

// Import du composant après la configuration des mocks
import GameRoom from './GameRoom';

describe('GameRoom', () => {
  const roomName = 'test-room';
  const playerName = 'test-player';

  beforeEach(() => {
    jest.clearAllMocks();
    // mockSocket est réinitialisé par la factory avant chaque test
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithRouter = () =>
    render(
      <MemoryRouter initialEntries={[`/room/${roomName}/${playerName}`]}>
        <Routes>
          <Route path="/room/:roomName/:playerName" element={<GameRoom />} />
        </Routes>
      </MemoryRouter>
    );

  it('affiche les noms de room et de joueur extraits de l’URL', () => {
    renderWithRouter();
    expect(screen.getByText(`Room: ${roomName}`)).toBeTruthy();
    expect(screen.getByText(`Player: ${playerName}`)).toBeTruthy();
  });

  it('émet un événement "join-room" avec le bon payload au clic sur le bouton', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Join Room'));
    expect(mockSocket.emit).toHaveBeenCalledWith('join-room', {
      roomName: roomName,
      playerName: playerName,
    });
  });

  it('enregistre tous les écouteurs de socket à la charge', () => {
    renderWithRouter();
    const events = [
      'connect', 'disconnect', 'join-room-success', 'join-room-error',
      'player-joined', 'player-left', 'player-disconnected', 'player-reconnected',
      'player-ready-changed', 'game-started', 'game-state-update', 'game-ended',
      'game-paused', 'game-reset', 'reconnection-success', 'reconnection-error',
      'heartbeat-ack', 'error',
    ];
    events.forEach(evt => {
      expect(mockSocket.on).toHaveBeenCalledWith(evt, expect.any(Function));
    });
  });

  it('détruit les écouteurs "connect" et "disconnect" au démontage', () => {
    const { unmount } = renderWithRouter();
    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('connect');
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
    expect(mockSocket.off).toHaveBeenCalledTimes(2);
  });
});