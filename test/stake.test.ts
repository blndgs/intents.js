import { IntentBuilder, CHAINS, PROJECTS, toBigInt, Asset, Stake, Account, amountToBigInt } from '../src';

import { TENDERLY_CHAIN_ID, TIMEOUT, TOKENS } from './constants';
import { initTest } from './testUtils';

describe('Stake', () => {
  let intentBuilder: IntentBuilder, account: Account;

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(TENDERLY_CHAIN_ID.Ethereum, 1);
  }, TIMEOUT);

  it(
    'LidoETH',
    async () => {
      const from = new Asset({
          address: TOKENS[CHAINS.Ethereum].ETH.address,
          amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
          chainId: toBigInt(CHAINS.Ethereum),
        }),
        to = new Stake({
          address: PROJECTS[CHAINS.Ethereum].Lido,
          amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
          chainId: toBigInt(CHAINS.Ethereum),
        });
      const initialDaiBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.Ethereum,
        TOKENS[CHAINS.Ethereum].ETH.address,
      );
      const initialStEthBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.Ethereum,
        TOKENS[CHAINS.Ethereum].STETH.address,
      );

      await intentBuilder.execute(from, to, account, TENDERLY_CHAIN_ID.Ethereum);

      const finalDaiBalance = await account.getBalance(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH.address);
      const finalStEthBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.Ethereum,
        TOKENS[CHAINS.Ethereum].STETH.address,
      );

      expect(finalDaiBalance).toBeLessThan(initialDaiBalance);
      expect(finalStEthBalance).toBeGreaterThan(initialStEthBalance);
    },
    TIMEOUT,
  );

  it(
    'Ankr',
    async () => {
      const from = new Asset({
          address: TOKENS[CHAINS.Ethereum].ETH.address,
          amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
          chainId: toBigInt(CHAINS.Ethereum),
        }),
        to = new Stake({
          address: PROJECTS[CHAINS.Ethereum].Ankr,
          amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
          chainId: toBigInt(CHAINS.Ethereum),
        });
      const initialETHBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.Ethereum,
        TOKENS[CHAINS.Ethereum].ETH.address,
      );
      const initialAETHBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.Ethereum,
        TOKENS[CHAINS.Ethereum].AETH.address,
      );

      await intentBuilder.execute(from, to, account, TENDERLY_CHAIN_ID.Ethereum);

      const finalETHBalance = await account.getBalance(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH.address);
      const finalAETHBalance = await account.getBalance(
        TENDERLY_CHAIN_ID.Ethereum,
        TOKENS[CHAINS.Ethereum].AETH.address,
      );

      expect(finalETHBalance).toBeLessThan(initialETHBalance);
      expect(finalAETHBalance).toBeGreaterThan(initialAETHBalance);
    },
    TIMEOUT,
  );

  // it(
  //   'RocketPool',
  //   async () => {
  //     const from = new Asset({
  //       address: TOKENS[CHAINS.Ethereum].ETH.address,
  //       amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
  //       chainId: toBigInt(CHAINS.Ethereum),
  //     }),
  //       to = new Stake({
  //         address: PROJECTS.RocketPool,
  //         amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
  //         chainId: toBigInt(CHAINS.Ethereum),
  //       });
  //     const initialETHBalance = await account.getBalance(ChainID, TOKENS[CHAINS.Ethereum].ETH.address);
  //     const initialRETHBalance = await account.getBalance(ChainID, TOKENS[CHAINS.Ethereum].RETH.address);
  //
  //     await intentBuilder.execute(from, to, account, ChainID);
  //
  //     const finalETHBalance = await account.getBalance(ChainID, TOKENS[CHAINS.Ethereum].ETH.address);
  //     const finalRETHBalance = await account.getBalance(ChainID, TOKENS[CHAINS.Ethereum].RETH.address);
  //
  //     expect(finalETHBalance).toBeLessThan(initialETHBalance);
  //     expect(finalRETHBalance).toBeGreaterThan(initialRETHBalance);
  //   },
  //   TIMEOUT,
  // );
});
