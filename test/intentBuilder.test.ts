import { IntentBuilder, PROJECTS, CHAINS, checkBalance, faucet, toBigInt, getSender, Asset, Stake } from '../src';

import { ethers } from 'ethers';
// @ts-ignore
import { TOKENS } from './constants';

function generateRandomAccount(): ethers.Wallet {
  const randomBytes = ethers.utils.randomBytes(32);
  const privateKey = ethers.utils.hexlify(randomBytes);
  return new ethers.Wallet(privateKey);
}

describe('execute function use cases tests', () => {
  let intentBuilder: IntentBuilder;
  let senderAddress: string;
  let signer: ethers.Wallet;
  if (!process.env.BUNDLER_URL) throw new Error('BUNDLER_URL is missing');
  const BUNDLER_URL = process.env.BUNDLER_URL;

  beforeAll(async () => {
    intentBuilder = await IntentBuilder.createInstance(BUNDLER_URL);
    signer = generateRandomAccount();
    senderAddress = await getSender(signer, BUNDLER_URL);
  });

  it('should have an initial ETH balance of 0', async () => {
    const balance = await checkBalance(senderAddress);
    expect(parseFloat(balance)).toBe(0);
  }, 100000);

  it('should faucet the account with 1 ETH and check the balance', async () => {
    // Faucet the account with 1 ETH
    await faucet(senderAddress);

    // Check the balance after faucet
    const balanceAfter = await checkBalance(senderAddress);
    expect(parseFloat(balanceAfter)).toBe(0.5);
  }, 100000);

  it('ETH -> DAI Swap', async () => {
    const from = new Asset({
        address: TOKENS.ETH,
        amount: toBigInt(0.1),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
      to = new Asset({
        address: TOKENS.Dai,
        chainId: toBigInt(CHAINS.Ethereum),
      });

    const initialBalance = await checkBalance(senderAddress, TOKENS.Dai);

    await intentBuilder.execute(from, to, signer);

    const finalBalance = await checkBalance(senderAddress, TOKENS.Dai);

    expect(parseFloat(finalBalance)).toBeGreaterThan(parseFloat(initialBalance));
  }, 100000);




});
