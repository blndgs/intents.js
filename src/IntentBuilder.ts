import { ethers } from 'ethers';
import { CHAIN_ID, ENTRY_POINT } from './constants';
import { Client, UserOperationBuilder } from 'userop';
import { CHAINS, FromState, State, ToState } from './index';
import { Asset, Intent, Loan, Stake } from './';
import fetch from 'isomorphic-fetch';
import { Account } from './Account';

/**
 * Facilitates the building and execution of Intent transactions.
 */
export class IntentBuilder {
  /**
   * Private constructor to enforce the use of the factory method for object creation.
   */
  private constructor(
    private _client: Client,
    private _bundlerUrl: string,
  ) {}

  /**
   * Factory method to create an instance of IntentBuilder.
   * @param bundlerUrl The URL for the transaction bundler service.
   * @returns A new instance of IntentBuilder.
   */
  static async createInstance(bundlerUrl: string) {
    return new IntentBuilder(await Client.init(bundlerUrl), bundlerUrl);
  }

  /**
   * Executes a blockchain transaction transforming one state to another.
   * @param from The initial state of the transaction.
   * @param to The final state after the transaction.
   * @param account The user account performing the transaction.
   * @returns A promise that resolves when the transaction has been executed.
   */
  async execute(from: State, to: State, account: Account): Promise<void> {
    const intents = new Intent({
      from: this.setFrom(from),
      to: this.setTo(to),
    });

    const intent = ethers.utils.toUtf8Bytes(JSON.stringify(intents));
    // TODO: hardcoded chainID, should be changed soon
    const nonce = await account.getNonce(CHAINS.Ethereum, CHAINS.Ethereum);
    const initCode = await account.getInitCode(nonce);

    const builder = new UserOperationBuilder()
      .useDefaults({ sender: account.sender })
      .setCallData(intent)
      .setPreVerificationGas('0x493E0')
      .setMaxFeePerGas('0x493E0')
      .setMaxPriorityFeePerGas('0')
      .setVerificationGasLimit('0x493E0')
      .setCallGasLimit('0xC3500')
      .setNonce(nonce)
      .setInitCode(initCode);

    const signature = await this.sign(account, builder);
    builder.setSignature(signature);

    const res = await this._client.sendUserOperation(
      builder,
      // , { onBuild: op => console.log('Signed UserOperation:', op), }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const solvedHash = (res as any).userOpHash.solved_hash;

    return await this.getReceipt(solvedHash);
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
   * Signs a transaction using the user's account.
   * @param account The user's account used for signing.
   * @param builder The UserOperationBuilder with the transaction details.
   * @returns A promise containing the signature.
   */
  private async sign(account: Account, builder: UserOperationBuilder) {
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
    return await account.signer.signMessage(ethers.utils.arrayify(userOpHash));
  }

  /**
   * Fetches the receipt for a blockchain transaction using its hash.
   * @param solvedHash The hash of the transaction.
   * @returns A promise that resolves to the transaction receipt.
   */
  private async getReceipt(solvedHash: string) {
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

    const resReceipt = await fetch(this._bundlerUrl, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    return await resReceipt.json();
  }
}
