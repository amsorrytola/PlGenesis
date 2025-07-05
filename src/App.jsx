import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ConnectWallet from './components/ConnectWallet';

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const handleNewMessage = async (message) => {
    const chatId = selectedChatId || `chat-${Date.now()}`;
    const newEntry = { role: 'user', content: message };
    const updatedChats = [...(chats.find(c => c.id === chatId)?.messages || []), newEntry];

    setChats(prev =>
      prev.some(c => c.id === chatId)
        ? prev.map(c => c.id === chatId ? { ...c, messages: updatedChats } : c)
        : [...prev, { id: chatId, title: message.slice(0, 20), messages: updatedChats }]
    );
    setSelectedChatId(chatId);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updatedChats }),
    });
    const data = await response.json();

    const updatedWithBot = [...updatedChats, { role: 'assistant', content: data.reply }];
    setChats(prev =>
      prev.map(c => c.id === chatId ? { ...c, messages: updatedWithBot } : c)
    );
  };

  const selectedMessages = chats.find(c => c.id === selectedChatId)?.messages || [];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar chats={chats} setSelectedChatId={setSelectedChatId} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ConnectWallet setWalletAddress={setWalletAddress} walletAddress={walletAddress} />
        <ChatWindow messages={selectedMessages} />
        <ChatInput onSend={handleNewMessage} />
      </div>
    </div>
  );
};

export default App;
