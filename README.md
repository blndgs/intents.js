Sure, here is the updated documentation with the corrected example code:

# Intents.js SDK

## Getting Started

See intents.js documentation at [docs.balloondogs.network](https://docs.balloondogs.network/solution/sdk)

### 1. Installation

To include `intents.js` in your project, ensure you have Node.js and npm installed in your environment and run the following command:

```bash
npm install intents.js
```

### 2. Setup

Import `intents.js` into your project to begin defining intents:

```tsx
import { IntentBuilder, Projects, Intent, Asset, Stake } from 'intents.js';
import { ethers } from 'ethers';
```

## Usage

### 1. Initializing the SDK

Create an instance of the `IntentBuilder`:

```tsx
const intentBuilder = new IntentBuilder();
```

### 2. Creating an Intent

To create an intent with the `intents.js` SDK, you must specify the nature of the transaction you want to execute. This involves defining the source (from) and destination (to) assets, including their types, addresses, and the amounts involved. An intent encapsulates all the details required to execute a transaction between two parties or within the blockchain environment.

Here’s how you can structure the creation of an intent:

1. **Define Sender**: The blockchain address that initiates the intent. This should be the address of the user or contract initiating the transaction.
2. **Set Transaction Modes**: Define the `fromMode` and `toMode` to specify the types of operations, such as 'currency', 'loan', or 'staking'. Each mode dictates how the SDK processes the intent.
3. **Select Tokens and Amounts**: Choose the tokens for the source and destination. For the `fromSelectedToken` and `toSelectedToken`, use the actual token contract addresses. Specify the `inputValue` and `toAmount` to set how much of each token should be involved in the transaction.
4. **Specify Projects (Optional)**: For operations involving specific projects or protocols, such as staking or loans, identify the project using the `Projects` class which provides standardized addresses for known entities.

Example of creating a staking intent:

```tsx
import { IntentBuilder, Projects, Intent, Asset, Stake } from 'intents.js';
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const intentBuilder = new IntentBuilder();

const Token 'NATIVE';
const amount = 0.1;

const fromCaseValue = {
  case: 'fromAsset',
  value: new Asset({
    address: Token,
    amount: intentBuilder.createBigInt(Number(amount)),
    chainId: intentBuilder.createBigInt(Projects.CHAINS.Ethereum),
  }),
};

const toCaseValue = {
  case: 'toStake',
  value: new Stake({
    address: Projects.Lido,
    chainId: intentBuilder.createBigInt(Projects.CHAINS.Ethereum),
  }),
};

intentBuilder
  .execute(
    new Intent({
      from: fromCaseValue,
      to: toCaseValue,
    }),
    signer,
  )
  .then(() => console.log('Intent executed successfully.'))
  .catch(error => console.error('Error executing intent:', error));
```

### 4. Execute the Intent

After setting up your intents, the next step is to execute these intents using the `IntentBuilder`. This process involves calling the `execute` method on your `intentBuilder` instance, passing in the necessary parameters such as the intents, your signing key, and the node URL. The execution is handled asynchronously.

```tsx
intentBuilder
  .execute(intent, signer)
  .then(() => console.log('Intent executed successfully.'))
  .catch(error => console.error('Error executing intent:', error));
```

### 5. Utilizing the Projects Class for Staking Providers

The `intents.js` SDK simplifies interactions with staking operations through the `Projects` class. This utility class provides quick access to the addresses of well-known staking providers, making it easier to reference them when building staking-related intents.

#### Available Staking Providers:

- `Lido`
- `RocketPool`
- `Mantle`
- `Aave`
- `Compound`
- `Spark`
- `SushiSwap`
