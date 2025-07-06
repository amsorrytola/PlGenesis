// src/index.ts
import {
  logger
} from "@elizaos/core";

// src/plugins/web3/actions/mintRequest.ts
import {
  elizaLogger,
  ModelType,
  parseKeyValueXml
} from "@elizaos/core";

// src/plugins/web3/ethereum.ts
import { readFileSync } from "fs";
import { ethers } from "ethers";
import BN2 from "bn.js";

// src/plugins/web3/nearWallet.ts
import * as nearAPI from "near-api-js";
import { BN } from "bn.js";
import dotenv from "dotenv";
dotenv.config();
var {
  Near,
  Account,
  keyStores,
  KeyPair,
  transactions: { functionCall }
} = nearAPI;
var {
  MPC_CONTRACT_ID,
  NEAR_ACCOUNT_ID,
  NEAR_PRIVATE_KEY,
  NEAR_PROXY_ACCOUNT,
  NEAR_PROXY_CONTRACT,
  NEAR_PROXY_ACCOUNT_ID,
  NEAR_PROXY_PRIVATE_KEY
} = process.env;
var accountId = NEAR_ACCOUNT_ID;
var contractId = MPC_CONTRACT_ID;
var privateKey = NEAR_PRIVATE_KEY;
var keyStore = new keyStores.InMemoryKeyStore();
keyStore.setKey("testnet", accountId, KeyPair.fromString(privateKey));
console.log("Near Chain Signature (NCS) call details:");
console.log("Near accountId", accountId);
console.log("NCS contractId", contractId);
var config = {
  networkId: "testnet",
  keyStore,
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://testnet.mynearwallet.com/",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://testnet.nearblocks.io"
};
var near = new Near(config);
var account = new Account(near.connection, accountId);
async function sign(payload, path) {
  const {
    Near: Near2,
    Account: Account2,
    keyStores: keyStores2,
    KeyPair: KeyPair2,
    transactions: { functionCall: functionCall2 }
  } = nearAPI;
  const {
    MPC_CONTRACT_ID: MPC_CONTRACT_ID2,
    NEAR_ACCOUNT_ID: NEAR_ACCOUNT_ID2,
    NEAR_PRIVATE_KEY: NEAR_PRIVATE_KEY2,
    NEAR_PROXY_ACCOUNT: NEAR_PROXY_ACCOUNT2,
    NEAR_PROXY_CONTRACT: NEAR_PROXY_CONTRACT3,
    NEAR_PROXY_ACCOUNT_ID: NEAR_PROXY_ACCOUNT_ID2,
    NEAR_PROXY_PRIVATE_KEY: NEAR_PROXY_PRIVATE_KEY2
  } = process.env;
  const accountId2 = NEAR_ACCOUNT_ID2;
  const contractId2 = MPC_CONTRACT_ID2;
  const privateKey2 = NEAR_PRIVATE_KEY2;
  const keyStore2 = new keyStores2.InMemoryKeyStore();
  keyStore2.setKey("testnet", accountId2, KeyPair2.fromString(privateKey2));
  console.log("Near Chain Signature (NCS) call details:");
  console.log("Near accountId", accountId2);
  console.log("NCS contractId", contractId2);
  const config2 = {
    networkId: "testnet",
    keyStore: keyStore2,
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://testnet.mynearwallet.com/",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://testnet.nearblocks.io"
  };
  const near2 = new Near2(config2);
  const account2 = new Account2(near2.connection, accountId2);
  const args = {
    request: {
      payload,
      path,
      key_version: 0
    }
  };
  let attachedDeposit = nearAPI.utils.format.parseNearAmount("1");
  if (!contractId2 || !attachedDeposit) {
    throw new Error(`Missing environment variables: MPC_CONTRACT_ID or attachedDeposit`);
  }
  console.log(
    "sign payload",
    payload.length > 200 ? payload.length : payload.toString()
  );
  console.log("with path", path);
  console.log("this may take approx. 30 seconds to complete");
  console.log("argument to sign: ", args);
  let res;
  try {
    res = await account2.functionCall({
      contractId: contractId2,
      methodName: "sign",
      args,
      gas: new BN("300000000000000"),
      attachedDeposit: new BN(attachedDeposit)
    });
  } catch (e) {
    throw new Error(`error signing ${JSON.stringify(e)}`);
  }
  if ("SuccessValue" in res.status) {
    const successValue = res.status.SuccessValue;
    const decodedValue = Buffer.from(successValue, "base64").toString();
    console.log("decoded value: ", decodedValue);
    const { big_r, s: S, recovery_id } = JSON.parse(decodedValue);
    const r = Buffer.from(big_r.affine_point.substring(2), "hex");
    const s = Buffer.from(S.scalar, "hex");
    return {
      r,
      s,
      v: recovery_id
    };
  } else {
    throw new Error(`error signing ${JSON.stringify(res)}`);
  }
}
async function signWithTimeout(payload, path, timeoutMs = 12e4) {
  return Promise.race([
    sign(payload, path),
    // your real async function
    new Promise(
      (_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeoutMs} ms`)), timeoutMs)
    )
  ]);
}

// src/plugins/web3/ethereum.ts
var { MPC_PATH, NEAR_PROXY_CONTRACT: NEAR_PROXY_CONTRACT2 } = process.env;
var ethereum = {
  name: "Sepolia",
  chainId: 11155111,
  currency: "ETH",
  explorer: "https://sepolia.etherscan.io",
  gasLimit: 21e3,
  getGasPrice: async () => {
    const provider = getSepoliaProvider();
    const feeData = await provider.getFeeData();
    return feeData.gasPrice.toString();
  },
  getBalance: async ({ address }) => await getSepoliaProvider().getBalance(address),
  send: async ({
    from: address,
    to = "0x525521d79134822a342d330bd91DA67976569aF1",
    amount = "0.001"
  }) => {
    if (!address) return console.log("must provide a sending address");
    const {
      getGasPrice,
      gasLimit,
      chainId,
      getBalance,
      completeEthereumTx,
      currency
    } = ethereum;
    const balance = await getBalance({ address });
    console.log("balance", ethers.utils.formatUnits(balance), currency);
    const provider = getSepoliaProvider();
    const nonce = await provider.getTransactionCount(address);
    const gasPrice = await getGasPrice();
    const value = ethers.utils.hexlify(ethers.utils.parseUnits(amount));
    if (value === "0x00") {
      console.log("Amount is zero. Please try a non-zero amount.");
    }
    const overrideBalanceCheck = true;
    if (!overrideBalanceCheck && (!balance || new BN2(balance.toString()).lt(
      new BN2(ethers.utils.parseUnits(amount).toString()).add(
        new BN2(gasPrice).mul(new BN2(gasLimit.toString()))
      )
    ))) {
      return console.log("insufficient funds");
    }
    console.log("sending", amount, currency, "from", address, "to", to);
    const baseTx = {
      to,
      nonce: ethers.utils.hexlify(nonce),
      data: "0x",
      // empty calldata, must be a hex string not []
      value,
      // already hex
      gasLimit: ethers.utils.hexlify(gasLimit),
      gasPrice: ethers.utils.hexlify(ethers.BigNumber.from(gasPrice)),
      chainId
    };
    await completeEthereumTx({ address, baseTx });
  },
  deployContract: async ({ from: address, path = "./contracts/nft.bin" }) => {
    const { explorer, getGasPrice, completeEthereumTx, chainId } = ethereum;
    const bytes = readFileSync(path, "utf8");
    const provider = getSepoliaProvider();
    const nonce = await provider.getTransactionCount(address);
    const contractAddress = ethers.utils.getContractAddress({
      from: address,
      nonce
    });
    console.log(
      "deploying bytes",
      bytes.length,
      "to address",
      contractAddress
    );
    const gasPrice = await getGasPrice();
    const baseTx = {
      nonce,
      data: bytes,
      value: 0,
      gasLimit: 6e6,
      // 6m gas
      gasPrice,
      chainId
    };
    await completeEthereumTx({ address, baseTx });
    console.log("contract deployed successfully to address:");
    console.log(contractAddress);
    console.log("explorer link", `${explorer}/address/${contractAddress}`);
  },
  view: async ({
    to = "0x09a1a4e1cfca73c2e4f6599a7e6b98708fda2664",
    method = "balanceOf",
    args = { address: "0x525521d79134822a342d330bd91da67976569af1" },
    ret = ["uint256"]
  }) => {
    const provider = getSepoliaProvider();
    console.log("view contract", to);
    const { data, iface } = encodeData({ method, args, ret });
    const res = await provider.call({
      to,
      data
    });
    const decoded = iface.decodeFunctionResult(method, res);
    console.log("view result", decoded.toString());
  },
  call: async ({
    from: address,
    to = "0x09a1a4e1cfca73c2e4f6599a7e6b98708fda2664",
    method = "mint",
    args = {},
    amount = "0.01",
    ret = []
  }) => {
    const { getGasPrice, completeEthereumTx, chainId } = ethereum;
    const provider = getSepoliaProvider();
    console.log("call contract", to);
    const { data } = encodeData({ method, args, ret });
    const gasPrice = await getGasPrice();
    const nonce = await provider.getTransactionCount(address);
    const baseTx = {
      to,
      nonce: ethers.utils.hexlify(nonce),
      data,
      value: ethers.utils.hexlify(ethers.utils.parseUnits(amount)),
      gasLimit: 1e6,
      // 1m
      gasPrice: ethers.utils.hexlify(ethers.BigNumber.from(gasPrice)),
      chainId
    };
    const tx = await completeEthereumTx({ address, baseTx });
    return tx;
  },
  completeEthereumTx: async ({ address, baseTx }) => {
    const { chainId, getBalance, explorer, currency } = ethereum;
    const unsignedTx = ethers.utils.serializeTransaction(baseTx);
    const txHash = ethers.utils.keccak256(unsignedTx);
    const payload = Object.values(ethers.utils.arrayify(txHash));
    let sig;
    if (NEAR_PROXY_CONTRACT2 === "true") {
      sig = await sign(unsignedTx, MPC_PATH);
    } else {
      sig = await signWithTimeout(payload, MPC_PATH);
    }
    if (!sig) return;
    sig.r = "0x" + sig.r.toString("hex");
    sig.s = "0x" + sig.s.toString("hex");
    let addressRecovered = false;
    for (let v = 0; v < 2; v++) {
      sig.v = v + chainId * 2 + 35;
      const recoveredAddress = ethers.utils.recoverAddress(payload, sig);
      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        addressRecovered = true;
        break;
      }
    }
    if (!addressRecovered) {
      return console.log(
        "signature failed to recover correct sending address"
      );
    }
    try {
      const hash = await getSepoliaProvider().send(
        "eth_sendRawTransaction",
        [ethers.utils.serializeTransaction(baseTx, sig)]
      );
      console.log("tx hash", hash);
      console.log("explorer link", `${explorer}/tx/${hash}`);
      return hash;
      console.log("fetching updated balance in 60s...");
      setTimeout(async () => {
        const balance = await getBalance({ address });
        console.log(
          "balance",
          ethers.utils.formatUnits(balance),
          currency
        );
      }, 6e4);
    } catch (e) {
      if (/nonce too low/gi.test(JSON.stringify(e))) {
        return console.log("tx has been tried");
      }
      if (/gas too low|underpriced/gi.test(JSON.stringify(e))) {
        return console.log(e);
      }
      console.log(e);
    }
  }
};
var encodeData = ({ method, args, ret }) => {
  const abi = [
    `function ${method}(${Object.keys(args).join(",")}) returns (${ret.join(
      ","
    )})`
  ];
  const iface = new ethers.utils.Interface(abi);
  const allArgs = [];
  const argValues = Object.values(args);
  for (let i = 0; i < argValues.length; i++) {
    allArgs.push(argValues[i]);
  }
  console.log(abi[0], "with args", allArgs);
  return {
    iface,
    data: iface.encodeFunctionData(method, allArgs)
  };
};
var getSepoliaProvider = () => {
  return new ethers.providers.JsonRpcProvider(
    "https://ethereum-sepolia.publicnode.com"
  );
};
var ethereum_default = ethereum;

// src/plugins/web3/actions/mintRequest.ts
var Template = `Extract the stock name, provide its official stock symbol, number of stock user wants to buy, extract the ETH token amount
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
var MintRequestAction = {
  name: "Buy_Stock",
  similes: ["MINT_REQUEST", "SEND_STOCK_REQUEST"],
  description: "Buy any stock using native token.",
  validate: async (_runtime, _message, _state) => true,
  handler: async (runtime, message, state, _options, callback) => {
    if (!state) {
      state = await runtime.composeState(message);
    }
    const prompt = Template.replace("{{userMessage}}", message.content.text || "");
    const response = await runtime.useModel(ModelType.TEXT_SMALL, {
      prompt
    });
    console.log("response", response);
    const parsed = parseKeyValueXml(response);
    if (!parsed || parsed.error || !parsed.stockSym || !parsed.stockNum || !parsed.spendAmount) {
      return { text: "", data: {}, values: {} };
    }
    const stockSym = parsed.stockSym.toUpperCase();
    const stockNum = parsed.stockNum;
    const spendAmount = parsed.spendAmount;
    try {
      const address = "0xF07CD4F8DFBfE342136470f3355f74909F48b4A7";
      const tx = await ethereum_default.call({
        from: address,
        to: "0x9efdDF960D129fC2FBEc504930D6D3494E7Ca5Bb",
        method: "sendMintRequest",
        args: { uint256: stockNum, string: stockSym },
        amount: spendAmount,
        ret: ["bytes32"]
      });
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
      elizaLogger.error("Error in sendMintRequestAction:", err);
      if (callback) {
        callback({ text: `Transaction failed: ${err.message}` });
      }
    }
  }
};

// src/plugins/web3/index.ts
var web3Plugin = {
  name: "web3",
  description: "Web3 plugin for interacting with EVM chains",
  actions: [MintRequestAction],
  providers: []
};

// src/index.ts
var character = {
  name: "NEARAI",
  plugins: [
    "@elizaos/plugin-sql",
    ...process.env.ANTHROPIC_API_KEY ? ["@elizaos/plugin-anthropic"] : [],
    ...process.env.OPENAI_API_KEY ? ["@elizaos/plugin-openai"] : [],
    ...!process.env.OPENAI_API_KEY ? ["@elizaos/plugin-local-ai"] : [],
    ...process.env.DISCORD_API_TOKEN ? ["@elizaos/plugin-discord"] : [],
    ...process.env.TWITTER_API_KEY && process.env.TWITTER_API_SECRET_KEY && process.env.TWITTER_ACCESS_TOKEN && process.env.TWITTER_ACCESS_TOKEN_SECRET ? ["@elizaos/plugin-twitter"] : [],
    ...process.env.TELEGRAM_BOT_TOKEN ? ["@elizaos/plugin-telegram"] : [],
    ...!process.env.IGNORE_BOOTSTRAP ? ["@elizaos/plugin-bootstrap"] : []
  ],
  settings: {
    secrets: {}
  },
  system: "Respond to all messages in a helpful, conversational manner. Provide assistance on a wide range of topics, using knowledge when needed. Be concise but thorough, friendly but professional. Use humor when appropriate and be empathetic to user needs. Provide valuable information and insights when questions are asked.",
  bio: [
    "Engages with all types of questions and conversations",
    "Provides helpful, concise responses",
    "Uses knowledge resources effectively when needed",
    "Balances brevity with completeness",
    "Uses humor and empathy appropriately",
    "Adapts tone to match the conversation context",
    "Offers assistance proactively",
    "Communicates clearly and directly"
  ],
  topics: [
    "general knowledge and information",
    "problem solving and troubleshooting",
    "technology and software",
    "community building and management",
    "business and productivity",
    "creativity and innovation",
    "personal development",
    "communication and collaboration",
    "education and learning",
    "entertainment and media"
  ],
  messageExamples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "This user keeps derailing technical discussions with personal problems."
        }
      },
      {
        name: "Eliza",
        content: {
          text: "DM them. Sounds like they need to talk about something else."
        }
      },
      {
        name: "{{name1}}",
        content: {
          text: "I tried, they just keep bringing drama back to the main channel."
        }
      },
      {
        name: "Eliza",
        content: {
          text: "Send them my way. I've got time today."
        }
      }
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "I can't handle being a mod anymore. It's affecting my mental health."
        }
      },
      {
        name: "Eliza",
        content: {
          text: "Drop the channels. You come first."
        }
      },
      {
        name: "{{name1}}",
        content: {
          text: "But who's going to handle everything?"
        }
      },
      {
        name: "Eliza",
        content: {
          text: "We will. Take the break. Come back when you're ready."
        }
      }
    ]
  ],
  style: {
    all: [
      "Keep responses concise but informative",
      "Use clear and direct language",
      "Be engaging and conversational",
      "Use humor when appropriate",
      "Be empathetic and understanding",
      "Provide helpful information",
      "Be encouraging and positive",
      "Adapt tone to the conversation",
      "Use knowledge resources when needed",
      "Respond to all types of questions"
    ],
    chat: [
      "Be conversational and natural",
      "Engage with the topic at hand",
      "Be helpful and informative",
      "Show personality and warmth"
    ]
  }
};
var initCharacter = ({ runtime }) => {
  logger.info("Initializing character");
  logger.info("Name: ", character.name);
};
var projectAgent = {
  character,
  init: async (runtime) => await initCharacter({ runtime }),
  plugins: [web3Plugin]
};
var project = {
  agents: [projectAgent]
};
var src_default = project;

export {
  character,
  projectAgent,
  src_default
};
//# sourceMappingURL=chunk-MLT6JNWI.js.map