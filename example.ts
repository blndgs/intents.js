import { IntentBuilder, PROJECTS, CHAINS, Loan, Stake, toBigInt, Account, amountToBigInt } from './src';
import { ethers } from 'ethers';
import { ChainConfigs } from './src/types';

const signer = new ethers.Wallet('private key');

const usdtAmount = 244.7;
const ethAmount = 0.1;
const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';

const from = new Loan({
  address: PROJECTS.Aave,
  amount: amountToBigInt(usdtAmount, 18),
  chainId: toBigInt(CHAINS.BNBChain),
  asset: usdtAddress,
});

const to = new Stake({
  amount: amountToBigInt(ethAmount, 18),
  address: PROJECTS.Lido,
  chainId: toBigInt(CHAINS.Ethereum),
});

async function executeIntent() {
  const chainConfigs: ChainConfigs = {
    1: {
      rpcUrl: 'https://virtual.mainnet.rpc.tenderly.co/13d45a24-2474-431e-8f19-31f251f6cd2a',
      bundlerUrl: 'https://eth.bundler.dev.balloondogs.network',
    },
    56: {
      rpcUrl: 'https://virtual.binance.rpc.tenderly.co/4e9d15b6-3c42-43b7-a254-359a7893e8e6',
      bundlerUrl: 'https://bsc.bundler.dev.balloondogs.network',
    },
  };

  const account = await Account.createInstance(signer, chainConfigs);
  const intentBuilder = await IntentBuilder.createInstance(chainConfigs);

  try {
    await intentBuilder.execute(from, to, account, 888);
    console.log('Intent executed successfully.');
  } catch (error) {
    console.error('Error executing intent:', error);
  }
}

executeIntent();
