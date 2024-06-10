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
import { IntentBuilder, Projects } from 'intents.js';
```

## Usage

### 1. Initializing the SDK

Create an instance of the `IntentSDK`:

```tsx
const intentBuilder = new IntentBuilder();
```

### 2. Configuration

After initializing the SDK, you need to configure it with your signing key and node URL. Replace the placeholders with your actual signing key and node URL:

```tsx
const nodeUrl = '<Your_Node_URL_Here>';
```


### 3. Creating an Intent

To create an intent with the `intents.js` SDK, you must specify the nature of the transaction you want to execute. This involves defining the source (from) and destination (to) assets, including their types, addresses, and the amounts involved. An intent encapsulates all the details required to execute a transaction between two parties or within the blockchain environment.

Here’s how you can structure the creation of an intent:

1. **Define Sender**: The blockchain address that initiates the intent. This should be the address of the user or contract initiating the transaction.
   
2. **Set Transaction Modes**: Define the `fromMode` and `toMode` to specify the types of operations, such as 'currency', 'loan', or 'staking'. Each mode dictates how the SDK processes the intent.
   
3. **Select Tokens and Amounts**: Choose the tokens for the source and destination. For the `fromSelectedToken` and `toSelectedToken`, use the actual token contract addresses. Specify the `inputValue` and `toAmount` to set how much of each token should be involved in the transaction.
   
4. **Specify Projects (Optional)**: For operations involving specific projects or protocols, such as staking or loans, identify the project using the `Projects` class which provides standardized addresses for known entities.

Example of creating a staking intent:

```tsx
const intent = intentBuilder.createIntent(
  sender,               // Sender's address
  fromMode,             // e.g., 'currency'
  fromSelectedToken,    // Address of the token being sent
  inputValue,           // Amount of the token to send
  toMode,               // e.g., 'staking'
  toSelectedToken,      // Address of the token to receive
  toAmount,             // Amount of the token to receive
  fromSelectedProject,  // Associated project for the 'from' part (if any)
  toSelectedProject     // Associated project for the 'to' part, e.g., Lido for staking
);
```


### 4. Execute the Intent

After setting up your intents array, the next step is to execute these intents using the `IntentBuilder`. This process involves calling the `execute` method on your `intentBuilder` instance, passing in the necessary parameters such as the intents array, your signing key, and the node URL. The execution is handled asynchronously.

```tsx
intentBuilder
  .execute(intent, signer, nodeUrl)
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

