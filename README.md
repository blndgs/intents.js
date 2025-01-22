# Intents.js SDK

![NPM Version](https://img.shields.io/npm/v/intents.js)
![codecov](https://codecov.io/gh/blndgs/intents.js/graph/badge.svg?token=TAVORU8E7D)

## Supported Chains

- [x] Ethereum
- [x] Binance
- [x] Polygon

## Getting Started

You can find the full `intents.js` documentation at [docs.borsa.network](https://docs.borsa.network/developer-guides/intents.js-sdk)

### 1. Installation

Install `intents.js` using npm:

```bash
npm install intents.js
```

### 2. Setup

You can set up `intents.js` using either a private key or Web3Auth for authentication:

#### Option 1: Using Private Key

```typescript
import { Account, IntentBuilder, PROJECTS, CHAINS, toBigInt, amountToBigInt, Asset, Stake } from 'intents.js';
import { ethers } from 'ethers';

const chainConfigs = {
  1: {
    rpcUrl: 'YOUR_ETH_RPC_URL',
    bundlerUrl: 'https://eth.bundler.borsa.network',
  },
  56: {
    rpcUrl: 'YOUR_BNB_RPC_URL',
    bundlerUrl: 'https://bsc.bundler.borsa.network',
  },
  137: {
    rpcUrl: 'YOUR_POLYGON_RPC_URL',
    bundlerUrl: 'https://polygon.bundler.borsa.network',
  },
};

const intentBuilder = await IntentBuilder.createInstance(chainConfigs);
const signer = new ethers.Wallet('your private key');
const account = await Account.createInstance(signer, chainConfigs);
```

#### Option 2: Using Web3Auth

```typescript
import { Web3Auth } from '@web3auth/web3auth';
import { Account, IntentBuilder } from 'intents.js';

const web3Auth = new Web3Auth({
  clientId: 'YOUR_WEB3AUTH_CLIENT_ID', // Replace with your client ID
  chainConfig: {
    chainId: '0x1', // Ethereum Mainnet
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  },
});

const web3authProvider = await web3Auth.connectWith('google');

const ethersProvider = new ethers.BrowserProvider(web3authProvider as any);
const web3AuthSigner = ethersProvider.getSigner();

const accountInstance = await Account.createInstance(web3AuthSigner, chainConfigs);

const chainConfigs = {
  1: {
    rpcUrl: 'YOUR_ETH_RPC_URL',
    bundlerUrl: 'https://eth.bundler.borsa.network',
  },
};

const intentBuilder = await IntentBuilder.createInstance(chainConfigs);
const account = await Account.createInstance(web3AuthSigner, chainConfigs);
```

> You can extend this to use any other provider with ethers and this sdk too

### 3. Create an Intent

An intent represents a desired outcome. The intent structure consists of two symmetric source and destination states.

In this example, we are using funds from AAVE (BNB Chain) to stake on Lido (Ethereum):

```typescript
const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const from = new Loan({
  address: PROJECTS.Aave,
  amount: amountToBigInt(244.7, 18),
  chainId: toBigInt(CHAINS.BNBChain),
  asset: usdtAddress,
});

const to = new Stake({
  amount: amountToBigInt(0.1, 18),
  address: PROJECTS.Lido,
  chainId: toBigInt(CHAINS.Ethereum),
  asset: ethAddress,
});
```

### 4. Execute the Intent

Simply provide the source and destination states along with the associated account.

The `execute()` function will then wrap the intent as an [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) userOp and submit it to the Borsa network.

```typescript
const solvedHash = await intentBuilder.execute(from, to, account);
```

#### 4b. Deposit resulting tokens from intent execution into another address

When staking, supplying loan or swapping tokens, you can deposit the swapped tokens to be deposited into another address instead of the address that executed the tx.

The `execute` takes an optional config object as below

```typescript
const execOption: ExecutionOptions = {
  sourceChainId: 888,
  recipient: '0xAddress',
};
const result = await intentBuilder.execute(source, destination, account, execOption);
```

#### 4c. Cross chain

```typescript
import { CrossChainBuilder } from 'intents.js';

const crossChainBuilder = await CrossChainBuilder.createInstance(chainConfigs);

const result = await crossChainBuilder.swapCrossChain(source, destination, account, 1, 56);
```

### 5. Fetch the Onchain Transaction Receipt

After the transaction is executed, you can fetch the receipt:

```typescript
const receipt = await intentBuilder.getReceipt(1, result.userOpHash.solved_hash);

const txHash = receipt.result.receipt.transactionHash;

console.log(receipt.result.reason); // PROCESSING_STATUS_ON_CHAIN

console.log(
  `View your tx onchain using any explorer:
   Hash: ${txHash}
   tx link: https://etherscan.io/tx/${txHash}`,
);
```

## Utility Functions

The SDK offers several utility functions for managing conversions and amounts:

- `toBigInt(value: bigint | number): ProtoBigInt`
- `floatToWei(amount: number): bigint`
- `weiToFloat(wei: bigint): number`
- `tokenToFloat(amount: bigint, decimals: number): number`
- `floatToToken(amount: number, decimals: number): bigint`
- `amountToBigInt(amount: number, decimal: number): ProtoBigInt`

## Sending a conventional userOp

The Borsa network is fully compatible with the ERC-4337 standard and can operate as a bundler for standard userOps.

```typescript
await intentBuilder.executeStandardUserOps(account, ChainID, {
  calldata: '0x', // optional
  callGasLimit: CALL_GAS_LIMIT,
  maxFeePerGas: MAX_FEE_PER_GAS,
  maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  verificationGasLimit: VERIFICATION_GAS_LIMIT,
});
```

## Contributing

Contributions to `intents.js` are welcome! Please refer to our contributing guidelines for more information.

## License

This project is licensed under the [MIT License](LICENSE).
