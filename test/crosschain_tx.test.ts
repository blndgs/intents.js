import { IntentBuilder, CHAINS, toBigInt, Asset, Account, floatToToken, weiToFloat, amountToBigInt } from '../src';
import { TENDERLY_CHAIN_ID, TIMEOUT, Token, TOKENS } from './constants';
import { getPrice, initSigner, initTest } from './testUtils';

describe('crosschain swap', () => {
  let intentBuilder: IntentBuilder, account: Account;

  // Initialize test environment
  beforeAll(async () => {
    const chainConfigs = await initTest();
    ({ account, intentBuilder } = await initSigner(chainConfigs));
    await account.faucet(TENDERLY_CHAIN_ID.Ethereum, 1);
  }, TIMEOUT);

  it(
    'ETH->BNB',
    async () => {

      const from = new Asset({
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        amount: amountToBigInt(0.2, 18),
        chainId: toBigInt(CHAINS.Ethereum),
      });

      // Create 'to' asset using amountToBigInt for precise conversion
      const to = new Asset({
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        chainId: toBigInt(CHAINS.BNBChain),
      });

      // Execute swap
      try {
        await intentBuilder.execute(from, to, account, {
          sourceChainId: TENDERLY_CHAIN_ID.Ethereum,
        });
      } catch (error) {
        console.error(`Swap failed: ${error}`);
      }

    },
    TIMEOUT * 3,
  );

  it(
    'ETH->BNB - USDT',
    async () => {

      const from = new Asset({
        address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
        amount: amountToBigInt(0.2, 18),
        chainId: toBigInt(CHAINS.Ethereum),
      });

      // Create 'to' asset using amountToBigInt for precise conversion
      const to = new Asset({
        address: "0x55d398326f99059fF775485246999027B3197955",
        chainId: toBigInt(CHAINS.BNBChain),
      });

      // Execute swap
      try {
        await intentBuilder.execute(from, to, account, {
          sourceChainId: TENDERLY_CHAIN_ID.Ethereum,
        });
      } catch (error) {
        console.error(`Swap failed: ${error}`);
      }

    },
    TIMEOUT * 3,
  );
});
