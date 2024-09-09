import { ethers } from 'ethers';
import { IntentBuilder, Account } from '../src';
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

export async function initTest() {
  if (!process.env.BUNDLER_URL) throw new Error('BUNDLER_URL is missing');
  if (!process.env.NODE_URL) throw new Error('NODE_URL is missing');
  if (!process.env.CHAIN_ID) throw new Error('CHAIN_ID is missing');
  if (!process.env.MORALIS_API_KEY) throw new Error('MORALIS_API_KEY is missing');

  const chainConfigs: ChainConfigs = {
    888: {
      rpcUrl: process.env.NODE_URL,
      bundlerUrl: process.env.BUNDLER_URL,
    },
    // 890: {
    //   rpcUrl: process.env.BSC_NODE_URL,
    //   bundlerUrl: process.env.BSC_BUNDLER_URL,
    // },
  };

  const signer = generateRandomAccount();
  console.log('signer', signer.getAddress());
  console.log('signer Private key', signer.privateKey.toString());
  console.log('signer address', signer.address);
  console.log('signer provider', signer.provider);
  await initializeMoralis();

  return {
    intentBuilder: await IntentBuilder.createInstance(chainConfigs),
    account: await Account.createInstance(signer, chainConfigs),
  };
}

export async function getUsdPrice(chainID: number, tokenAddress: string, decimals: number): Promise<bigint> {
  // TODO:: use chain ID:
  console.log('chainID', chainID);
  tokenAddress =
    tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      ? '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH address for APIs
      : tokenAddress;
  const response = await Moralis.EvmApi.token.getTokenPrice({
    address: tokenAddress,
    chain: EvmChain.ETHEREUM,
  });

  const usdPriceStr = response.result.usdPrice.toFixed(decimals);
  const usdPrice = ethers.parseUnits(usdPriceStr, decimals);

  return usdPrice;
}

export async function getPrice(chainID: number, source: Token, target: Token, sourceAmount: bigint): Promise<bigint> {
  const [sourcePrice, targetPrice] = await Promise.all([
    getUsdPrice(chainID, source.address, source.decimal),
    getUsdPrice(chainID, target.address, target.decimal),
  ]);

  return (sourceAmount * sourcePrice) / targetPrice;
}
