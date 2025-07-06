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

  
  const Template = `Extract the stock name, provide its official stock symbol, number of stock user wants to buy, extract the ETH token amount
     user wants to use for the purchase, from the user's message. In <spendAmount> keep only amount , no token symbol.
  
  User message: "{{userMessage}}"
  
  Return in this format:
  <response>
  <stockSym>STOCK_SYMBOL</stockSym>
  <stockNum>STOCK_NUM</stockNum>
  <spendAmount>amount_AVAX</spendAmount>
  </response>
  
  If no stock is mentioned or it's not a stock buying inquiry, return:
  <response>
  <error>Not a stock buy request</error>
  </response>`;
  
  
  export const MintRequestAction: Action = {
    name: 'Buy_Stock',
    similes: ['MINT_REQUEST', 'SEND_STOCK_REQUEST'],
    description: 'Buy any stock using native token.',
  
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
  
        if (!parsed || parsed.error || !parsed.stockSym || !parsed.stockNum || !parsed.spendAmount) {
          return { text: '', data: {}, values: {} };
        }
  
        const stockSym = parsed.stockSym.toUpperCase()
        const stockNum = parsed.stockNum
        const spendAmount = parsed.spendAmount

        try {
            let tx:any;
            (async () => {
              const address = '0xF07CD4F8DFBfE342136470f3355f74909F48b4A7';
              tx =  await ethereum.call({
                      from: address,
                      to :'0x9efdDF960D129fC2FBEc504930D6D3494E7Ca5Bb',
                      method : 'sendMintRequest',
                      args : { uint256: 1, string: 'HCTI' },
                      amount : spendAmount,
                      ret : ['bytes32']
                });
              })();
  
   const resultText = `Sent mint request for ${stockSym} x${stockNum} on sepolia. Transaction hash: ${tx}`;
  
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
        elizaLogger.error('Error in sendMintRequestAction:', err);
        if (callback) {
          callback({ text: `Transaction failed: ${err.message}` });
        }
      }
    }
}