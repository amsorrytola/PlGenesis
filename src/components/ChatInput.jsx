import React, { useState } from 'react';

const ChatInput = ({ onSend }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div style={{ padding: '10px', borderTop: '1px solid #ccc' }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: '80%' }}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend} style={{ marginLeft: '10px' }}>Send</button>
    </div>
  );
};

export default ChatInput;
