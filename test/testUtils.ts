import { ethers } from 'ethers';
import { Account, IntentBuilder } from '../src';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';
import { Token } from './constants';
import dotenv from 'dotenv';
import { ChainConfigs } from '../src/types';

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
  return new ethers.Wallet(privateKey);
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

  const chainConfigs: ChainConfigs = {
    [Number(process.env.ETH_CHAIN_ID)]: {
      rpcUrl: process.env.ETH_NODE_URL,
      bundlerUrl: process.env.ETH_BUNDLER_URL,
      factory: '0x61e218301932a2550AE8E4Cd1EcfCA7bE64E57DC',
    },
    [Number(process.env.BSC_CHAIN_ID)]: {
      rpcUrl: process.env.BSC_NODE_URL,
      bundlerUrl: process.env.BSC_BUNDLER_URL,
      factory: '0x61e218301932a2550AE8E4Cd1EcfCA7bE64E57DC',
    },
    [Number(process.env.POL_CHAIN_ID)]: {
      rpcUrl: process.env.POL_NODE_URL,
      bundlerUrl: process.env.POL_BUNDLER_URL,
      factory: '0xd9a6d24030c0DFB0bf78170556a8B671Ec432AAC',
    },
  };
  return chainConfigs;
}

export async function initSigner(chainConfigs: ChainConfigs) {
  const signer = generateRandomAccount();
  await initializeMoralis();
  return {
    intentBuilder: await IntentBuilder.createInstance(chainConfigs),
    account: await Account.createInstance(signer, chainConfigs),
  };
}

export async function getUsdPrice(chainID: number, tokenAddress: string, decimals: number): Promise<bigint> {
  const weth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH
  const wbnb = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB
  const wpol = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'; // WPOL

  let wrappedNative: string;
  let chain: EvmChain;

  switch (chainID) {
    case 1:
      wrappedNative = weth;
      chain = EvmChain.ETHEREUM;
      break;
    case 56:
      wrappedNative = wbnb;
      chain = EvmChain.BSC;
      break;
    case 137:
      wrappedNative = wpol;
      chain = EvmChain.POLYGON;
      break;
    default:
      throw new Error(`Unsupported chain ID: ${chainID}`);
  }

  tokenAddress =
    tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? wrappedNative : tokenAddress;

  const response = await Moralis.EvmApi.token.getTokenPrice({
    address: tokenAddress,
    chain: chain,
  });

  const usdPriceStr = response.result.usdPrice.toFixed(decimals);
  return ethers.parseUnits(usdPriceStr, decimals);
}

export async function getPrice(chainID: number, source: Token, target: Token, sourceAmount: bigint): Promise<bigint> {
  const [sourcePrice, targetPrice] = await Promise.all([
    getUsdPrice(chainID, source.address, source.decimal),
    getUsdPrice(chainID, target.address, target.decimal),
  ]);

  return (sourceAmount * sourcePrice) / targetPrice;
}
