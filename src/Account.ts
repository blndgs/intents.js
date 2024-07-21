import { BytesLike, ethers, Signer } from 'ethers';
import { ENTRY_POINT, FACTORY } from './constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Presets } from 'userop';

export class Account {
  private constructor(
    public signer: Signer,
    public sender: string,
    private _provider: JsonRpcProvider,
  ) {}

  static async createInstance(signer: ethers.Signer, bundlerUrl: string, nodeUrl: string) {
    const sender = await Account.getSender(signer, bundlerUrl);
    return new Account(signer, sender, new ethers.providers.JsonRpcProvider(nodeUrl));
  }

  static async getSender(signer: ethers.Signer, bundlerUrl: string, salt: BytesLike = '0'): Promise<string> {
    const simpleAccount = await Presets.Builder.SimpleAccount.init(signer, bundlerUrl, {
      factory: FACTORY,
      salt: salt,
    });
    return simpleAccount.getSender();
  }

  async getInitCode(nonce: string) {
    let ownerAddress = await this.signer.getAddress();
    // console.log('ownerAddress ' + ownerAddress);
    ownerAddress = ownerAddress.substring(2); // Remove 0x value
    // console.log('nonce ' + nonce);
    return nonce !== '0'
      ? '0x'
      : `${FACTORY}5fbfb9cf000000000000000000000000${ownerAddress}0000000000000000000000000000000000000000000000000000000000000000`;
  }

  async getNonce(sender: string): Promise<string> {
    const abi = [
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

    const contract = new ethers.Contract(ENTRY_POINT, abi, this._provider);

    try {
      const nonce = await contract.getNonce(sender, '0');
      // console.log('Nonce:', nonce.toString());
      return nonce.toString();
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw error;
    }
  }

  async faucet(supply = 0.5): Promise<void> {
    const method = 'tenderly_addBalance';
    const params = [[this.sender], '0x' + (supply * 10 ** 18).toString(16)];
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1,
    };

    try {
      const response = await this._provider.send(jsonRpcRequest.method, jsonRpcRequest.params);
      console.log('Response:', response);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async getBalance(tokenAddress?: string): Promise<string> {
    if (!tokenAddress || tokenAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      // Handle ETH balance
      const balance = await this._provider.getBalance(this.sender);
      return ethers.utils.formatEther(balance);
    }
    const abi = [
      {
        constant: true,
        inputs: [{ name: '_owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: 'balance', type: 'uint256' }],
        type: 'function',
      },
    ];

    const contract = new ethers.Contract(tokenAddress, abi, this._provider);
    const balance = await contract.balanceOf(this.sender);
    return ethers.utils.formatUnits(balance, 18); // Assuming 18 decimals for simplicity
  }
}
