import { IntentBuilder } from './IntentBuilder';
import { Account } from './Account';
import { Asset, Stake, Loan } from './index';
import { ChainConfig, UserOpExecutionResponse } from './types';

export class CrossChainBuilder {
  private constructor(private readonly intentBuilder: IntentBuilder) { }

  /**
   * Creates an instance of CrossChainBuilder
   * @param chainConfigs Chain configurations for all supported chains
   */
  static async createInstance(chainConfigs: Record<number, ChainConfig>): Promise<CrossChainBuilder> {
    const intentBuilder = await IntentBuilder.createInstance(chainConfigs);
    return new CrossChainBuilder(intentBuilder);
  }

  /**
   * Executes a cross-chain swap
   * @param src Asset on the source chain
   * @param dest Asset on the target chain
   * @param account User's account
   * @param sourceChainId Source chain ID
   * @param destChainId Destination chain ID
   * @param recipient sending this to another  wallet?
   */
  async swapCrossChain(
    src: Asset,
    dest: Asset,
    account: Account,
    sourceChainId: number,
    destChainId: number,
    recipient?: string
  ): Promise<UserOpExecutionResponse> {
    return this.intentBuilder.execute(
      src,
      dest,
      account,
      {
        sourceChainId,
        destChainId,
        recipient
      }
    );
  }

  /**
   * Executes a cross-chain stake operation
   * @param sourceAsset Asset to stake from source chain
   * @param targetStake Stake on the target chain
   * @param account User's account
   * @param sourceChainId Source chain ID
   * @param destChainId Destination chain ID
   * @param recipient sending this to another  wallet?
   */
  async stakeCrossChain(
    sourceAsset: Asset,
    targetStake: Stake,
    account: Account,
    sourceChainId: number,
    destChainId: number,
    recipient?: string
  ): Promise<UserOpExecutionResponse> {
    return this.intentBuilder.execute(
      sourceAsset,
      targetStake,
      account,
      {
        sourceChainId,
        destChainId,
        recipient,
      }
    );
  }

  /**
   * Executes a cross-chain loan operation
   * @param sourceAsset Asset to use as collateral from source chain
   * @param targetLoan Loan on the target chain
   * @param account User's account
   * @param sourceChainId Source chain ID
   * @param destChainId Destination chain ID
   * @param recipient sending this to another  wallet?
   */
  async loanCrossChain(
    sourceAsset: Asset,
    targetLoan: Loan,
    account: Account,
    sourceChainId: number,
    destChainId: number,
    recipient?: string
  ): Promise<UserOpExecutionResponse> {
    return this.intentBuilder.execute(
      sourceAsset,
      targetLoan,
      account,
      {
        sourceChainId,
        destChainId,
        recipient
      }
    );
  }

  /**
   * Gets chain configuration for a specific chain
   * @param chainId Chain ID
   */
  getChainConfig(chainId: number): ChainConfig {
    return this.intentBuilder.getChainConfig(chainId);
  }

  /**
   * Gets transaction receipt
   * @param chainId Chain ID
   * @param solvedHash Transaction hash
   */
  async getReceipt(chainId: number, solvedHash: string) {
    return this.intentBuilder.getReceipt(chainId, solvedHash);
  }
}
