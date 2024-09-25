export interface ChainConfig {
  rpcUrl: string;
  bundlerUrl: string;
  // if not defined, it will use a default one at
  // 0x61e218301932a2550AE8E4Cd1EcfCA7bE64E57DC
  factory?: string;
}

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
