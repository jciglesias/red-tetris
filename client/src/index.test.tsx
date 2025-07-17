import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock des composants pour isoler le test du composant App
jest.mock('./components/Home', () => () => <div data-testid="home-page">Home Page</div>);
jest.mock('./components/GameRoom', () => () => <div data-testid="game-room">Game Room</div>);

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
  })),
}));

jest.mock('./App', () => () => <div data-testid="app-component">App</div>);

describe('index.tsx', () => {
  let mockCreateRoot: jest.Mock;
  let mockRender: jest.Mock;
  let mockGetElementById: jest.SpyInstance<HTMLElement | null, [string]>;

  beforeEach(() => {
    mockRender = jest.fn();
    mockCreateRoot = jest.fn(() => ({ render: mockRender }));
    (ReactDOM.createRoot as jest.Mock) = mockCreateRoot;
    mockGetElementById = jest.spyOn(document, 'getElementById');
    mockGetElementById.mockReturnValue(document.createElement('div'));
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockGetElementById.mockRestore();
  });

  it('should call ReactDOM.createRoot with the root element', () => {
    jest.isolateModules(() => {
      require('./index');
    });
    expect(mockGetElementById).toHaveBeenCalledWith('root');
    expect(mockCreateRoot).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

});

describe('App', () => {
  it('renders Home component on default route', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders GameRoom component on /:roomName/:playerName route', () => {
    render(
      <MemoryRouter initialEntries={["/test-room/test-player"]}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByTestId('game-room')).toBeInTheDocument();
  });
});
