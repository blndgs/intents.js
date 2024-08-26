import { BytesLike, ethers, Signer } from 'ethers';
import { ENTRY_POINT, ENTRYPOINT_ABI, FACTORY } from './constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Presets } from 'userop';

export class Account {
  /**
   * Private constructor to prevent direct instantiation.
   * @param signer The Signer object used for transaction signing.
   * @param sender The Ethereum address of the sender.
   * @param _providers The JSON RPC Provider for network interactions.
   */
  private constructor(
    public signer: Signer,
    public sender: string,
    private _providers: { [key: number]: JsonRpcProvider },
  ) {}

  /**
   * deprecated please use createMultiChainInstance
   **/
  static async createInstance(signer: ethers.Signer, bundlerUrl: string, nodeUrl: string): Promise<Account> {
    return this.createMultiChainInstance(signer, bundlerUrl, { 1: nodeUrl });
  }

  static async createMultiChainInstance(
    signer: ethers.Signer,
    bundlerUrl: string,
    nodeUrls: {
      [key: number]: string;
    },
  ): Promise<Account> {
    const sender = await Account.getSender(signer, bundlerUrl);
    const providers: { [key: number]: JsonRpcProvider } = {};
    Object.keys(nodeUrls)
      .map(key => Number(key))
      .forEach(key => {
        providers[key] = new ethers.providers.JsonRpcProvider(nodeUrls[key]);
      });

    return new Account(signer, sender, providers);
  }

  /**
   * Get provider by chain ID or throw error
   * @param chainId get provider for chain by Id
   * @private
   * @return chain provider
   */
  private getProvider(chainId: number): JsonRpcProvider {
    if (!this._providers[chainId]) {
      throw Error('No provider found.');
    }
    return this._providers[chainId];
  }

  /**
   * Retrieves the sender's Ethereum address using a predefined builder preset.
   * @param signer The ethers Signer for signing transactions.
   * @param bundlerUrl URL of the bundler.
   * @param salt A nonce or unique identifier to customize the sender address generation.
   * @returns The sender's Ethereum address.
   */
  static async getSender(signer: ethers.Signer, bundlerUrl: string, salt: BytesLike = '0'): Promise<string> {
    const simpleAccount = await Presets.Builder.SimpleAccount.init(signer, bundlerUrl, {
      factory: FACTORY,
      salt: salt,
    });
    return simpleAccount.getSender();
  }

  /**
   * Generates initialization code for smart contract interactions.
   * @param nonce The nonce to use for generating the init code.
   * @returns The initialization code as a hexadecimal string.
   */
  async getInitCode(nonce: number) {
    let ownerAddress = await this.signer.getAddress();
    // console.log('ownerAddress ' + ownerAddress);
    ownerAddress = ownerAddress.substring(2); // Remove 0x value
    // console.log('nonce ' + nonce);
    return nonce !== 0
      ? '0x'
      : `${FACTORY}5fbfb9cf000000000000000000000000${ownerAddress}0000000000000000000000000000000000000000000000000000000000000000`;
  }

  /**
   * Fetches the current nonce for a given sender address from a smart contract.
   * @param fromChainId From state chain ID to ask for nonce
   * @param toChainId To state chain ID to ask for nonce
   * @returns The nonce as a string.
   * @throws Will throw an error if the smart contract call fails.
   */
  async getNonce(fromChainId: number, toChainId: number): Promise<number> {
    const contractFrom = new ethers.Contract(ENTRY_POINT, ENTRYPOINT_ABI, this.getProvider(fromChainId)),
      contractTo = new ethers.Contract(ENTRY_POINT, ENTRYPOINT_ABI, this.getProvider(toChainId));

    try {
      const [fromNonce, toNonce] = await Promise.all([
        contractFrom.getNonce(this.sender, '0').then(Number),
        contractTo.getNonce(this.sender, '0').then(Number),
      ]);

      return fromNonce > toNonce ? fromNonce : toNonce;
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw error;
    }
  }

  /**
   * Adds balance to the account for testing purposes (likely on test networks).
   * @param chainId The Chain ID to faucet the wallet at.
   * @param supply The amount of ETH to add to the account, default is 0.5 ETH.
   */
  async faucet(chainId: number, supply = 0.5): Promise<void> {
    const method = 'tenderly_addBalance';
    const params = [[this.sender], '0x' + (supply * 10 ** 18).toString(16)];
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1,
    };

    try {
      const response = await this.getProvider(chainId).send(jsonRpcRequest.method, jsonRpcRequest.params);
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  /**
   * Retrieves the balance of the account, either in ETH or a specified ERC-20 token.
   * @param chainId The chain ID to get a balance for.
   * @param tokenAddress The address of the ERC-20 token contract, or undefined for ETH.
   * @returns The balance as a string formatted to a human-readable format.
   */
  async getBalance(chainId: number, tokenAddress?: string): Promise<number> {
    if (!tokenAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      // Handle ETH balance
      const balance = await this.getProvider(chainId).getBalance(this.sender);
      return parseFloat(ethers.utils.formatEther(balance));
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
        outputs: [
          {
            name: '',
            type: 'uint8',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ];

    const contract = new ethers.Contract(tokenAddress, abi, this.getProvider(chainId));
    const [balance, decimals] = await Promise.all([contract.balanceOf(this.sender), contract.decimals()]);
    return balance / 10 ** decimals;
  }
}
