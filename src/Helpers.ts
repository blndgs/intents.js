import { ethers } from 'ethers';
import { NODE_URL } from './Constants';

export async function faucet(address: string): Promise<void> {
  const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

  const method = 'tenderly_addBalance';
  const params = [[address], '0x6f05b59d3b20000'];
  const jsonRpcRequest = {
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: 1,
  };

  try {
    const response = await provider.send(jsonRpcRequest.method, jsonRpcRequest.params);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

export const NonceRetrieverABI = [
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


export async function checkBalance(address: string, tokenAddress?: string): Promise<string> {
  const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

  try {
    if (tokenAddress) {
      // ERC20 balance check
      const abi = [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function',
        },
      ];

      const contract = new ethers.Contract(tokenAddress, abi, provider);
      const balance = await contract.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(balance, 18);
      console.log(`ERC20 Balance: ${formattedBalance}`);
      return formattedBalance;
    } else {
      // Ethereum balance check
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.utils.formatEther(balance);
      console.log(`Ethereum Balance: ${formattedBalance}`);
      return formattedBalance;
    }
  } catch (error) {
    console.error('Error checking balance:', error);
    return '0';
  }
}

export function createBigInt(value: number): { value: Uint8Array } {
  const inputString = value.toString();

  const buffer = new Uint8Array(inputString.length);
  for (let i = 0; i < inputString.length; i++) {
    buffer[i] = parseInt(inputString.charAt(i), 10);
  }
  return { value: buffer };
}
