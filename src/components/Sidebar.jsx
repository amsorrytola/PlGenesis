import React, { useState } from 'react';

const Sidebar = ({
  chats,
  setSelectedChatId,
  selectedChatId,
  onNewChat,
  onCollapse,
  onRename,
  onDelete
}) => {
  const [editingId, setEditingId] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const handleRename = (chatId) => {
    if (newTitle.trim()) {
      onRename(chatId, newTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onNewChat}>New Chat</button>
        <button onClick={onCollapse}>⮘</button>
      </div>
      <h3>Chat History</h3>
      {chats.map((chat) => (
        <div
          key={chat.id}
          style={{
            marginBottom: '8px',
            backgroundColor: chat.id === selectedChatId ? '#eee' : 'transparent',
            padding: '5px'
          }}
        >
          {editingId === chat.id ? (
            <>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%' }}
              />
              <button onClick={() => handleRename(chat.id)}>💾</button>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div
                style={{ cursor: 'pointer', flex: 1 }}
                onClick={() => setSelectedChatId(chat.id)}
              >
                {chat.title}
              </div>
              <div>
                <button onClick={() => { setEditingId(chat.id); setNewTitle(chat.title); }}>✏️</button>
                <button onClick={() => onDelete(chat.id)}>🗑️</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
