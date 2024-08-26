import { IntentBuilder, PROJECTS, CHAINS, Asset, Stake, toBigInt, Account } from './src';
import { ethers } from 'ethers';

const BUNDLER_URL = 'https://bundler.dev.balloondogs.network';
const ETH_NODE_URL = 'https://virtual.mainnet.rpc.tenderly.co/13d45a24-2474-431e-8f19-31f251f6cd2a';

const signer = new ethers.Wallet('private key');

const eth = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const amount = 0.1;

const from = new Asset({
  address: eth,
  amount: toBigInt(amount * 10 ** 18),
  chainId: toBigInt(CHAINS.Ethereum),
});

const to = new Stake({
  amount: toBigInt(amount * 10 ** 18),
  address: PROJECTS.Lido,
  chainId: toBigInt(CHAINS.Ethereum),
});

async function executeIntent() {
  const account = await Account.createMultiChainInstance(signer, BUNDLER_URL, { [CHAINS.Ethereum]: ETH_NODE_URL }),
    intentBuilder = await IntentBuilder.createInstance(BUNDLER_URL);

  await intentBuilder.execute(from, to, account);
}

executeIntent()
  .then(() => console.log('Intent executed successfully.'))
  .catch(error => console.error('Error executing intent:', error));
