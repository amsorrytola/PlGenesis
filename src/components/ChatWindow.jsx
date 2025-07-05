import React from 'react';

const ChatWindow = ({ messages }) => {
  return (
    <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
      {messages.map((msg, idx) => (
        <div key={idx} style={{ marginBottom: '10px' }}>
          <strong>{msg.role === 'user' ? 'You' : 'GPT'}:</strong> {msg.content}
        </div>
      ))}
    </div>
  );
};

export default ChatWindow;
