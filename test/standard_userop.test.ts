import fetch from 'isomorphic-fetch';
import { IntentBuilder, Account } from '../src';
import { ChainID, TIMEOUT, TOKENS } from './constants';
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

describe('Conventional userops', () => {
  let intentBuilder: IntentBuilder, account: Account;

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(ChainID, 1);

    await fundUserWallet(TOKENS.USDC.address, account.getSender(ChainID), intentBuilder.getChainConfig(ChainID).rpcUrl);
  }, TIMEOUT);

  it(
    'executes an empty calldata',
    async () => {
      const initialETHBalance = await account.getBalance(ChainID, TOKENS.ETH.address);

      await intentBuilder.executeStandardUserOps(account, ChainID, {
        callGasLimit: CALL_GAS_LIMIT,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        verificationGasLimit: VERIFICATION_GAS_LIMIT,
      });

      const finalETHBalance = await account.getBalance(ChainID, TOKENS.ETH.address);

      expect(finalETHBalance).toBeLessThan(initialETHBalance);
    },
    TIMEOUT,
  );
});
