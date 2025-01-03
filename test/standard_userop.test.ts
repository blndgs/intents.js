import fetch from 'isomorphic-fetch';
import { IntentBuilder, Account, CHAINS } from '../src';
import { TENDERLY_CHAIN_ID, TIMEOUT, TOKENS } from './constants';
import { initSigner, initTest } from './testUtils';
import { CALL_GAS_LIMIT, MAX_FEE_PER_GAS, MAX_PRIORITY_FEE_PER_GAS, PRE_VERIFICATION_GAS, VERIFICATION_GAS_LIMIT } from '../src/constants';

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
    const chainConfigs = await initTest();
    ({ account, intentBuilder } = await initSigner(chainConfigs));
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

      await intentBuilder.executeStandardUserOps(TENDERLY_CHAIN_ID.Ethereum, account, {
        callGasLimit: CALL_GAS_LIMIT,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        verificationGasLimit: VERIFICATION_GAS_LIMIT,
        preVerificationGas: PRE_VERIFICATION_GAS
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
    const chainConfigs = await initTest();
    ({ account, intentBuilder } = await initSigner(chainConfigs));
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

      await intentBuilder.executeStandardUserOps(TENDERLY_CHAIN_ID.BNBChain, account, {
        callGasLimit: CALL_GAS_LIMIT,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        verificationGasLimit: VERIFICATION_GAS_LIMIT,
        preVerificationGas: PRE_VERIFICATION_GAS
      });

      const finalBNBBalance = await account.getBalance(TENDERLY_CHAIN_ID.BNBChain, TOKENS[CHAINS.BNBChain].BNB.address);

      expect(finalBNBBalance).toBeLessThan(initialBNBBalance);
    },
    TIMEOUT,
  );
});

describe('Conventional userops polygon', () => {
  let intentBuilder: IntentBuilder, account: Account;

  beforeAll(async () => {
    const chainConfigs = await initTest();
    ({ account, intentBuilder } = await initSigner(chainConfigs));
    await account.faucet(TENDERLY_CHAIN_ID.Polygon, 10);

    await fundUserWallet(
      TOKENS[CHAINS.Polygon].USDC.address,
      account.getSender(TENDERLY_CHAIN_ID.Polygon),
      intentBuilder.getChainConfig(TENDERLY_CHAIN_ID.Polygon).rpcUrl,
    );
  }, TIMEOUT);

  it(
    'executes an empty calldata',
    async () => {
      const initialPOLBalance = await account.getBalance(TENDERLY_CHAIN_ID.Polygon, TOKENS[CHAINS.Polygon].POL.address);

      await intentBuilder.executeStandardUserOps(TENDERLY_CHAIN_ID.Polygon, account, {
        callGasLimit: CALL_GAS_LIMIT,
        maxFeePerGas: MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
        verificationGasLimit: VERIFICATION_GAS_LIMIT,
        preVerificationGas: PRE_VERIFICATION_GAS
      });

      const finalPOLBalance = await account.getBalance(TENDERLY_CHAIN_ID.Polygon, TOKENS[CHAINS.Polygon].POL.address);

      expect(finalPOLBalance).toBeLessThan(initialPOLBalance);
    },
    TIMEOUT,
  );
});

// temp test to check AA24 error
// describe('Conventional userops polygon', () => {
//   let intentBuilder: IntentBuilder, account: Account;

//   beforeAll(async () => {
//     const chainConfigs = await initTest();
//     ({ account, intentBuilder } = await initSigner(chainConfigs));
//   }, TIMEOUT);

//   it(
//     'executes cross chain call to validate signature with bundler',
//     async () => {
//       const from = new Asset({
//           address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
//           amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
//           chainId: toBigInt(137),
//         }),
//         to = new Stake({
//           address: '0x1adB950d8bB3dA4bE104211D5AB038628e477fE6',
//           amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
//           chainId: toBigInt(56),
//         });
//       await intentBuilder.execute(from, to, account, 137, 56);
//     },
//     TIMEOUT,
//   );
// });
