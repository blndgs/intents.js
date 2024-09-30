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
import { IntentBuilder, PROJECTS, CHAINS, toBigInt, Asset, Stake } from 'intents.js';
import { ethers } from 'ethers';
```

## Usage

### 1. Initializing the SDK

Create an instance of the `IntentBuilder`:

```typescript
import { ethers } from 'ethers';
import { Account, IntentBuilder } from 'intents.js';

const chainConfigs = {
  // testnet
  888: {
    rpcUrl: 'https://virtual.mainnet.rpc.tenderly.co/13d45a24-2474-431e-8f19-31f251f6cd2a',
    bundlerUrl: 'https://eth.bundler.test.balloondogs.network',
  },
  890: {
    rpcUrl: 'https://virtual.binance.rpc.tenderly.co/4e9d15b6-3c42-43b7-a254-359a7893e8e6',
    bundlerUrl: 'https://bsc.bundler.test.balloondogs.network',
  },
};

const intentBuilder = await IntentBuilder.createInstance(chainConfigs);

const signer = new ethers.Wallet('private key');

const account = await Account.createInstance(signer, chainConfigs);
```

### 2. Creating and Executing an Intent

To create and execute an intent with the `intents.js` SDK, you need to specify the details of the transaction you want to perform. This involves defining the source (from) and destination (to) assets, including their types, addresses, and amounts.

Here's an example of creating and executing a swap intent:

> [!NOTE]
> this uses the `account` and `intentBuilder` we created in the previous snippet

```typescript
import { ethers } from 'ethers';
import { Account, IntentBuilder, toBigInt, amountToBigInt, Asset, Stake } from 'intents.js';

async function executeIntent() {
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

  try {
    await intentBuilder.execute(from, to, account, 888);
    console.log('Intent executed successfully.');
  } catch (error) {
    console.error('Error executing intent:', error);
  }
}

executeIntent();
```

> [!NOTE] > `888` is the chain id we are executing the transaction on, this can be configured from the
> `chainConfigs` object

#### 2b. Sending a conventional userop and skipping Balloondogs solver

```typescript
await intentBuilder.executeStandardUserOps(account, ChainID, {
  calldata: '0x', // optional
  callGasLimit: CALL_GAS_LIMIT,
  maxFeePerGas: MAX_FEE_PER_GAS,
  maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
  verificationGasLimit: VERIFICATION_GAS_LIMIT,
});
```

### 3. Fetch onchain receipt of executed transaction

```typescript

const solvedHash = await intentBuilder.execute(from, to, account, 888)

const receipt = await intentBuilder.getReceipt(888, solvedHash)

const txHash = receipt.result.receipt.transactionHash

console.log(`
View your tx onchain using any explorer: \n

Hash: ${txHash}
BNBScan: https://bscscan.com/tx/${txHash}
`
```

### 4. Utility Functions

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
