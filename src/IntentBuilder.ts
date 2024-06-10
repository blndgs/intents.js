import { BytesLike, ethers } from 'ethers';
import { BUNDLER_URL, CHAIN_ID, ENTERY_POINT, FACTORY, NODE_URL, CHAINS } from './Constants';
import { Client, Presets, UserOperationBuilder } from 'userop';
import { Intent, Asset, Stake, Loan } from 'blndgs-model/dist/asset_pb';

import { Projects } from './Projects';

export class IntentBuilder {
  capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  public createIntent(
    sender: string,
    fromMode: string,
    fromSelectedToken: string,
    inputValue: string,
    toMode: string,
    toSelectedToken: string,
    toAmount: string,
    fromSelectedProject = '',
    toSelectedProject = '',
  ): Intent {
    let fromCaseValue: { case: 'fromAsset' | 'fromLoan'; value: Asset | Loan } | undefined;
    let toCaseValue: { case: 'toAsset' | 'toLoan' | 'toStake'; value: Asset | Loan | Stake } | undefined;

    // Determine the "from" asset or loan
    if (fromMode === 'currency') {
      fromCaseValue = {
        case: 'fromAsset',
        value: new Asset({
          address: fromSelectedToken,
          amount: this.createBigInt(inputValue),
          chainId: this.createBigInt(CHAINS.Ethereum),
        }),
      };
    } else if (fromMode === 'loan') {
      const projectAddress = fromSelectedProject ? Projects[this.capitalize(fromSelectedProject)] : undefined;
      fromCaseValue = {
        case: 'fromLoan',
        value: new Loan({
          asset: fromSelectedToken,
          amount: this.createBigInt(inputValue),
          address: projectAddress,
          chainId: this.createBigInt(CHAINS.Ethereum),
        }),
      };
    }

    // Determine the "to" asset, loan, or stake
    if (toMode === 'currency') {
      toCaseValue = {
        case: 'toAsset',
        value: new Asset({
          address: toSelectedToken,
          amount: this.createBigInt(toAmount),
          chainId: this.createBigInt(CHAINS.Ethereum),
        }),
      };
    } else if (toMode === 'loan') {
      const projectAddress = toSelectedProject ? Projects[this.capitalize(toSelectedProject)] : undefined;
      toCaseValue = {
        case: 'toLoan',
        value: new Loan({
          asset: toSelectedToken,
          amount: this.createBigInt(toAmount),
          address: projectAddress,
          chainId: this.createBigInt(CHAINS.Ethereum),
        }),
      };
    } else if (toMode === 'staking') {
      toCaseValue = {
        case: 'toStake',
        value: new Stake({
          address: Projects.Lido,
          chainId: this.createBigInt(CHAINS.Ethereum),
        }),
      };
    }

    return new Intent({
      sender: sender,
      from: fromCaseValue,
      to: toCaseValue,
    });
  }

  public createBigInt(value: string) {
    const buffer = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i++) {
      buffer[i] = parseInt(value.charAt(i), 10);
    }
    return {
      value: buffer,
    };
  }

  public async getSender(signer: ethers.Signer, salt: BytesLike = '0'): Promise<string> {
    const simpleAccount = await Presets.Builder.SimpleAccount.init(signer, BUNDLER_URL, {
      factory: FACTORY,
      salt: salt,
    });
    const sender = simpleAccount.getSender();

    return sender;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async fetchWithNodeFetch(url: string, options: any) {
    const isNode = typeof window === 'undefined';
    if (isNode) {
      const fetchModule = await import('node-fetch');
      const fetch = fetchModule.default;
      return fetch(url, options);
    } else {
      return window.fetch(url, options);
    }
  }

  async execute(intents: Intent, signer: ethers.Signer, nodeUrl: string): Promise<void> {
    let ownerAddress = await signer.getAddress();
    console.log('ownerAddress ' + ownerAddress);
    ownerAddress = ownerAddress.substring(2, ownerAddress.length); //remove 0x value
    const sender = intents.sender;

    const intent = ethers.utils.toUtf8Bytes(JSON.stringify(intents));
    const nonce = await this.getNonce(sender, nodeUrl);
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

    const client = await Client.init(BUNDLER_URL);

    const res = await client.sendUserOperation(builder, {
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

    const reciept = await resReceipt.json();
    console.log(reciept);
  }

  private async getInitCode(nonce: string, ownerAddress: string) {
    console.log('nonce ' + nonce);
    return nonce !== '0'
      ? '0x'
      : `${FACTORY}5fbfb9cf000000000000000000000000${ownerAddress}0000000000000000000000000000000000000000000000000000000000000000`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getSignature(signer: ethers.Signer, builder: any) {
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
      [ethers.utils.keccak256(packedData), ENTERY_POINT, CHAIN_ID],
    );

    const userOpHash = ethers.utils.keccak256(enc);
    return await signer.signMessage(ethers.utils.arrayify(userOpHash));
  }

  private async getNonce(sender: string, nodeUrl: string) {
    const provider = new ethers.providers.JsonRpcProvider(nodeUrl);
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

    // Create a contract instance
    const contract = new ethers.Contract(ENTERY_POINT, abi, provider);

    try {
      const nonce = await contract.getNonce(sender, '0');
      console.log('Nonce:', nonce.toString());
      return nonce.toString();
    } catch (error) {
      console.error('Error getting nonce:', error);
    }
  }

  public async faucet(addrss: string) {
    // Import ethers

    // Connect to your Ethereum node or gateway
    const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

    // Define the JSON-RPC request for the tenderly_addBalance method
    const method = 'tenderly_addBalance';
    const params = [[addrss], '0x6f05b59d3b20000'];
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1, // The ID can be any number or string
    };

    try {
      const response = await provider.send(jsonRpcRequest.method, jsonRpcRequest.params);
      console.log('Response:', response);
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  public async checkBalance(address: string, nodeUrl: string, tokenAddress?: string): Promise<string> {
    const provider = new ethers.providers.JsonRpcProvider(nodeUrl);

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
        // ETH balance check
        const balance = await provider.getBalance(address);
        const formattedBalance = ethers.utils.formatEther(balance);
        console.log(`ETH Balance: ${formattedBalance}`);
        return formattedBalance;
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      return '0';
    }
  }
}
