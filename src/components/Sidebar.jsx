import React from 'react';

const Sidebar = ({ chats, setSelectedChatId }) => {
  return (
    <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>
      <h3>Chat History</h3>
      {chats.map(chat => (
        <div key={chat.id} onClick={() => setSelectedChatId(chat.id)} style={{ cursor: 'pointer', marginBottom: '10px' }}>
          {chat.title}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
