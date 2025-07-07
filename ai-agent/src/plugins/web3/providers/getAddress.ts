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

export const getAddress:Provider={
    name: 'Wallet Address Provider',
    description: 'A provider for getting wallet address',

    get: async (
      runtime: IAgentRuntime,
      _message: Memory,
      state: State
    ): Promise<ProviderResult> => {

        const nearAccount =  account.accountId;
        const EthAddress ="0xF07CD4F8DFBfE342136470f3355f74909F48b4A7"

        const addresses = [
            {
                chain: 'near testnet',
                address: nearAccount,
            },
            {
                chain: 'sepolia',
                address: EthAddress,
            },
        ];

        const agentName = state?.agentName || 'The agent'
        return {
            text: `${agentName} has the following addresses: ${addresses.map(b => `${b.chain}: ${b.address}`).join(', ')}`,
            values: {
            },
            data: {
            },
          };
    }
}