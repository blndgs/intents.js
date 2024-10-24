import fetch from 'isomorphic-fetch';
import { IntentBuilder, Account, CHAINS } from '../src';
import { TENDERLY_CHAIN_ID, TIMEOUT, TOKENS } from './constants';
import { initTest } from './testUtils';
import { CALL_GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, VERIFICATION_GAS_LIMIT } from '../src/constants';

async function fundUserWallet(token: string, addr: string, rpcURL: string): Promise<void> {
  const reqBody = JSON.stringify({
    jsonrpc: '2.0',
    method: 'tenderly_setErc20Balance',
    params: [token, [addr], '0x989680'],
  });

  const response = await fetch(rpcURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: reqBody,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
}

describe('Conventional userops ethereum', () => {
  let intentBuilder: IntentBuilder, account: Account;

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(TENDERLY_CHAIN_ID.Ethereum, 1);

    await fundUserWallet(
      TOKENS[CHAINS.Ethereum].USDC.address,
      account.getSender(TENDERLY_CHAIN_ID.Ethereum),
      intentBuilder.getChainConfig(TENDERLY_CHAIN_ID.Ethereum).rpcUrl,
    );
  }, TIMEOUT);

  it(
    'executes an empty calldata',
    async () => {
      const initialETHBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.Ethereum,
        TOKENS[CHAINS.Ethereum].ETH.address,
      );

      await intentBuilder.executeStandardUserOps(account, TENDERLY_CHAIN_ID.Ethereum, {
        callGasLimit: CALL_GAS_LIMIT,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        verificationGasLimit: VERIFICATION_GAS_LIMIT,
      });

      const finalETHBalance = await account.getBalance(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH.address);

      expect(finalETHBalance).toBeLessThan(initialETHBalance);
    },
    TIMEOUT,
  );
});

describe('Conventional userops binance', () => {
  let intentBuilder: IntentBuilder, account: Account;

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(TENDERLY_CHAIN_ID.BNBChain, 1);

    await fundUserWallet(
      TOKENS[CHAINS.BNBChain].USDC.address,
      account.getSender(TENDERLY_CHAIN_ID.BNBChain),
      intentBuilder.getChainConfig(TENDERLY_CHAIN_ID.BNBChain).rpcUrl,
    );
  }, TIMEOUT);

  it(
    'executes an empty calldata',
    async () => {
      const initialBNBBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.BNBChain,
        TOKENS[CHAINS.BNBChain].BNB.address,
      );

      await intentBuilder.executeStandardUserOps(account, TENDERLY_CHAIN_ID.BNBChain, {
        callGasLimit: CALL_GAS_LIMIT,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        verificationGasLimit: VERIFICATION_GAS_LIMIT,
      });

      const finalBNBBalance = await account.getBalance(TENDERLY_CHAIN_ID.BNBChain, TOKENS[CHAINS.BNBChain].BNB.address);

      expect(finalBNBBalance).toBeLessThan(initialBNBBalance);
    },
    TIMEOUT,
  );
});
