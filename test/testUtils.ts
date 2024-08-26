import { ethers } from 'ethers';
import { IntentBuilder, toBigInt, Account, CHAINS } from '../src';
import { CovalentClient } from '@covalenthq/client-sdk';
import { Token } from './constants';

const Covalent_Key = 'cqt_rQ7BKxMqyXDGBJrMJddFFp3kYDbP';
const client = new CovalentClient(Covalent_Key);

export function generateRandomAccount(): ethers.Wallet {
  const randomBytes = ethers.utils.randomBytes(32);
  const privateKey = ethers.utils.hexlify(randomBytes);
  return new ethers.Wallet(privateKey);
}

export async function initTest() {
  if (!process.env.BUNDLER_URL) throw new Error('BUNDLER_URL is missing');
  if (!process.env.NODE_URL) throw new Error('NODE_URL is missing');

  const signer = generateRandomAccount();
  return {
    intentBuilder: await IntentBuilder.createInstance(process.env.BUNDLER_URL),
    account: await Account.createMultiChainInstance(signer, process.env.BUNDLER_URL, { [CHAINS.Ethereum]: process.env.NODE_URL }),
  };
}

export async function getUsdPrice(tokenAddress: string) {
  //docs here - https://www.covalenthq.com/docs/api/pricing/get-historical-token-prices/
  const pricesItem = await client.PricingService.getTokenPrices('eth-mainnet', 'USD', tokenAddress);
  return pricesItem.data[0].prices[0].price;
}

export async function getPrice(sourceAddress: string, targetAddress: string, sourceAmount: number) {
  const [sourcePrice, targetPrice] = await Promise.all([getUsdPrice(sourceAddress), getUsdPrice(targetAddress)]);

  return (sourceAmount * sourcePrice) / targetPrice;
}

export function amountToBigInt(amount: number, token: Token) {
  return toBigInt(Math.floor(amount * 10 ** token.decimal));
}
