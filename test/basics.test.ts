import { Account, CHAINS } from '../src';
import { initTest } from './testUtils';
import { TIMEOUT } from './constants';

describe('basics', () => {
  let senderAddress: string, account: Account;

  beforeAll(async () => {
    ({ account } = await initTest());
  });

  it(
    'Empty wallet check',
    async () => {
      const balance = await account.getBalance(CHAINS.Ethereum, senderAddress);
      expect(balance).toBe(0);
    },
    TIMEOUT,
  );

  it(
    'Faucet validation',
    async () => {
      // Faucet the account with 1 ETH
      await account.faucet(CHAINS.Ethereum, 1);

      // Check the balance after faucet
      const balanceAfter = await account.getBalance(CHAINS.Ethereum, senderAddress);
      expect(balanceAfter).toBe(1); // 1ETH fueled
    },
    TIMEOUT,
  );

  it('Not exist wallet nonce', async () => {
    expect(await account.getNonce(CHAINS.Ethereum, 1)).toBe(0);
  });
});
