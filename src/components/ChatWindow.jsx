import React from 'react';

const ChatWindow = ({ messages, loading }) => {
  return (
    <div style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
      {messages.map((msg, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '10px'
          }}
        >
          <div
            style={{
              backgroundColor: msg.role === 'user' ? '#cce5ff' : '#f2f2f2',
              padding: '10px',
              borderRadius: '10px',
              maxWidth: '60%'
            }}
          >
            <strong>{msg.role === 'user' ? 'You' : 'GPT'}:</strong> {msg.content}
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ textAlign: 'left', fontStyle: 'italic', color: 'gray' }}>
          GPT is typing...
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
