import React, { useState } from 'react';
import Modal from './Modal';

const KeysModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div>
      <button className="modal-button" onClick={handleOpenModal}>Keys</button>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#333',
          fontSize: '24px'
        }}>
            🖮 Keys 🖮
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>←  Move Left</h3>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>→  Move Right</h3>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>↑  Rotate</h3>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>s  Skip (once)</h3>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>↓  Soft Drop</h3>
          </div>
          <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>__ Hard Drop</h3>
          </div>
        </div>
      </div>
      </Modal>
    </div>
  );
};

export default KeysModal;
