# Intents.js SDK

![NPM Version](https://img.shields.io/npm/v/intents.js)
![codecov](https://codecov.io/gh/blndgs/intents.js/graph/badge.svg?token=TAVORU8E7D)

## Getting Started

See intents.js documentation at [docs.balloondogs.network](https://docs.balloondogs.network/solution/sdk)

### 1. Installation

To include `intents.js` in your project, ensure you have Node.js and npm installed in your environment and run the following command:

```bash
npm install intents.js
```

### 2. Setup

Import `intents.js` into your project to begin defining intents:

```typescript
import { Account, IntentBuilder, PROJECTS, CHAINS, toBigInt, amountToBigInt, Asset, Stake } from 'intents.js';
import { ethers } from 'ethers';

const chainConfigs = {
  1: {
    rpcUrl: 'YOUR_ETH_RPC_URL',
    bundlerUrl: 'https://eth.bundler.balloondogs.network',
  },
  56: {
    rpcUrl: 'YOUR_BNB_RPC_URL',
    bundlerUrl: 'https://bsc.bundler.balloondogs.network',
  },
};

const intentBuilder = await IntentBuilder.createInstance(chainConfigs);

const signer = new ethers.Wallet('your private key');

const account = await Account.createInstance(signer, chainConfigs);
```

### 3. Creating an Intent

To create and execute an intent with the `intents.js` SDK, you need to specify the details of
the transaction you want to perform. This involves defining the source (from) and destination (to)
assets, including their types, addresses, and amounts. These types could be either another asset
which indicates asset swaps, or could be stakes or loan supply to a DeFi protocol

Here's an example of creating and executing a swap intent:

```typescript
const amount = 0.1;
const ethAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const ethDecimals = 18;

const from = new Asset({
  address: ethAddress,
  amount: amountToBigInt(amount, ethDecimals),
  chainId: toBigInt(CHAINS.Ethereum),
});

const to = new Stake({
  amount: amountToBigInt(amount, ethDecimals),
  address: PROJECTS.Lido,
  chainId: toBigInt(CHAINS.Ethereum),
});
```

### 4. Execute the intent

```typescript
// 1 is the chain id we are executing the transaction on, this can be configured from the
//chainConfigs object
try {
  const solvedHash = await intentBuilder.execute(from, to, account, 1);
  console.log('Intent executed successfully.');
} catch (error) {
  console.error('Error executing intent:', error);
}
```

#### 4b. Sending a conventional userop and skipping Balloondogs solver

```typescript
await intentBuilder.executeStandardUserOps(account, ChainID, {
  calldata: '0x', // optional
  callGasLimit: CALL_GAS_LIMIT,
  maxFeePerGas: MAX_FEE_PER_GAS,
  maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  verificationGasLimit: VERIFICATION_GAS_LIMIT,
});
```

### 5. Fetch onchain receipt of executed transaction

```typescript

const receipt = await intentBuilder.getReceipt(1, solvedHash)

const txHash = receipt.result.receipt.transactionHash

console.log(`
View your tx onchain using any explorer: \n

Hash: ${txHash}
BNBScan: https://bscscan.com/tx/${txHash}
`
```

### 6. Utility Functions

The SDK provides several utility functions for handling token amounts and conversions:

- `toBigInt(value: bigint | number): ProtoBigInt`
- `floatToWei(amount: number): bigint`
- `weiToFloat(wei: bigint): number`
- `tokenToFloat(amount: bigint, decimals: number): number`
- `floatToToken(amount: number, decimals: number): bigint`
- `amountToBigInt(amount: number, decimal: number): ProtoBigInt`

These functions help in converting between different representations of token amounts.

### 5. Supported Projects

The `PROJECTS` object provides addresses for various DeFi projects:

- Lido
- RocketPool
- Mantle
- Aave
- Compound
- Spark
- SushiSwap

You can use these addresses when interacting with specific protocols.

## Contributing

Contributions to `intents.js` are welcome! Please refer to our contributing guidelines for more information.

## License

This project is licensed under the [MIT License](LICENSE).
