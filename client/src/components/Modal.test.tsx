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
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        {testContent}
      </Modal>
    );

    expect(screen.getByText('Test Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
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

    const closeButton = screen.getByText('Close');
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
    const backdrop = screen.getByText('Test Modal Content').closest('div')?.parentElement;
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
    const modalContent = screen.getByText('Test Modal Content').closest('div');
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

    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('should handle different onClose functions', () => {
    const firstOnClose = jest.fn();
    const secondOnClose = jest.fn();

    const { rerender } = render(
      <Modal isOpen={true} onClose={firstOnClose}>
        {testContent}
      </Modal>
    );

    fireEvent.click(screen.getByText('Close'));
    expect(firstOnClose).toHaveBeenCalledTimes(1);
    expect(secondOnClose).not.toHaveBeenCalled();

    rerender(
      <Modal isOpen={true} onClose={secondOnClose}>
        {testContent}
      </Modal>
    );

    fireEvent.click(screen.getByText('Close'));
    expect(firstOnClose).toHaveBeenCalledTimes(1);
    expect(secondOnClose).toHaveBeenCalledTimes(1);
  });
});
