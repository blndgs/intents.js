import { IntentBuilder, CHAINS, PROJECTS, toBigInt, Asset, Stake, Account, amountToBigInt } from '../src';

import { ChainID, TIMEOUT, TOKENS } from './constants';
import { initTest } from './testUtils';

describe('Stake', () => {
  let intentBuilder: IntentBuilder, account: Account;

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(ChainID, 1);
  }, TIMEOUT);

  it(
    'LidoETH',
    async () => {
      const from = new Asset({
        address: TOKENS.ETH.address,
        amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
        to = new Stake({
          address: PROJECTS.Lido,
          amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
          chainId: toBigInt(CHAINS.Ethereum),
        });
      const initialDaiBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
      const initialStEthBalance = await account.getBalance(ChainID, TOKENS.STETH.address);

      await intentBuilder.execute(from, to, account, ChainID);

      const finalDaiBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
      const finalStEthBalance = await account.getBalance(ChainID, TOKENS.STETH.address);

      expect(finalDaiBalance).toBeLessThan(initialDaiBalance);
      expect(finalStEthBalance).toBeGreaterThan(initialStEthBalance);
    },
    TIMEOUT,
  );

  it(
    'Ankr',
    async () => {
      const from = new Asset({
        address: TOKENS.ETH.address,
        amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
        to = new Stake({
          address: PROJECTS.Ankr,
          amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
          chainId: toBigInt(CHAINS.Ethereum),
        });
      const initialETHBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
      const initialAETHBalance = await account.getBalance(ChainID, TOKENS.AETH.address);

      await intentBuilder.execute(from, to, account, ChainID);

      const finalETHBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
      const finalAETHBalance = await account.getBalance(ChainID, TOKENS.AETH.address);

      expect(finalETHBalance).toBeLessThan(initialETHBalance);
      expect(finalAETHBalance).toBeGreaterThan(initialAETHBalance);
    },
    TIMEOUT,
  );

  // it(
  //   'RocketPool',
  //   async () => {
  //     const from = new Asset({
  //       address: TOKENS.ETH.address,
  //       amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
  //       chainId: toBigInt(CHAINS.Ethereum),
  //     }),
  //       to = new Stake({
  //         address: PROJECTS.RocketPool,
  //         amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
  //         chainId: toBigInt(CHAINS.Ethereum),
  //       });
  //     const initialETHBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
  //     const initialRETHBalance = await account.getBalance(ChainID, TOKENS.RETH.address);
  //
  //     await intentBuilder.execute(from, to, account, ChainID);
  //
  //     const finalETHBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
  //     const finalRETHBalance = await account.getBalance(ChainID, TOKENS.RETH.address);
  //
  //     expect(finalETHBalance).toBeLessThan(initialETHBalance);
  //     expect(finalRETHBalance).toBeGreaterThan(initialRETHBalance);
  //   },
  //   TIMEOUT,
  // );
});
