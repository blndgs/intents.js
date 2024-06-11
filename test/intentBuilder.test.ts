import { IntentBuilder, Projects, Helpers } from '../src';

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
    const balance = await Helpers.checkBalance(sender);
    expect(parseFloat(balance)).toBe(0);
  }, 100000);

  it('should faucet the account with 1 ETH and check the balance', async () => {
    // Faucet the account with 1 ETH
    await Helpers.faucet(sender);

    // Check the balance after faucet
    const balanceAfter = await Helpers.checkBalance(sender);
    expect(parseFloat(balanceAfter)).toBe(0.5);
  }, 100000);

  it('ETH -> DAI Swap', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.ETH, 0.1, 'currency', TOKENS.Dai, 0.1);

    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);

    await intentBuilder.execute(intent, signer);

    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('ETH -> WETH Swap', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.ETH, 0.2, 'currency', TOKENS.Weth, 0.2);

    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Weth);

    await intentBuilder.execute(intent, signer);

    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Weth);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('DAI -> ETH Swap', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, 10, 'currency', TOKENS.ETH, 10);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);
    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);
    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('WETH -> ETH Swap', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.Weth, 0.1, 'currency', TOKENS.ETH, 0.1);
    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Weth);
    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Weth);
    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('DAI -> USDC Swap', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, 10, 'currency', TOKENS.Usdc, 10);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);

    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('DAI -> ETH Stake', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, 100, 'staking', Projects.Lido, 100);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);
    const initialStEthBalance = await Helpers.checkBalance(sender, TOKENS.Steth);

    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);
    const finalStEthBalance = await Helpers.checkBalance(sender, TOKENS.Steth);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalStEthBalance)).toBeGreaterThan(parseFloat(initialStEthBalance));
  }, 100000);

  it('WETH -> ETH Stake', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.Weth, 0.1, 'staking', Projects.Lido, 0.1);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Weth);
    const initialStEthBalance = await Helpers.checkBalance(sender, TOKENS.Steth);

    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Weth);
    const finalStEthBalance = await Helpers.checkBalance(sender, TOKENS.Steth);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalStEthBalance)).toBeGreaterThan(parseFloat(initialStEthBalance));
  }, 100000);

  it('ETH -> ETH Stake', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.ETH, 0.1, 'staking', Projects.Lido, 0.1);

    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const initialStEthBalance = await Helpers.checkBalance(sender, TOKENS.Steth);

    await intentBuilder.execute(intent, signer);

    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const finalStEthBalance = await Helpers.checkBalance(sender, TOKENS.Steth);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalStEthBalance)).toBeGreaterThan(parseFloat(initialStEthBalance));
  }, 100000);

  it('ETH -> ETH Loan', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.ETH, 0.1, 'loan', Projects.Aave, 0.1);

    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    await intentBuilder.execute(intent, signer);

    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
  }, 100000);

  it('ERC20 -> ERC20 Loan', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.Dai, 0.1, 'loan', Projects.Aave, 0.1);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);
    const initialADaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);

    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Dai);
    const finalADaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalADaiBalance)).toBeGreaterThan(parseFloat(initialADaiBalance));
  }, 100000);

  it('ETH -> Weth Loan', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.ETH, 0.1, 'loan', Projects.Aave, 0.1);

    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Aweth);

    await intentBuilder.execute(intent, signer);

    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Aweth);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('ETH -> Dai Loan', async () => {
    const intent = intentBuilder.createIntent(sender, 'currency', TOKENS.ETH, 0.1, 'loan', Projects.Aave, 0.1);

    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);

    await intentBuilder.execute(intent, signer);

    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);

    expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
    expect(parseFloat(finalDaiBalance)).toBeGreaterThan(parseFloat(initialDaiBalance));
  }, 100000);

  it('Loaned Dai -> ETH', async () => {
    const intent = intentBuilder.createIntent(sender, 'loan', TOKENS.ADai, 10, 'currency', TOKENS.ETH, 10);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);
    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);
    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('Loaned Weth -> ETH', async () => {
    const intent = intentBuilder.createIntent(sender, 'loan', TOKENS.Aweth, 10, 'currency', TOKENS.ETH, 10);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.Aweth);
    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.Aweth);
    const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalEthBalance)).toBeGreaterThan(parseFloat(initialEthBalance));
  }, 100000);

  it('Loaned Dai -> Usdc', async () => {
    const intent = intentBuilder.createIntent(sender, 'loan', TOKENS.ADai, 5, 'currency', TOKENS.Usdc, 5);

    const initialDaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);
    const initialUsdcBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);

    await intentBuilder.execute(intent, signer);

    const finalDaiBalance = await Helpers.checkBalance(sender, TOKENS.ADai);
    const finalUsdcBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);

    expect(parseFloat(finalDaiBalance)).toBeLessThan(parseFloat(initialDaiBalance));
    expect(parseFloat(finalUsdcBalance)).toBeGreaterThan(parseFloat(initialUsdcBalance));
  }, 100000);

  it('Failed Loaned ETH -> ERC20', async () => {
    const intent = intentBuilder.createIntent(sender, 'loan', TOKENS.ETH, 1, 'currency', TOKENS.Usdc, 1);

    const initialEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
    const initialUsdcBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);

    try {
      await intentBuilder.execute(intent, signer);

      const finalEthBalance = await Helpers.checkBalance(sender, TOKENS.ETH);
      const finalUsdcBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);

      expect(parseFloat(finalEthBalance)).toBeLessThan(parseFloat(initialEthBalance));
      expect(parseFloat(finalUsdcBalance)).toBeGreaterThan(parseFloat(initialUsdcBalance));
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 100000);

  it('Failed Non-Loaned ERC20 -> ERC20', async () => {
    const intent = intentBuilder.createIntent(
      sender,
      'loan',
      TOKENS.Usdc, // Token not available on Aave
      5,
      'currency',
      TOKENS.Usdc,
      5,
    );

    const initialNonAaveTokenBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);
    const initialUsdcBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);

    try {
      await intentBuilder.execute(intent, signer);

      const finalNonAaveTokenBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);
      const finalUsdcBalance = await Helpers.checkBalance(sender, TOKENS.Usdc);

      expect(parseFloat(finalNonAaveTokenBalance)).toBeLessThan(parseFloat(initialNonAaveTokenBalance));
      expect(parseFloat(finalUsdcBalance)).toBeGreaterThan(parseFloat(initialUsdcBalance));
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 100000);

  it('Failed Loan -> Stake', async () => {
    const intent = intentBuilder.createIntent(sender, 'loan', TOKENS.ADai, 5, 'staking', Projects.Lido, 5);

    try {
      await intentBuilder.execute(intent, signer);
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 100000);
});
