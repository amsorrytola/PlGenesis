import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ConnectWallet from './components/ConnectWallet';

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  const getChatIndex = (id) => chats.findIndex((c) => c.id === id);

  const handleNewMessage = async (message) => {
    let chatId = selectedChatId;

    if (!chatId) {
      chatId = `chat-${Date.now()}`;
      const newChat = {
        id: chatId,
        title: message.slice(0, 20),
        messages: [],
        lastUpdated: Date.now()
      };
      setChats((prev) => [newChat, ...prev]);
      setSelectedChatId(chatId);
    }

    // Add user message
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, { role: 'user', content: message }],
              title: c.messages.length === 0 ? message.slice(0, 20) : c.title,
              lastUpdated: Date.now()
            }
          : c
      )
    );

    setLoading(true);

    // Simulate GPT delay
    setTimeout(() => {
      setChats((prev) => {
        const updated = prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { role: 'assistant', content: 'This is a test reply from GPT.' }
                ],
                lastUpdated: Date.now()
              }
            : c
        );

        // Move updated chat to top
        updated.sort((a, b) => b.lastUpdated - a.lastUpdated);
        return updated;
      });

      setLoading(false);
    }, 2000);
  };

  const handleNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat = { id: newId, title: 'New Chat', messages: [], lastUpdated: Date.now() };
    setChats((prev) => [newChat, ...prev]);
    setSelectedChatId(newId);
  };

  const handleRenameChat = (chatId, newTitle) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
    );
  };

  const handleDeleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (chatId === selectedChatId) setSelectedChatId(null);
  };

  const selectedMessages = chats.find((c) => c.id === selectedChatId)?.messages || [];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {!sidebarCollapsed && (
        <Sidebar
          chats={chats}
          setSelectedChatId={setSelectedChatId}
          selectedChatId={selectedChatId}
          onNewChat={handleNewChat}
          onCollapse={() => setSidebarCollapsed(true)}
          onRename={handleRenameChat}
          onDelete={handleDeleteChat}
        />
      )}
      {sidebarCollapsed && (
        <div style={{ width: '40px', padding: '10px' }}>
          <button onClick={() => setSidebarCollapsed(false)}>&gt;</button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ConnectWallet setWalletAddress={setWalletAddress} walletAddress={walletAddress} />
        <ChatWindow messages={selectedMessages} loading={loading} />
        <ChatInput onSend={handleNewMessage} />
      </div>
    </div>
  );
};

export default App;
