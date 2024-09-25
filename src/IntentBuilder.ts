import { BytesLike, ethers } from 'ethers';
import { ChainConfig } from './types';
import { ENTRY_POINT } from './constants';
import { Client, UserOperationBuilder } from 'userop';
import { FromState, State, ToState } from './index';
import { Asset, Intent, Loan, Stake } from '.';
import fetch from 'isomorphic-fetch';
import { Account } from './Account';

/**
 * Facilitates the building and execution of Intent transactions.
 */
export class IntentBuilder {
  /**
   * Private constructor to enforce the use of the factory method for creating instances.
   */
  private constructor(
    private _clients: Map<number, Client>,
    private _chainConfigs: Map<number, ChainConfig>,
  ) {}

  /**
   * Factory method to create an instance of IntentBuilder using chain configurations.
   * @param chainConfigs A record of chain IDs to their corresponding configurations.
   * @returns A new instance of IntentBuilder.
   */
  static async createInstance(chainConfigs: Record<number, ChainConfig>): Promise<IntentBuilder> {
    const clients = new Map<number, Client>();
    const configs = new Map<number, ChainConfig>();

    for (const [chainId, config] of Object.entries(chainConfigs)) {
      const numericChainId = Number(chainId);
      clients.set(numericChainId, await Client.init(config.bundlerUrl));
      configs.set(numericChainId, config);
    }

    return new IntentBuilder(clients, configs);
  }

  /**
   * Executes a blockchain transaction transforming one state to another.
   * @param from The initial state of the transaction.
   * @param to The final state after the transaction.
   * @param account The user account performing the transaction.
   * @param chainId the custom chain id for the transaction.
   * (important: though chainId is not required field which will be removed in future, we need it because our test network using custom chain IDs)
   * @returns A promise that resolves when the transaction has been executed.
   */
  async execute(from: State, to: State, account: Account, chainId: number): Promise<string> {
    // TODO:: will be remove in future
    if (chainId === undefined || chainId === 0) {
      throw new Error('chainId is null or zero');
    }
    // Ensure the chain IDs match for multi chain
    // TODO:: it will be revised for the cross chain integration
    if (!from.chainId?.equals(to.chainId)) {
      throw new Error('Chain IDs do not match');
    }

    const client = this._clients.get(chainId);
    if (!client) {
      throw new Error(`Client for chain ID ${chainId} not found`);
    }

    const chainConfig = this._chainConfigs.get(chainId);
    if (!chainConfig) {
      throw new Error(`Configuration for chain ID ${chainId} not found`);
    }

    const intents = new Intent({
      from: this.setFrom(from),
      to: this.setTo(to),
    });

    const sender = account.getSender(chainId);
    const intent = ethers.toUtf8Bytes(JSON.stringify(intents));
    const nonce = await account.getNonce(chainId, sender);
    const initCode = await account.getInitCode(chainId, nonce);

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
    const signature = await this.sign(chainId, account, builder);
    builder.setSignature(signature);
    const res = await client.sendUserOperation(builder);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const solvedHash = (res as any).userOpHash.solved_hash;
    return solvedHash;
  }

  async executeStandardUserOps(account: Account, chainId: number, calldata?: string): Promise<string> {
    const client = this._clients.get(chainId);
    if (!client) {
      throw new Error(`Client for chain ID ${chainId} not found`);
    }

    const chainConfig = this._chainConfigs.get(chainId);
    if (!chainConfig) {
      throw new Error(`Configuration for chain ID ${chainId} not found`);
    }

    const sender = account.getSender(chainId);
    const nonce = await account.getNonce(chainId, sender);
    const initCode = await account.getInitCode(chainId, nonce);

    const builder = new UserOperationBuilder()
      .useDefaults({ sender })
      .setCallData(calldata ?? ethers.toUtf8Bytes('0x'))
      .setPreVerificationGas('0x493E0')
      .setMaxFeePerGas('0x493E0')
      .setMaxPriorityFeePerGas('0')
      .setVerificationGasLimit('0x493E0')
      .setCallGasLimit('0xC3500')
      .setNonce(nonce)
      .setInitCode(initCode);
    const signature = await this.sign(chainId, account, builder);
    builder.setSignature(signature);
    const res = await client.sendUserOperation(builder);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const solvedHash = (res as any).userOpHash.solved_hash;
    return solvedHash;
  }

  /**
   * Gets the chain configuration for a specific chain ID.
   * @param chainId The ID of the chain.
   * @returns The ChainConfig object for the specified chain.
   * @throws Error if the chain configuration doesn't exist.
   */
  getChainConfig(chainId: number): ChainConfig {
    const config = this._chainConfigs.get(chainId);
    if (!config) {
      throw new Error(`Chain configuration for chain ID ${chainId} not found`);
    }
    return config;
  }

  /**
   * Helper method to determine the source state for a transaction.
   * @param state The state to be evaluated.
   * @returns The determined source state.
   */
  private setFrom(state: State): FromState {
    switch (true) {
      case state instanceof Asset:
        return { case: 'fromAsset', value: state };
      case state instanceof Loan:
        return { case: 'fromLoan', value: state };
      case state instanceof Stake:
        return { case: 'fromStake', value: state };
      default:
        return { case: undefined };
    }
  }

  /**
   * Helper method to determine the target state for a transaction.
   * @param state The state to be evaluated.
   * @returns The determined target state.
   */
  private setTo(state: State): ToState {
    switch (true) {
      case state instanceof Asset:
        return { case: 'toAsset', value: state };
      case state instanceof Stake:
        return { case: 'toStake', value: state };
      case state instanceof Loan:
        return { case: 'toLoan', value: state };
      default:
        return { case: undefined };
    }
  }

  /**
   * Signs a transaction using the account details and transaction builder.
   * @param chainId The chain ID where the signature is applicable.
   * @param account The account performing the signing.
   * @param builder The UserOperationBuilder containing transaction details.
   * @returns The signature as a string.
   */
  private async sign(chainId: number, account: Account, builder: UserOperationBuilder) {
    const userOp = builder.getOp();
    const packedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'bytes32', 'bytes32', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32'],
      [
        userOp.sender,
        userOp.nonce.toString(),
        ethers.keccak256(userOp.initCode as BytesLike),
        ethers.keccak256(userOp.callData as BytesLike),
        userOp.callGasLimit.toString(),
        userOp.verificationGasLimit.toString(),
        userOp.preVerificationGas.toString(),
        userOp.maxFeePerGas.toString(),
        userOp.maxPriorityFeePerGas.toString(),
        ethers.keccak256(userOp.paymasterAndData as BytesLike),
      ],
    );

    const enc = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'address', 'uint256'],
      [ethers.keccak256(packedData), ENTRY_POINT, chainId],
    );

    const userOpHash = ethers.keccak256(enc);
    return await account.signer.signMessage(ethers.getBytes(userOpHash));
  }

  /**
   * Retrieves the transaction receipt for a completed transaction using its hash.
   * @param chainId The chain ID associated with the transaction.
   * @param solvedHash The hash of the transaction.
   * @returns A promise that resolves to the transaction receipt.
   */
  public async getReceipt(chainId: number, solvedHash: string) {
    const config = this._chainConfigs.get(chainId);
    if (!config) {
      throw new Error(`Chain configuration for chain ID ${chainId} not found`);
    }
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

    const resReceipt = await fetch(config.bundlerUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    return await resReceipt.json();
  }
}
