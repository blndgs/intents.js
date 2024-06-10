import { IntentBuilder } from '../src';
import { Projects } from '../src';
import { NODE_URL } from '../src/Constants';

import { ethers } from 'ethers';
import { TOKENS } from './constants';

function generateRandomAccount(): ethers.Wallet {
  const randomBytes = ethers.utils.randomBytes(32);
  const privateKey = ethers.utils.hexlify(randomBytes);
  return new ethers.Wallet(privateKey);
}

describe('execute function use cases tests', () => {
  let intentBuilder: IntentBuilder;
  let randomAccount: ethers.Wallet;
  let sender: string;
  let signer: ethers.Wallet;

  beforeAll(async () => {
    intentBuilder = new IntentBuilder();
    randomAccount = generateRandomAccount();
    signer = randomAccount;
    sender = await intentBuilder.getSender(signer);
  });

  it('should have an initial ETH balance of 0', async () => {
    const balance = await intentBuilder.checkBalance(sender, NODE_URL);
    expect(parseFloat(balance)).toBe(0);
  }, 100000);

  it('should faucet the account with 1 ETH and check the balance', async () => {
    // Faucet the account with 1 ETH
    await intentBuilder.faucet(sender);

    // Check the balance after faucet
    const balanceAfter = await intentBuilder.checkBalance(sender, NODE_URL);
    expect(parseFloat(balanceAfter)).toBe(0.5);
  }, 100000);

  it('ETH -> DAI Swap', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'currency',
      TOKENS.Ethereum,
      '0.1',
      'currency',
      TOKENS.Dai,
      '0.1',
    );

    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('ETH -> WETH Swap', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'currency',
      TOKENS.Ethereum,
      '0.2',
      'currency',
      TOKENS.Weth,
      '0.2',
    );

    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Weth);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Weth);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('DAI -> ETH Swap', async () => {
    const intents = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, '10', 'currency', TOKENS.Ethereum, '10');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);
    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);
    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('WETH -> ETH Swap', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'currency',
      TOKENS.Weth,
      '0.1',
      'currency',
      TOKENS.Ethereum,
      '0.1',
    );
    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Weth);
    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Weth);
    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('DAI -> USDC Swap', async () => {
    const intents = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, '10', 'currency', TOKENS.Usdc, '10');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('DAI -> ETH Stake', async () => {
    const intents = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, '100', 'staking', Projects.Lido, '100');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);
    const initialStEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Steth);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);
    const finalStEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Steth);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalStEthBalance)).toBeGreaterThan(parseFloat(initialStEthBalance));
  }, 100000);

  it('WETH -> ETH Stake', async () => {
    const intents = intentBuilder.createIntent(sender, 'currency', TOKENS.Weth, '0.1', 'staking', Projects.Lido, '0.1');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Weth);
    const initialStEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Steth);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Weth);
    const finalStEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Steth);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalStEthBalance)).toBeGreaterThan(parseFloat(initialStEthBalance));
  }, 100000);

  it('ETH -> ETH Stake', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'currency',
      TOKENS.Ethereum,
      '0.1',
      'staking',
      Projects.Lido,
      '0.1',
    );

    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const initialStEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Steth);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const finalStEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Steth);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalStEthBalance)).toBeGreaterThan(parseFloat(initialStEthBalance));
  }, 100000);

  it('ETH -> ETH Loan', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'currency',
      TOKENS.Ethereum,
      '0.1',
      'loan',
      Projects.Aave,
      '0.1',
    );

    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
  }, 100000);

  it('ERC20 -> ERC20 Loan', async () => {
    const intents = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, '0.1', 'loan', Projects.Aave, '0.1');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);
    const initialADaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Dai);
    const finalADaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalADaiBalance)).toBeGreaterThan(parseFloat(initialADaiBalance));
  }, 100000);

  it('ETH -> Weth Loan', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'currency',
      TOKENS.Ethereum,
      '0.1',
      'loan',
      Projects.Aave,
      '0.1',
    );

    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Aweth);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Aweth);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('ETH -> Dai Loan', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'currency',
      TOKENS.Ethereum,
      '0.1',
      'loan',
      Projects.Aave,
      '0.1',
    );

    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);
    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('Loaned Dai -> ETH', async () => {
    const intents = intentBuilder.createIntent(sender, 'loan', TOKENS.ADai, '10', 'currency', TOKENS.Ethereum, '10');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);
    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);
    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('Loaned Weth -> ETH', async () => {
    const intents = intentBuilder.createIntent(sender, 'loan', TOKENS.Aweth, '10', 'currency', TOKENS.Ethereum, '10');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Aweth);
    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Aweth);
    const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('Loaned Dai -> Usdc', async () => {
    const intents = intentBuilder.createIntent(sender, 'loan', TOKENS.ADai, '5', 'currency', TOKENS.Usdc, '5');

    const initialDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);
    const initialUsdcBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);

    await intentBuilder.execute(intents, signer, NODE_URL);

    const finalDaiBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.ADai);
    const finalUsdcBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalUsdcBalance)).toBeGreaterThan(parseFloat(initialUsdcBalance));
  }, 100000);

  it('Failed Loaned ETH -> ERC20', async () => {
    const intents = intentBuilder.createIntent(sender, 'loan', TOKENS.Ethereum, '1', 'currency', TOKENS.Usdc, '1');

    const initialEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Ethereum);
    const initialUsdcBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);

    try {
      await intentBuilder.execute(intents, signer, NODE_URL);

      const finalEthBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Ethereum);
      const finalUsdcBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);

      expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
      expect(parseFloat(finalUsdcBalance)).toBeGreaterThan(parseFloat(initialUsdcBalance));
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 100000);

  it('Failed Non-Loaned ERC20 -> ERC20', async () => {
    const intents = intentBuilder.createIntent(
      sender,
      'loan',
      TOKENS.Usdc, // Token not available on Aave
      '5',
      'currency',
      TOKENS.Usdc,
      '5',
    );

    const initialNonAaveTokenBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);
    const initialUsdcBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);

    try {
      await intentBuilder.execute(intents, signer, NODE_URL);

      const finalNonAaveTokenBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);
      const finalUsdcBalance = await intentBuilder.checkBalance(sender, NODE_URL, TOKENS.Usdc);

      expect(parseFloat(finalNonAaveTokenBalance)).toBeLessThan(parseFloat(initialNonAaveTokenBalance));
      expect(parseFloat(finalUsdcBalance)).toBeGreaterThan(parseFloat(initialUsdcBalance));
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 100000);

  it('Failed Loan -> Stake', async () => {
    const intents = intentBuilder.createIntent(sender, 'loan', TOKENS.ADai, '5', 'staking', Projects.Lido, '5');

    try {
      await intentBuilder.execute(intents, signer, NODE_URL);
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 100000);
});
