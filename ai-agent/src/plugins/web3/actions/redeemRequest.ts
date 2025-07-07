import {
    type Action,
    AgentRuntime,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    type State,
    elizaLogger,
    ModelType,
    parseKeyValueXml,
  } from '@elizaos/core';
  import {
    parseEther,
    encodeFunctionData,
    Chain,
  } from 'viem';

  import ethereum from "../ethereum.ts"

  
  const Template = `Extract the stock name, provide its official stock symbol, number of stock user wants to sell, from the user's message.
  
  User message: "{{userMessage}}"
  
  Return in this format:
  <response>
  <stockSym>STOCK_SYMBOL</stockSym>
  <stockNum>STOCK_NUM</stockNum>
  </response>
  
  If no stock or no sell is mentioned or it's not a stock selling inquiry, return:
  <response>
  <error>Not a stock sell request</error>
  </response>`;
  
  
  export const RedeemRequestAction: Action = {
    name: 'Sell_Stock',
    similes: ['Redeem_REQUEST', 'SEND_STOCK_SELL_REQUEST'],
    description: 'Sell any stock using native token.',
  
    validate: async (_runtime, _message, _state) => true,
  
    handler: async (
      runtime: IAgentRuntime,
      message: Memory,
      state: State | undefined,
      _options: any,
      callback?: HandlerCallback
    ) => {
      if (!state) {
        state = (await runtime.composeState(message)) as State;
      }
  
      const prompt = Template.replace('{{userMessage}}', message.content.text || '');
  
      const response = await runtime.useModel(ModelType.TEXT_SMALL, {
        prompt
      })
  
  
      console.log("response",response)
  
      const parsed = parseKeyValueXml(response);
  
        if (!parsed || parsed.error || !parsed.stockSym || !parsed.stockNum) {
          return { text: '', data: {}, values: {} };
        }
  
        const stockSym = parsed.stockSym.toUpperCase()
        const stockNum = parsed.stockNum


        try {
              const address = '0xF07CD4F8DFBfE342136470f3355f74909F48b4A7';
              const tx =  await ethereum.call({
                      from: address,
                      to :'0x9efdDF960D129fC2FBEc504930D6D3494E7Ca5Bb',
                      method : 'sendRedeemRequest',
                      args : { uint256: stockNum, string: stockSym },
                      amount : '0',
                      ret : ['bytes32']
                });
  
   const resultText = `Sent redeem request for ${stockSym} x${stockNum} on sepolia. Transaction hash: ${tx}`;
  
        if (callback) {
          callback({
            text: resultText,
            content: { tx, stockSym, stockNum }
          });
        }
  
        return {
          text: resultText,
          content: { tx, stockSym, stockNum }
        };
      } catch (err) {
        elizaLogger.error('Error in sendRedeemRequestAction:', err);
        if (callback) {
          callback({ text: `Transaction failed: ${err.message}` });
        }
      }
    }
}