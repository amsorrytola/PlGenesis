import * as nearAPI from 'near-api-js';
import { BN } from 'bn.js';
import dotenv from 'dotenv';
dotenv.config();
const {
    Near,
    Account,
    keyStores,
    KeyPair,
    transactions: { functionCall },
} = nearAPI;
const {
    MPC_CONTRACT_ID,
    NEAR_ACCOUNT_ID,
    NEAR_PRIVATE_KEY,
    NEAR_PROXY_ACCOUNT,
    NEAR_PROXY_CONTRACT,
    NEAR_PROXY_ACCOUNT_ID,
    NEAR_PROXY_PRIVATE_KEY,
} = process.env;

const accountId =NEAR_ACCOUNT_ID;
const contractId = MPC_CONTRACT_ID;
const privateKey = NEAR_PRIVATE_KEY;
const keyStore = new keyStores.InMemoryKeyStore();
keyStore.setKey('testnet', accountId, KeyPair.fromString(privateKey));

console.log('Near Chain Signature (NCS) call details:');
console.log('Near accountId', accountId);
console.log('NCS contractId', contractId);

const config = {
    networkId: 'testnet',
    keyStore: keyStore,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://testnet.mynearwallet.com/',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://testnet.nearblocks.io',
};
export const near = new Near(config);
export const account = new Account(near.connection, accountId);

export async function sign(payload:any, path:any) {

    const {
        Near,
        Account,
        keyStores,
        KeyPair,
        transactions: { functionCall },
    } = nearAPI;
    const {
        MPC_CONTRACT_ID,
        NEAR_ACCOUNT_ID,
        NEAR_PRIVATE_KEY,
        NEAR_PROXY_ACCOUNT,
        NEAR_PROXY_CONTRACT,
        NEAR_PROXY_ACCOUNT_ID,
        NEAR_PROXY_PRIVATE_KEY,
    } = process.env;
    
    const accountId =NEAR_ACCOUNT_ID;
    const contractId = MPC_CONTRACT_ID;
    const privateKey = NEAR_PRIVATE_KEY;
    const keyStore = new keyStores.InMemoryKeyStore();
    keyStore.setKey('testnet', accountId, KeyPair.fromString(privateKey));
    
    console.log('Near Chain Signature (NCS) call details:');
    console.log('Near accountId', accountId);
    console.log('NCS contractId', contractId);

    const config = {
        networkId: 'testnet',
        keyStore: keyStore,
        nodeUrl: 'https://rpc.testnet.near.org',
        walletUrl: 'https://testnet.mynearwallet.com/',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://testnet.nearblocks.io',
    };

     const near = new Near(config);
     const account = new Account(near.connection, accountId);
    const args = {
        request: {
            payload,
            path,
            key_version: 0,
        },
    };
    let attachedDeposit = nearAPI.utils.format.parseNearAmount('1');

    if(!contractId || !attachedDeposit){
        throw new Error(`Missing environment variables: MPC_CONTRACT_ID or attachedDeposit`);
    }


    console.log(
        'sign payload',
        payload.length > 200 ? payload.length : payload.toString(),
    );
    console.log('with path', path);
    console.log('this may take approx. 30 seconds to complete');
    console.log('argument to sign: ',args);

    let res:nearAPI.providers.FinalExecutionOutcome;
    try {
        res = await account.functionCall({
            contractId: contractId,
            methodName: 'sign',
            args: args,
            gas: new BN('300000000000000'),
            attachedDeposit: new BN(attachedDeposit),
        });
    } catch (e) {
        throw new Error(`error signing ${JSON.stringify(e)}`);
    }

    // parse result into signature values we need r, s but we don't need first 2 bytes of r (y-parity)
    if ('SuccessValue' in (res.status as any)) {
        const successValue = (res.status as any).SuccessValue;
        const decodedValue = Buffer.from(successValue, 'base64').toString();
        console.log('decoded value: ', decodedValue);
        const { big_r, s: S, recovery_id } = JSON.parse(decodedValue);
        const r = Buffer.from(big_r.affine_point.substring(2), 'hex');
        const s = Buffer.from(S.scalar, 'hex');

        return {
            r,
            s,
            v: recovery_id,
        };
    } else {
        throw new Error(`error signing ${JSON.stringify(res)}`);
    }
}

export async function signWithTimeout(payload: any, path: any, timeoutMs: number = 120000) {
    return Promise.race([
        sign(payload, path), // your real async function
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs} ms`)), timeoutMs)
        ),
    ]);
}
