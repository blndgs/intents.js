import { ethers, JsonRpcProvider } from 'ethers';
import { BigInt as ProtoBigInt } from 'blndgs-model';
import { Account, IntentBuilder } from '../src';
import Moralis from 'moralis';
import { TENDERLY_CHAIN_ID, Token } from './constants';
import dotenv from 'dotenv';
import { ChainConfigs } from '../src/types';
import { BorsaQuoter } from '../test/quoter';

dotenv.config();
const moralis_key = process.env.MORALIS_API_KEY;
let isMoralisInitialized = false;

export async function initializeMoralis() {
  if (!isMoralisInitialized) {
    await Moralis.start({ apiKey: moralis_key });
    isMoralisInitialized = true;
  }
}

export function generateRandomAccount(): ethers.Wallet {
  const randomBytes = ethers.randomBytes(32);
  const privateKey = ethers.hexlify(randomBytes);
  return new ethers.Wallet(privateKey)
}

export async function initTest(): Promise<ChainConfigs> {
  if (!process.env.ETH_BUNDLER_URL) throw new Error('ETH_BUNDLER_URL is missing');
  if (!process.env.ETH_NODE_URL) throw new Error('ETH_NODE_URL is missing');
  if (!process.env.ETH_CHAIN_ID) throw new Error('ETH_CHAIN_ID is missing');
  if (!process.env.BSC_BUNDLER_URL) throw new Error('BSC_BUNDLER_URL is missing');
  if (!process.env.BSC_NODE_URL) throw new Error('BSC_NODE_URL is missing');
  if (!process.env.BSC_CHAIN_ID) throw new Error('BSC_CHAIN_ID is missing');
  if (!process.env.POL_BUNDLER_URL) throw new Error('POL_BUNDLER_URL is missing');
  if (!process.env.POL_NODE_URL) throw new Error('POL_NODE_URL is missing');
  if (!process.env.POL_CHAIN_ID) throw new Error('POL_CHAIN_ID is missing');
  if (!process.env.MORALIS_API_KEY) throw new Error('MORALIS_API_KEY is missing');
  if (!process.env.QUOTE_API) throw new Error('QUOTE_API is missing');

  const chainConfigs: ChainConfigs = {
    [Number(process.env.ETH_CHAIN_ID)]: {
      rpcUrl: process.env.ETH_NODE_URL,
      bundlerUrl: process.env.ETH_BUNDLER_URL,
    },
    [Number(process.env.BSC_CHAIN_ID)]: {
      rpcUrl: process.env.BSC_NODE_URL,
      bundlerUrl: process.env.BSC_BUNDLER_URL,
    },
    [Number(process.env.POL_CHAIN_ID)]: {
      rpcUrl: process.env.POL_NODE_URL,
      bundlerUrl: process.env.POL_BUNDLER_URL,
    },
  };
  return chainConfigs;
}

export async function initSigner(chainConfigs: ChainConfigs) {
  const signer = generateRandomAccount();

  await initializeMoralis();

  const account = await Account.createInstance(signer, chainConfigs)

  await account.faucet(TENDERLY_CHAIN_ID.Ethereum, 1);

  return {
    intentBuilder: await IntentBuilder.createInstance(chainConfigs),
    account: account,
  };
}

const quoter = new BorsaQuoter(process.env.QUOTE_API);

export async function getPrice(
  chainId: number,
  sourceToken: Token,
  targetToken: Token,
  amount: ProtoBigInt,
  sender: string,
  nonce: number,
): Promise<bigint> {
  return quoter.getQuote(chainId, sourceToken, targetToken, amount, sender, nonce);
}
