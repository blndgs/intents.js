import { BigNumber } from 'ethers';

/**
 * Represents the chain ID of the blockchain network to be used.
 * Utilizes an environmental variable if available, otherwise defaults to 888.
 * This value is important for ensuring transactions and operations are broadcast to the correct Ethereum network.
 */
export const CHAIN_ID = BigNumber.from(process.env.CHAIN_ID || 888);

/**
 * The address of the entry point smart contract.
 */
export const ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

/**
 * The factory contract address.
 */
export const FACTORY = '0x61e218301932a2550AE8E4Cd1EcfCA7bE64E57DC';

/**
 * partial ABI for ERC-4337 ABI
 */
export const ENTRYPOINT_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      {
        internalType: 'uint192',
        name: 'key',
        type: 'uint192',
      },
    ],
    name: 'getNonce',
    outputs: [
      {
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
