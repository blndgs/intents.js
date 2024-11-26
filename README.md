# Intents.js SDK

![NPM Version](https://img.shields.io/npm/v/intents.js)
![codecov](https://codecov.io/gh/blndgs/intents.js/graph/badge.svg?token=TAVORU8E7D)

## Supported Chains

- [x] Ethereum
- [x] Binance
- [x] Polygon

## Getting Started

You can find the full `intents.js` documentation at [docs.balloondogs.network](https://docs.balloondogs.network/solution/sdk)

### 1. Installation

Install `intents.js` using npm:

```bash
npm install intents.js
```

### 2. Setup

Begin by importing `intents.js` and setting up the `Account` and `IntentBuilder`:

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

### 3. Create an Intent

An intent represents a desired outcome. The intent structure consists of two symmetric source and destination states.

In this example, we are using funds from AAVE (BNB Chain) to stake on Lido (Ethereum):

```typescript
const usdtAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const ethtAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

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

The `execute()` function will then wrap the intent as an [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) userOp and submit it to the BalloonDogs network.

```typescript
const solvedHash = await intentBuilder.execute(source, destination, account);
```

#### 4b. Deposit resulting tokens from intent execution into another address

When staking, supplying loan or swapping tokens, you can deposit the
swapped tokens to be deposited into another address instead of the address
that executed the tx.

The `execute` takes an optional config object as below

```ts
const solvedHash = await intentBuilder.execute(source, destination, account, {
  recipient: '0xAddress',
});
```

### 5. Fetch the Onchain Transaction Receipt

After the transaction is executed, you can fetch the receipt:

```typescript
const receipt = await intentBuilder.getReceipt(1, solvedHash);

const txHash = receipt.result.receipt.transactionHash;

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

The BalloonDogs network is fully compatible with the ERC-4337 standard and can operate as a bundler for standard userOps.

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
