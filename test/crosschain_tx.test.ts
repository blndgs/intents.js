import { IntentBuilder, CHAINS, toBigInt, Asset, Account, floatToToken, weiToFloat, amountToBigInt } from '../src';
import { TENDERLY_CHAIN_ID, TIMEOUT, Token, TOKENS } from './constants';
import { getPrice, initSigner, initTest } from './testUtils';

/** Maximum allowed slippage for swaps (2%) */
const DEFAULT_SLIPPAGE = 0.02;

/** Minimum amount allowed for a swap operation */
const MINIMUM_SWAP_AMOUNT = 0.000001;

/** Buffer to prevent "insufficient balance" errors (99.99% of balance) */
const BALANCE_BUFFER = 0.9999;

/** Threshold for considering balances equal, handles floating-point imprecision */
// This is used to determine when two balances are close enough to be considered equal.
const BALANCE_THRESHOLD = 1e-15;

describe('crosschain swap', () => {
  let intentBuilder: IntentBuilder, account: Account;

  /**
   * Executes a token swap operation.
   * @param sourceToken The token to swap from
   * @param targetToken The token to swap to
   * @param amount The amount to swap
   * @param slippage Maximum allowed slippage, defaults to DEFAULT_SLIPPAGE
   */
  const swap = async function (
    chainId: number,
    sourceToken: Token,
    targetToken: Token,
    amount: number,
    recipient?: string,
    slippage = DEFAULT_SLIPPAGE,
  ) {
    // Apply buffer to amount
    const bufferedAmount = amount * BALANCE_BUFFER;
    if (bufferedAmount < MINIMUM_SWAP_AMOUNT) {
      console.log(`Skipping swap due to amount (${bufferedAmount}) being below minimum (${MINIMUM_SWAP_AMOUNT})`);
      return;
    }

    // Create 'from' asset using amountToBigInt for precise conversion
    const from = new Asset({
      address: sourceToken.address,
      amount: amountToBigInt(bufferedAmount, sourceToken.decimal),
      chainId: toBigInt(CHAINS.Ethereum),
    });

    // Get expected amount and calculate minimum amount with slippage
    const expectedTargetAmount = await getPrice(
      CHAINS.Ethereum,
      sourceToken,
      targetToken,
      floatToToken(bufferedAmount, sourceToken.decimal),
    );
    const minTargetAmount = (expectedTargetAmount * BigInt(Math.floor((1 - slippage) * 10000))) / BigInt(10000);

    // Log swap details
    console.log('sourceToken', sourceToken);
    console.log('targetToken', targetToken);
    console.log('sourceAmount', bufferedAmount);
    console.log('expectedTargetAmount', weiToFloat(expectedTargetAmount));
    console.log('minTargetAmount', weiToFloat(minTargetAmount));
    console.log('sender', account.getSender(chainId));
    console.log('source balance', await account.getBalance(chainId, sourceToken.address));
    console.log('targetToken balance', await account.getBalance(chainId, targetToken.address));

    // Create 'to' asset using amountToBigInt for precise conversion
    const to = new Asset({
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      amount: amountToBigInt(weiToFloat(minTargetAmount), targetToken.decimal),
      chainId: toBigInt(CHAINS.BNBChain),
    });

    // Execute swap
    try {
      await intentBuilder.execute(from, to, account, {
        sourceChainId: chainId,
        recipient,
      });
    } catch (error) {
      console.error(`Swap failed: ${error}`);
    }
  };

  /**
   * Checks balance and executes swap if conditions are met.
   * @param sourceToken The token to swap from
   * @param targetToken The token to swap to
   * @param amount The amount to swap
   */
  const checkAndSwap = async (
    chainId: number,
    sourceToken: Token,
    targetToken: Token,
    amount: number,
    recipient?: string,
  ) => {
    // Initial check for non-positive amount
    if (amount <= 0) {
      console.log(`Skipping ${sourceToken.address} -> ${targetToken.address} due to non-positive amount (${amount})`);
      return;
    }

    // Get the balance and calculate the buffered amount
    const balance = await account.getBalance(chainId, sourceToken.address);

    const bufferedAmount = Math.min(balance * BALANCE_BUFFER, amount);

    // Additional check after applying buffer to ensure the amount is still valid
    if (bufferedAmount <= 0 || bufferedAmount < MINIMUM_SWAP_AMOUNT) {
      console.log(
        `Skipping ${sourceToken.address} -> ${targetToken.address} 
        due to buffered amount (${bufferedAmount}) being below minimum (${MINIMUM_SWAP_AMOUNT}) or non-positive`,
      );
      return;
    }

    // Get expected amount
    const expectedTargetAmount = await getPrice(
      CHAINS.Ethereum,
      sourceToken,
      targetToken,
      floatToToken(bufferedAmount, sourceToken.decimal),
    );

    // Check if expected amount is zero or very close to zero
    if (expectedTargetAmount === BigInt(0) || weiToFloat(expectedTargetAmount) < MINIMUM_SWAP_AMOUNT) {
      console.log(
        `Skipping ${sourceToken.address} -> ${targetToken.address} due to zero or very small expected target amount`,
      );
      return;
    }

    // Check if the balance and buffered amount are very close (to handle floating-point precision issues)
    if (Math.abs(balance - bufferedAmount) < BALANCE_THRESHOLD) {
      await swap(chainId, sourceToken, targetToken, balance, recipient);
    } else {
      await swap(chainId, sourceToken, targetToken, bufferedAmount, recipient);
    }
  };

  // Initialize test environment
  beforeAll(async () => {
    const chainConfigs = await initTest();
    ({ account, intentBuilder } = await initSigner(chainConfigs));
    await account.faucet(TENDERLY_CHAIN_ID.Ethereum, 1);
  }, TIMEOUT);

  it(
    'ETH->BNB',
    async () =>
      await checkAndSwap(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH, TOKENS[CHAINS.BNBChain].BNB, 0.1),
    TIMEOUT,
  );
});
