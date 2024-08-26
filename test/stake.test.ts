import { IntentBuilder, CHAINS, PROJECTS, toBigInt, Asset, Stake, Account } from '../src';
import { TIMEOUT, TOKENS } from './constants';
import { amountToBigInt, initTest } from './testUtils';

describe('Stake', () => {
  let intentBuilder: IntentBuilder, account: Account;

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(1);
  });

  it(
    'LidoETH',
    async () => {
      const from = new Asset({
          address: TOKENS.ETH.address,
          amount: amountToBigInt(0.1, TOKENS.ETH),
          chainId: toBigInt(CHAINS.Ethereum),
        }),
        to = new Stake({
          address: PROJECTS.Lido,
          amount: amountToBigInt(0.1, TOKENS.ETH),
          chainId: toBigInt(CHAINS.Ethereum),
        });
      const initialDaiBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
      const initialStEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.Steth.address);

      await intentBuilder.execute(from, to, account);

      const finalDaiBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
      const finalStEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.Steth.address);

      expect(finalDaiBalance).toBeLessThan(initialDaiBalance);
      expect(finalStEthBalance).toBeGreaterThan(initialStEthBalance);
    },
    TIMEOUT,
  );
});
