import { BytesLike, ethers } from 'ethers';
import { ChainConfig, isUserOpExecutionResponse, UserOpExecutionResponse, UserOpOptions } from './types';
import {
  CALL_GAS_LIMIT,
  MAX_FEE_PER_GAS,
  MAX_PRIORITY_FEE_PER_GAS,
  PRE_VERIFICATION_GAS,
  USER_AGENT,
  VERIFICATION_GAS_LIMIT,
} from './constants';
import {
  appendXCallData,
  hashUserOp,
  sign,
  userOpBuilder,
} from './utils';
import { Client, UserOperationBuilder } from 'blndgs-userop';
import { FromState, State, ToState } from './index';
import { Asset, Intent, Loan, Stake } from '.';
import fetch from 'isomorphic-fetch';
import { Account } from './Account';
import { aggregate, hashCrossChainUserOp, verifyCrossChainSignature } from './crosschain';

/**
 * Facilitates the building and execution of Intent transactions.
 */
export class IntentBuilder {
  /**
   * Private constructor to enforce the use of the factory method for creating instances.
   * @param _clients Map of chain IDs to their corresponding Client instances.
   * @param _chainConfigs Map of chain IDs to their corresponding ChainConfig objects.
   */
  private constructor(
    private _clients: Map<number, Client>,
    private _chainConfigs: Map<number, ChainConfig>,
  ) { }

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
      // setting user-agent
      clients.set(numericChainId, await Client.init(config.bundlerUrl, USER_AGENT));
      configs.set(numericChainId, config);
    }

    return new IntentBuilder(clients, configs);
  }

  /**
   * Executes a blockchain transaction transforming one state to another.
   * @param from The initial state of the transaction.
   * @param to The final state after the transaction.
   * @param account The user account performing the transaction.
   * @param sourceChainId The source chain ID for the transaction.
   * @param destChainId Optional destination chain ID for cross-chain transactions.
   * @returns A promise that resolves to the transaction execution response(s).
   * (important: though chainId is not required field which will be removed in future, we need it because our test network using custom chain IDs)
   */
  async execute(
    from: State,
    to: State,
    account: Account,
    sourceChainId: number,
    destChainId?: number,
  ): Promise<UserOpExecutionResponse> {
    if (sourceChainId === undefined || sourceChainId === 0) {
      throw new Error('sourceChainId is null or zero');
    }

    const intents = new Intent({
      from: this.setFrom(from),
      to: this.setTo(to),
    });

    const calldata = ethers.toUtf8Bytes(JSON.stringify(intents));

    if (destChainId && destChainId !== sourceChainId) {
      return this.executeCrossChain(sourceChainId, destChainId, account, calldata);
    } else {
      return this.executeSingleChain(sourceChainId, account, calldata);
    }
  }

  /**
   * Executes a single-chain transaction.
   * @param account The user account performing the transaction.
   * @param chainId The chain ID for the transaction.
   * @param calldata The calldata for the transaction.
   * @param opts Optional UserOperation options.
   * @returns A promise that resolves to the transaction execution response.
   */
  private async executeSingleChain(
    chainId: number,
    account: Account,
    calldata: BytesLike,
    opts?: Partial<UserOpOptions>,
  ): Promise<UserOpExecutionResponse> {
    const client = this.getClient(chainId);
    const builder = await this.createUserOpBuilder(chainId, account, calldata, opts);
    const userOpHash = hashUserOp(chainId, builder);
    const signature = await sign(userOpHash, account);
    builder.setSignature(signature);

    const res = await client.sendUserOperation(builder);

    if (!isUserOpExecutionResponse(res)) {
      throw new Error(`Unexpected response from Bundler`);
    }

    return res;
  }

  /**
   * Executes a cross-chain transaction.
   * @param account The user account performing the transaction.
   * @param sourceChainId The source chain ID for the transaction.
   * @param destChainId The destination chain ID for the transaction.
   * @param calldata The calldata for the transaction.
   * @returns A promise that resolves to an array of transaction execution responses.
   */
  private async executeCrossChain(
    sourceChainId: number,
    destChainId: number,
    account: Account,
    calldata: BytesLike,
  ): Promise<UserOpExecutionResponse> {
    // Step 1: Create UserOperationBuilders for source and destination chains
    const sourceBuilder = await this.createUserOpBuilder(sourceChainId, account, calldata);
    const destBuilder = await this.createUserOpBuilder(destChainId, account, calldata);
    const builders = [sourceBuilder, destBuilder];
    const chainIDs = [sourceChainId, destChainId];

    // Step 2: Generate cross-chain hash
    const operationHashes = builders.map((builder, index) => hashUserOp(chainIDs[index], builder));
    const crossChainHash = hashCrossChainUserOp(chainIDs, builders);

    // Step 3: Sign the cross-chain hash
    const signature = await sign(crossChainHash, account);

    // Step 4: Verify the signature
    const isValid = await verifyCrossChainSignature(builders, chainIDs, account, signature);
    if (!isValid) {
      throw new Error('Cross-chain signature verification failed');
    }
    // Step 5: Generate and append XCallData
    appendXCallData(builders, operationHashes, [calldata, calldata]);

    builders.forEach(builder => builder.setSignature(signature));

    // aggregate
    aggregate(sourceBuilder, destBuilder);

    // Step 6: Send the UserOperation
    const client = this.getClient(sourceChainId);
    // tx to be send on source chain only.
    const res = await client.sendUserOperation(sourceBuilder);
    if (!isUserOpExecutionResponse(res)) {
      throw new Error(`Unexpected response from Bundler`);
    }
    return res;
  }

  /**
   * Executes a standard userops without running and solving through Balloondogs.
   * @param account The user account performing the transaction.
   * @param chainId the custom chain id for the transaction.
   * (important: though chainId is not required field which will be removed in future, we need it because our test network using custom chain IDs)
   * @param opts execution options. You will be able to configure the amount of gas and fee you spend
   * @returns A promise that resolves when the transaction has been executed.
   */
  async executeStandardUserOps(
    chainId: number,
    account: Account,
    opts: UserOpOptions,
  ): Promise<UserOpExecutionResponse> {
    return this.executeSingleChain(chainId, account, opts.calldata ?? '0x', {
      maxFeePerGas: opts.maxFeePerGas,
      callGasLimit: opts.callGasLimit,
      verificationGasLimit: opts.verificationGasLimit ?? VERIFICATION_GAS_LIMIT,
      maxPriorityFeePerGas: opts.maxPriorityFeePerGas,
    });
  }

  /**
   * Retrieves the Client instance for a given chain ID.
   * @param chainId The chain ID to get the Client for.
   * @returns The Client instance for the specified chain ID.
   * @throws Error if the Client for the specified chain ID is not found.
   */
  private getClient(chainId: number): Client {
    const client = this._clients.get(chainId);
    if (!client) throw new Error(`Client for chain ID ${chainId} not found`);
    return client;
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
    if (state instanceof Asset) return { case: 'fromAsset', value: state };
    if (state instanceof Loan) return { case: 'fromLoan', value: state };
    if (state instanceof Stake) return { case: 'fromStake', value: state };
    return { case: undefined };
  }

  /**
   * Helper method to determine the target state for a transaction.
   * @param state The state to be evaluated.
   * @returns The determined target state.
   */
  private setTo(state: State): ToState {
    if (state instanceof Asset) return { case: 'toAsset', value: state };
    if (state instanceof Stake) return { case: 'toStake', value: state };
    if (state instanceof Loan) return { case: 'toLoan', value: state };
    return { case: undefined };
  }

  /**
   * Creates a UserOperationBuilder instance with the specified parameters.
   * @param chainId The chain ID for the UserOperation.
   * @param account The user account associated with the UserOperation.
   * @param calldata The calldata for the UserOperation.
   * @param opts Optional UserOperation options.
   * @returns A promise that resolves to a UserOperationBuilder instance.
   */
  private async createUserOpBuilder(
    chainId: number,
    account: Account,
    calldata: BytesLike,
    opts?: Partial<UserOpOptions>,
  ): Promise<UserOperationBuilder> {
    return userOpBuilder(chainId, account, {
      calldata,
      maxPriorityFeePerGas: opts?.maxPriorityFeePerGas ?? MAX_PRIORITY_FEE_PER_GAS,
      verificationGasLimit: opts?.verificationGasLimit ?? VERIFICATION_GAS_LIMIT,
      callGasLimit: opts?.callGasLimit ?? CALL_GAS_LIMIT,
      preVerificationGas: PRE_VERIFICATION_GAS,
      maxFeePerGas: opts?.maxFeePerGas ?? MAX_FEE_PER_GAS,
    });
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
