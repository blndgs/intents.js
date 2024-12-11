import { BytesLike } from 'ethers';

/**
 * Configuration for a specific blockchain network.
 */
export interface ChainConfig {
  rpcUrl: string;
  bundlerUrl: string;
}

/**
 * A record of chain configurations, indexed by chain ID.
 * @typedef {Object.<number, ChainConfig>} ChainConfigs
 * @description
 * This type represents a collection of chain configurations.
 * The keys are chain IDs (numbers) and the values are the corresponding ChainConfig objects.
 * @example
 * const configs: ChainConfigs = {
 *   1: { rpcUrl: "https://eth-mainnet.example.com", bundlerUrl: "https://bundler.example.com"},
 *   56: { rpcUrl: "https://bsc-mainnet.example.com", bundlerUrl: "https://bsc-bundler.example.com"}
 * };
 */
export type ChainConfigs = Record<number, ChainConfig>;

/**
 * Constructs a new ChainConfig object configured with the specified RPC and bundler URLs.
 * This function is particularly useful for initializing configuration settings that
 * will be consumed by blockchain client interfaces.
 *
 * @param rpcUrl The URL to the RPC endpoint of a blockchain network, used for making remote procedure calls.
 * @param bundlerUrl The URL to the transaction bundler service, which groups multiple transactions for efficiency.
 * @returns A new ChainConfig object containing the provided URLs.
 */
export function createChainConfig(rpcUrl: string, bundlerUrl: string): ChainConfig {
  return {
    rpcUrl,
    bundlerUrl,
  };
}

/**
 * Options for configuring the user op execution process .
 *
 * @typedef {Object} ExecutionOptions
 * @param {number} sourceChainId - The ID of the source blockchain where the execution starts.
 * @param {number} destChainId - The ID of the destination blockchain where the execution will be completed (optional).
 * @param {string} recipient - The address of the recipient for the execution process (optional).
 */
export interface ExecutionOptions {
  sourceChainId: number;
  destChainId?: number;
  recipient?: string;
}

/**
 * Constructs the options to allow configurability of non Borsa sponsored intents.
 *
 */
export interface UserOpOptions {
  calldata?: BytesLike;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  verificationGasLimit?: string;
  callGasLimit: string;
}

export interface UserOpExecutionResponse {
  userOpHash: {
    success: boolean;
    original_hash: string;
    solved_hash: string;
    trx: string;
  };
}

/**
 *
 * Takes in an object. Then validates that it matches the expected value we are
 * expecting as a response from the Bundler
 *
 * @param obj the object to validate
 */
export function isUserOpExecutionResponse(obj: unknown): obj is UserOpExecutionResponse {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const candidate = obj as Pick<UserOpExecutionResponse, 'userOpHash'>;
  const userOpHash = candidate.userOpHash ?? {};

  return (
    typeof userOpHash.success === 'boolean' &&
    typeof userOpHash.original_hash === 'string' &&
    typeof userOpHash.solved_hash === 'string' &&
    typeof userOpHash.trx === 'string'
  );
}
