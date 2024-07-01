import { BytesLike, ethers } from 'ethers';
import { BUNDLER_URL, CHAIN_ID, ENTRY_POINT, FACTORY, NODE_URL } from './Constants';
import { NonceRetrieverABI } from './Helpers';
import { Client, Presets, UserOperationBuilder } from 'userop';
import { Intent } from 'blndgs-model/dist/asset_pb';

export class IntentBuilder {
  private constructor(private _client: Client) {}

  static async createInstance() {
    return new IntentBuilder(await Client.init(BUNDLER_URL));
  }

  public async getSender(signer: ethers.Signer, salt: BytesLike = '0'): Promise<string> {
    const simpleAccount = await Presets.Builder.SimpleAccount.init(signer, BUNDLER_URL, {
      factory: FACTORY,
      salt: salt,
    });
    return simpleAccount.getSender();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchWithNodeFetch(url: string, options: any) {
    const isNode = typeof window === 'undefined';
    if (isNode) {
      const fetchModule = await import('node-fetch');
      const fetch = fetchModule.default;
      return fetch(url, options);
    } else {
      return window.fetch(url, options);
    }
  }

  async execute(intents: Intent, signer: ethers.Signer): Promise<void> {
    try {
      let ownerAddress = await signer.getAddress();
      console.log('ownerAddress ' + ownerAddress);
      ownerAddress = ownerAddress.substring(2); // Remove 0x value
      const sender = await this.getSender(signer);

      const intent = ethers.utils.toUtf8Bytes(JSON.stringify(intents));
      const nonce = await this.getNonce(sender);
      const initCode = await this.getInitCode(nonce, ownerAddress);

      const builder = new UserOperationBuilder()
        .useDefaults({ sender })
        .setCallData(intent)
        .setPreVerificationGas('0x493E0')
        .setMaxFeePerGas('0x493E0')
        .setMaxPriorityFeePerGas('0')
        .setVerificationGasLimit('0x493E0')
        .setCallGasLimit('0xC3500')
        .setNonce(nonce)
        .setInitCode(initCode);

      const signature = await this.getSignature(signer, builder);
      builder.setSignature(signature);

      const res = await this._client.sendUserOperation(builder, {
        onBuild: op => console.log('Signed UserOperation:', op),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const solvedHash = (res as any).userOpHash.solved_hash;

      const headers = {
        accept: 'application/json',
        'content-type': 'application/json',
      };

      const body = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [solvedHash],
      });

      const resReceipt = await this.fetchWithNodeFetch(BUNDLER_URL, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      const receipt = await resReceipt.json();
      console.log(receipt);
    } catch (error) {
      console.error('Error executing intent:', error);
    }
  }

  private async getInitCode(nonce: string, ownerAddress: string) {
    console.log('nonce ' + nonce);
    return nonce !== '0'
      ? '0x'
      : `${FACTORY}5fbfb9cf000000000000000000000000${ownerAddress}0000000000000000000000000000000000000000000000000000000000000000`;
  }

  private async getSignature(signer: ethers.Signer, builder: UserOperationBuilder) {
    const packedData = ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        builder.getSender(),
        builder.getNonce(),
        ethers.utils.keccak256(builder.getInitCode()),
        ethers.utils.keccak256(builder.getCallData()),
        builder.getCallGasLimit(),
        builder.getVerificationGasLimit(),
        builder.getPreVerificationGas(),
        builder.getMaxFeePerGas(),
        builder.getMaxPriorityFeePerGas(),
        ethers.utils.keccak256(builder.getPaymasterAndData()),
      ],
    );

    const enc = ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256'],
      [ethers.utils.keccak256(packedData), ENTRY_POINT, CHAIN_ID],
    );

    const userOpHash = ethers.utils.keccak256(enc);
    return await signer.signMessage(ethers.utils.arrayify(userOpHash));
  }

  private async getNonce(sender: string): Promise<string> {
    const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

    const contract = new ethers.Contract(ENTRY_POINT, NonceRetrieverABI, provider);

    try {
      const nonce = await contract.getNonce(sender, '0');
      console.log('Nonce:', nonce.toString());
      return nonce.toString();
    } catch (error) {
      console.error('Error getting nonce:', error);
      throw error;
    }
  }
}
