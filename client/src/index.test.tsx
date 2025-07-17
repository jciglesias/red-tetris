import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

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
