import {
  IAgentRuntime,
  Provider,
  ProviderResult,
  Memory,
  State,
  elizaLogger,
} from '@elizaos/core';

import { createPublicClient,http } from 'viem';

export const stockHoldings: Provider = {
  name: 'stockHoldings',
  description: 'A provider for getting stock holdings',

  get: async (
    runtime: IAgentRuntime,
    _message: Memory,
    state: State
  ): Promise<ProviderResult> => {

    const rpc = "https://sepolia.drpc.org";

    const publicClient = createPublicClient({ 
        transport: http(rpc)
        });

    const address ='0xF07CD4F8DFBfE342136470f3355f74909F48b4A7';
    const abi = [
      {
        "inputs": [{ "internalType": "address", "name": "holder", "type": "address" }],
        "name": "getStockHoldings",
        "outputs": [{ "internalType": "string[]", "name": "", "type": "string[]" }],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "holder", "type": "address" },
          { "internalType": "string", "name": "stockName", "type": "string" }
        ],
        "name": "totalHoldings",
        "outputs": [{ "internalType": "uint256", "name": "stockNum", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    const contractAddress = '0x9efddf960d129fc2fbec504930d6d3494e7ca5bb';

    try {
      const rawHoldings = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName: 'getStockHoldings',
        args: [address],
      }) as string[];

      const uniqueHoldings = Array.from(new Set(rawHoldings));

      const stockQuantities: Record<string, string> = {};

      for (const stock of uniqueHoldings) {
        const amount = await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: 'totalHoldings',
          args: [address, stock],
        }) as bigint;

        stockQuantities[stock] = amount.toString();
      }

      return {
        text: `You hold ${uniqueHoldings.length} stock(s): ${uniqueHoldings.map(s => `${s} (${stockQuantities[s]})`).join(', ')}`,
        values: {
          count: uniqueHoldings.length,
        },
        data: {
          stocks: stockQuantities,
        },
      };
    } catch (err: any) {
      elizaLogger.error('Error reading contract: ' + err.message);
      return {
        text: 'Failed to fetch stock holdings.',
        values: {},
        data: {},
      };
    }
  }
};