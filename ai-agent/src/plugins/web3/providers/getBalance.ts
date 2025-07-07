import {
    IAgentRuntime,
    Provider,
    ProviderResult,
    Memory,
    State,
    elizaLogger,
} from '@elizaos/core';

import * as nearAPI from 'near-api-js';

import { formatEther } from 'viem';
import ethereum from '../ethereum';
import {account} from '../nearWallet'



export const getBalance:Provider={
    name: 'WalletBalanceProvider',
    description: 'A provider for getting wallet balance',

    get: async (
      runtime: IAgentRuntime,
      _message: Memory,
      state: State
    ): Promise<ProviderResult> => {

        const nearBalance = await account.getAccountBalance();
        const ethereumBlance = await ethereum.getBalance({
            address: "0xF07CD4F8DFBfE342136470f3355f74909F48b4A7",
        });

        const balances = [
            {
                chain: 'near testnet',
                balance: `${nearAPI.utils.format.formatNearAmount(nearBalance.available)} NEAR`,
            },
            {
                chain: 'sepolia',
                balance: `${formatEther(BigInt(ethereumBlance.toString()))} ETH`,
            },
        ];

        const agentName = state?.agentName || 'The agent'
        return {
            text: `${agentName} has the following balances: ${balances.map(b => `${b.chain}: ${b.balance}`).join(', ')}`,
            values: {
            },
            data: {
            },
          };
    }
}