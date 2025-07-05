import React from 'react';

const ConnectWallet = ({ walletAddress, setWalletAddress }) => {
  const connect = async () => {
    if (!window.ethereum) return alert('MetaMask not found');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setWalletAddress(accounts[0]);
  };

  return (
    <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      {walletAddress ? (
        <span>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  );
};

export default ConnectWallet;
