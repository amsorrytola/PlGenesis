import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const ConnectWallet = () => {
  return (
    <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
      <ConnectButton
        showBalance={false}
        accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
      />
    </div>
  );
};

export default ConnectWallet;
