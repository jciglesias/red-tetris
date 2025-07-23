import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeysModal from './KeysModal';

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

describe('KeysModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Keys button', () => {
    render(<KeysModal />);
    
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    expect(keysButton).toBeInTheDocument();
    expect(keysButton).toHaveClass('modal-button');
  });

  it('should not show modal initially', () => {
    render(<KeysModal />);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should open modal when Keys button is clicked', () => {
    render(<KeysModal />);
    
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    fireEvent.click(keysButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('should display modal title when opened', () => {
    render(<KeysModal />);
    
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    fireEvent.click(keysButton);
    
    expect(screen.getByText('🖮 Keys 🖮')).toBeInTheDocument();
  });

  it('should display all control instructions when modal is opened', () => {
    render(<KeysModal />);
    
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    fireEvent.click(keysButton);
    
    // Check for all control instructions
    expect(screen.getByText('←  Move Left')).toBeInTheDocument();
    expect(screen.getByText('→  Move Right')).toBeInTheDocument();
    expect(screen.getByText('↑  Rotate')).toBeInTheDocument();
    expect(screen.getByText('s  Skip (once)')).toBeInTheDocument();
    expect(screen.getByText('↓  Soft Drop')).toBeInTheDocument();
    expect(screen.getByText('__ Hard Drop')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(<KeysModal />);
    
    // Open modal
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    fireEvent.click(keysButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('should apply correct styles to the title', () => {
    render(<KeysModal />);
    
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    fireEvent.click(keysButton);
    
    const title = screen.getByText('🖮 Keys 🖮');
    expect(title).toHaveStyle({
      textAlign: 'center',
      marginBottom: '20px',
      color: '#333',
      fontSize: '24px'
    });
  });

  it('should have correct grid layout for controls', () => {
    render(<KeysModal />);
    
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    fireEvent.click(keysButton);
    
    // Check that all control items are rendered as h3 elements with correct styles
    const controlItems = screen.getAllByRole('heading', { level: 3 });
    expect(controlItems).toHaveLength(6);
    
    controlItems.forEach(item => {
      expect(item).toHaveStyle({
        margin: '0 0 10px 0',
        color: '#333'
      });
    });
  });

  it('should maintain modal state correctly', () => {
    render(<KeysModal />);
    
    // Initially closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    
    // Open modal
    const keysButton = screen.getByRole('button', { name: 'Keys' });
    fireEvent.click(keysButton);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    // Close modal
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    
    // Open again
    fireEvent.click(keysButton);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('should render with correct container structure', () => {
    const { container } = render(<KeysModal />);
    
    // Check for main container div
    const mainDiv = container.firstChild;
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toContainElement(screen.getByRole('button', { name: 'Keys' }));
  });
});
