import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from './Modal';

describe('Modal Component', () => {
  const mockOnClose = jest.fn();
  const testContent = <div>Test Modal Content</div>;

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    expect(screen.queryByText('Test Modal Content')).not.toBeInTheDocument();
    expect(screen.queryByText('×')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('should render children content correctly', () => {
    const complexContent = (
      <div>
        <h2>Modal Title</h2>
        <p>Modal description</p>
        <button>Action Button</button>
      </div>
    );

    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        {complexContent}
      </Modal>
    );

    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal description')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should have correct styling and structure', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    // Check if the backdrop exists
    const modalContent = screen.getByText('Test Modal Content').parentElement;
    const backdrop = modalContent?.parentElement;
    expect(backdrop).toHaveStyle({
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '9999'
    });

    // Check if the modal content container exists
    expect(modalContent).toHaveStyle({
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '5px',
      maxWidth: '500px',
      width: '100%'
    });
  });

  it('should handle multiple renders correctly', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    expect(screen.queryByText('Test Modal Content')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();

    rerender(
      <Modal isOpen={false} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    expect(screen.queryByText('Test Modal Content')).not.toBeInTheDocument();
  });

  it('should handle empty children', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        {null}
      </Modal>
    );

    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('should handle different onClose functions', () => {
    const firstOnClose = jest.fn();
    const secondOnClose = jest.fn();

    const { rerender } = render(
      <Modal isOpen={true} onClose={firstOnClose}>
        {testContent}
      </Modal>
    );

    fireEvent.click(screen.getByText('×'));
    expect(firstOnClose).toHaveBeenCalledTimes(1);
    expect(secondOnClose).not.toHaveBeenCalled();

    rerender(
      <Modal isOpen={true} onClose={secondOnClose}>
        {testContent}
      </Modal>
    );

    fireEvent.click(screen.getByText('×'));
    expect(firstOnClose).toHaveBeenCalledTimes(1);
    expect(secondOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle close button hover effects', () => {
    const mockOnClose = jest.fn();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Test Modal</div>
      </Modal>
    );
    
    const closeButton = screen.getByText('×');
    
    // Test hover enter
    fireEvent.mouseEnter(closeButton);
    
    // Check if style changes (hover effects applied)
    expect(closeButton).toHaveStyle('background: #d32f2f');
    expect(closeButton).toHaveStyle('transform: scale(1.1)');
    
    // Test hover leave  
    fireEvent.mouseLeave(closeButton);
    
    // Check if style reverts
    expect(closeButton).toHaveStyle('background: #f44336');
    expect(closeButton).toHaveStyle('transform: scale(1)');
  });

  it('should handle overlay click to close modal', () => {
    const mockOnClose = jest.fn();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <div>Test Modal</div>
      </Modal>
    );
    
    // Click on the overlay (not the modal content)
    const overlay = screen.getByText('Test Modal').parentElement?.parentElement;
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    // Modal should not close by clicking content area, only close button should work
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
