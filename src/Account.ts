import { ethers, JsonRpcProvider } from 'ethers';
import { ENTRY_POINT, FACTORY } from './constants';
import { Presets } from 'userop';
import { tokenToFloat, weiToFloat } from './utils';
import { ChainConfigs } from './types';

export class Account {
  private accounts: Map<number, { sender: string; provider: JsonRpcProvider }> = new Map();

  /**
   * Private constructor to enforce the use of factory methods for instantiation.
   * @param signer The ethers Signer used for transaction signing.
   */
  private constructor(public signer: ethers.Signer) {}

  /**
   * Creates an instance of the Account class with associated chain configurations.
   * Each chain ID is set up with its specific sender address and JSON RPC provider.
   * @param signer The ethers Signer for signing transactions.
   * @param chainConfigs Configuration mapping chain IDs to their configurations.
   * @returns A new instance of the Account class populated with sender addresses and providers per chain.
   */
  static async createInstance(signer: ethers.Signer, chainConfigs: ChainConfigs): Promise<Account> {
    const account = new Account(signer);
    await Promise.all(
      Object.entries(chainConfigs).map(async ([chainId, config]) => {
        const sender = await Account.getSender(signer, config.bundlerUrl);
        const provider = new JsonRpcProvider(config.rpcUrl);
        account.accounts.set(Number(chainId), { sender, provider });
      }),
    );
    return account;
  }

  /**
   * Retrieves the sender's Ethereum address by initializing a builder preset with the specified bundler URL.
   * @param signer The ethers Signer for signing transactions.
   * @param bundlerUrl URL of the bundler to customize sender address generation.
   * @param salt Optional nonce or unique identifier to customize the sender address generation further.
   * @param factory Optional factory address to interact with when generating the sender.
   * @returns The Ethereum address as a string.
   */
  static async getSender(signer: ethers.Signer, bundlerUrl: string, salt: number = 0): Promise<string> {
    // Convert salt to a number, then to a hex string
    const simpleAccount = await Presets.Builder.SimpleAccount.init(signer, bundlerUrl, {
      factory: FACTORY,
      salt: salt,
    });
    return simpleAccount.getSender();
  }

  /**
   * Generates initialization code for smart contract interactions based on a provided nonce.
   * @param chainId The chain ID for which the initialization code needs to be generated.
   * @param nonce The nonce used in the initialization code.
   * @returns The initialization code as a hexadecimal string.
   */
  async getInitCode(chainId: number, nonce: string): Promise<string> {
    const account = this.accounts.get(chainId);
    if (!account) {
      throw new Error(`No account found for chain ID ${chainId}`);
    }

    let ownerAddress = await this.signer.getAddress();
    ownerAddress = ownerAddress.substring(2); // Remove 0x value
    return nonce !== '0'
      ? '0x'
      : `${FACTORY}5fbfb9cf000000000000000000000000${ownerAddress}0000000000000000000000000000000000000000000000000000000000000000`;
  }

  /**
   * Fetches the current nonce for a given sender address from a smart contract on a specific chain.
   * @param chainId The chain ID where the query should be executed.
   * @param sender The sender's address to query the nonce for.
   * @returns The nonce as a string.
   */
  async getNonce(chainId: number, sender: string): Promise<string> {
    const account = this.accounts.get(chainId);
    if (!account) {
      throw new Error(`No account found for chain ID ${chainId}`);
    }
    const abi = [
      {
        inputs: [
          { internalType: 'address', name: 'sender', type: 'address' },
          { internalType: 'uint192', name: 'key', type: 'uint192' },
        ],
        name: 'getNonce',
        outputs: [{ internalType: 'uint256', name: 'nonce', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    const contract = new ethers.Contract(ENTRY_POINT, abi, account.provider);

    try {
      const nonce = await contract.getNonce(sender, '0');
      return nonce.toString();
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw error;
    }
  }

  /**
   * Adds balance to the account for testing purposes, default is 0.5 ETH.
   * @param chainId The chain ID where the operation should be executed.
   * @param supply The amount of ETH to add to the account.
   */
  async faucet(chainId: number, supply = 0.5): Promise<void> {
    const account = this.accounts.get(chainId);
    if (!account) {
      throw new Error(`No account found for chain ID ${chainId}`);
    }
    const method = 'tenderly_addBalance';
    const params = [[account.sender], '0x' + (supply * 10 ** 18).toString(16)];
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1,
    };

    try {
      const response = await account.provider.send(jsonRpcRequest.method, jsonRpcRequest.params);
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  /**
   * Retrieves the balance of the account in ETH or a specified ERC-20 token.
   * @param chainId The chain ID to fetch the balance from.
   * @param tokenAddress Optional address of the ERC-20 token contract, defaults to ETH.
   * @returns The balance as a number formatted to a human-readable format.
   */
  async getBalance(chainId: number, tokenAddress?: string): Promise<number> {
    const account = this.accounts.get(chainId);
    if (!account) {
      throw new Error(`No account found for chain ID ${chainId}`);
    }
    if (!tokenAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      // Handle ETH balance
      const balance = await account.provider.getBalance(account.sender);
      return weiToFloat(balance);
    }

    const abi = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ];

    const contract = new ethers.Contract(tokenAddress, abi, account.provider);
    const [balance, decimals] = await Promise.all([contract.balanceOf(account.sender), contract.decimals()]);
    return tokenToFloat(balance, decimals);
  }

  /**
   * Retrieves the sender's Ethereum address for a specific chain ID.
   * This method accesses the sender address stored in the account's map that matches the provided chain ID.
   * @param chainId The chain ID for which the sender address is required.
   * @returns The sender's Ethereum address as a string.
   * @throws An error if no account is found for the specified chain ID.
   */
  getSender(chainId: number): string {
    const account = this.accounts.get(chainId);
    if (!account) {
      throw new Error(`No account found for chain ID ${chainId}`);
    }
    return account.sender;
  }

  /**
   * Retrieves the JSON RPC Provider for a specific chain ID.
   * This method accesses the provider stored in the account's map that matches the provided chain ID,
   * allowing interactions with the blockchain network specified by that chain ID.
   * @param chainId The chain ID for which the JSON RPC Provider is required.
   * @returns The JSON RPC Provider associated with the specified chain ID.
   * @throws An error if no account is found for the specified chain ID.
   */
  getProvider(chainId: number): JsonRpcProvider {
    const account = this.accounts.get(chainId);
    if (!account) {
      throw new Error(`No account found for chain ID ${chainId}`);
    }
    return account.provider;
  }
}
