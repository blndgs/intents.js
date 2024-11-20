import { BigInt as ProtoBigInt } from 'blndgs-model';
import { BytesLike, ethers } from 'ethers';
import { UserOperationBuilder } from 'blndgs-userop';
import { ENTRY_POINT } from './constants';
import { Account } from './Account';

/**
 * Converts a number or bigint into a ProtoBigInt, suitable for serialization and transport in network requests.
 *
 * @param value The numerical value to convert. Must be a positive non-zero integer.
 * @returns A ProtoBigInt instance representing the provided value.
 * @throws Error if the provided value is zero or negative.
 */
export function toBigInt(value: bigint | number): ProtoBigInt {
  // Convert all inputs to bigint to simplify handling inside the function
  if (typeof value !== 'number' && typeof value !== 'bigint') {
    throw new Error('Unsupported type. Expected a number or bigint.');
  }
  let hexString = BigInt(value).toString(16);

  if (hexString.length % 2 !== 0) hexString = '0' + hexString; // pad if necessary

  const byteArray = ethers.toBeArray(ethers.hexlify('0x' + hexString)); // create a Uint8Array
  const protoBigInt = new ProtoBigInt();
  protoBigInt.value = byteArray;
  return protoBigInt;
}

/**
 * Converts a floating-point number to Wei (the smallest unit of Ether).
 *
 * This function takes a floating-point number representing an Ether value
 * and converts it into Wei, which is represented as a `bigint`.
 *
 * @param {number} amount - The amount in Ether as a floating-point number.
 * @param {number} decimal - The number of decimal places for the token.
 * @returns {bigint} - The corresponding amount in Wei as a `bigint`.
 */
export function floatToWei(amount: number, decimal: number): bigint {
  // Convert float to string with high precision
  const amountStr = amount.toFixed(decimal);
  return ethers.parseUnits(amountStr, decimal);
}

/**
 * Converts a Wei value (as a `bigint`) to a floating-point number representing Ether.
 *
 * This function takes a value in Wei and converts it to a floating-point number
 * representing the equivalent amount in Ether.
 *
 * @param {bigint} wei - The amount in Wei as a `bigint`.
 * @returns {number} - The corresponding amount in Ether as a floating-point number.
 */
export function weiToFloat(wei: bigint): number {
  // Convert wei to float, limiting to 18 decimal places
  return parseFloat(ethers.formatEther(wei));
}

/**
 * Converts a token amount (as a `bigint`) to a floating-point number,
 * using the specified number of decimals for the token.
 *
 * This function is useful for converting token amounts to human-readable
 * floating-point numbers based on the token's decimals.
 *
 * @param {bigint} amount - The amount of tokens as a `bigint`.
 * @param {number} decimals - The number of decimal places the token uses.
 * @returns {number} - The corresponding amount as a floating-point number.
 */
export function tokenToFloat(amount: bigint, decimals: number): number {
  return parseFloat(ethers.formatUnits(amount, decimals));
}

/**
 * Converts a floating-point number to a token amount represented as a `bigint`,
 * using the specified number of decimals for the token.
 *
 * This function takes a floating-point number and converts it into the smallest
 * unit of the token, based on the token's decimals.
 *
 * @param {number} amount - The amount as a floating-point number.
 * @param {number} decimals - The number of decimal places the token uses.
 * @returns {bigint} - The corresponding amount as a `bigint`.
 */
export function floatToToken(amount: number, decimals: number): bigint {
  const amountStr = amount.toFixed(decimals);
  return ethers.parseUnits(amountStr, decimals);
}

/**
 * Converts a floating-point number to a ProtoBigInt representation.
 *
 * This function takes a numeric amount and the number of decimal places for a token,
 * converts it to the smallest unit of the token (considering the decimal places),
 * and then converts that to a ProtoBigInt format suitable for blockchain transactions.
 *
 * @param {number} amount - The amount to convert, as a floating-point number.
 * @param {number} decimal - The number of decimal places for the token (e.g., 18 for ETH).
 * @returns {ProtoBigInt} The amount converted to a ProtoBigInt format.
 *
 * @example
 * // Convert 0.1 ETH to ProtoBigInt
 * const bigIntAmount = amountToBigInt(0.1, 18);
 *
 * @example
 * // Convert 100 USDC to ProtoBigInt (USDC has 6 decimal places)
 * const bigIntAmount = amountToBigInt(100, 6);
 *
 * @throws {Error} If the input amount is negative or if the conversion fails.
 */
export function amountToBigInt(amount: number, decimal: number): ProtoBigInt {
  if (amount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  return toBigInt(floatToToken(amount, decimal));
}

/**
 *  builds a UserOperation using the provided parameters and a UserOperationBuilder.
 *
 * @async
 * @function
 * @param {number} chainId - The ID of the blockchain network (chain)
 * @param {Account} account - The account object.
 * @param {Object} opts - Options for configuring the UserOperation.
 * @returns {Promise<UserOperationBuilder>} A promise that resolves to a UserOperationBuilder object.
 */
export async function userOpBuilder(
  chainId: number,
  account: Account,
  opts: {
    calldata: BytesLike;
    preVerificationGas: string;
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    verificationGasLimit: string;
    callGasLimit: string;
  },
): Promise<UserOperationBuilder> {
  const sender = account.getSender(chainId);
  const nonce = await account.getERC4337Nonce(chainId, sender);
  const initCode = await account.getInitCode(chainId, nonce);

  return new UserOperationBuilder()
    .useDefaults({ sender })
    .setCallData(opts.calldata)
    .setPreVerificationGas(opts.preVerificationGas)
    .setMaxFeePerGas(opts.maxFeePerGas)
    .setMaxPriorityFeePerGas(opts.maxPriorityFeePerGas)
    .setVerificationGasLimit(opts.verificationGasLimit)
    .setCallGasLimit(opts.callGasLimit)
    .setNonce(nonce)
    .setInitCode(initCode);
}

/**
 * Computes the hash for a UserOperation created by UserOperationBuilder.
 *
 * @param {number} chainId - The ID of the blockchain network.
 * @param {UserOperationBuilder} builder - The UserOperationBuilder instance containing the UserOperation details.
 * @returns {string} The computed hash of the UserOperation.
 */
export function hashUserOp(chainId: number, builder: UserOperationBuilder): string {
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

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['bytes32', 'address', 'uint256'],
    [ethers.keccak256(packedData), ENTRY_POINT, chainId],
  );

  return ethers.keccak256(encoded);
}

/**
 * Computes the combined message hash (xChainHash) for cross-chain signing.
 *
 * @param {number[]} chainIDs - An array of chain IDs involved in the cross-chain operation.
 * @param {UserOperationBuilder[]} builders - An array of UserOperationBuilder instances, one for each chain.
 * @returns {string} The computed combined message hash.
 * @throws {Error} If the number of chainIDs doesn't match the number of builders.
 */
export function hashCrossChainUserOp(chainIDs: number[], builders: UserOperationBuilder[]): string {
  if (chainIDs.length !== builders.length) {
    throw new Error('Number of chainIDs and userOps must match');
  }

  // Compute hashes for each UserOperation
  const hashes = builders.map((builder, i) => hashUserOp(chainIDs[i], builder));

  // Sort hashes by byte comparison
  const sortedHashes = hashes.sort((a, b) => {
    const bufferA = ethers.getBytes(a);
    const bufferB = ethers.getBytes(b);
    return Buffer.compare(Buffer.from(bufferA), Buffer.from(bufferB));
  });

  // Concatenate sorted hashes
  const concatenatedHashes = '0x' + sortedHashes.map(h => h.slice(2)).join('');

  // Compute and return the final hash
  return ethers.keccak256(concatenatedHashes);
}

/**
 * Generates the signature for the given message hash using the signer's private key.
 *
 * @param {string} messageHash - The hash of the message to be signed.
 * @param {Account} account - The account object containing the signer.
 * @returns {Promise<string>} A promise that resolves to the generated signature.
 */
export async function sign(messageHash: string, account: Account): Promise<string> {
  const messageHashBytes = ethers.getBytes(messageHash);
  return await account.signer.signMessage(messageHashBytes);
}

/**
 * Verifies the signature against the message hash and signer's address.
 *
 * @param {string} messageHash - The hash of the original message.
 * @param {string} signature - The signature to verify.
 * @param {Account} account - The account object containing the signer.
 * @returns {Promise<boolean>} A promise that resolves to true if the signature is valid, false otherwise.
 */
export async function verifySignature(messageHash: string, signature: string, account: Account): Promise<boolean> {
  const messageHashBytes = ethers.getBytes(messageHash);
  const recoveredAddress = ethers.verifyMessage(messageHashBytes, signature);
  const expectedAddress = await account.signer.getAddress();
  return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
}

/**
 * Verifies the cross-chain signature.
 * @param builders - UserOperationBuilders.
 * @param chainIDs - Array of chain IDs.
 * @param account - The user's account for signing.
 */
export async function verifyCrossChainSignature(
  builders: UserOperationBuilder[],
  chainIDs: number[],
  account: Account,
  signature: string,
): Promise<boolean> {
  const userOpHash = hashCrossChainUserOp(chainIDs, builders);
  return verifySignature(userOpHash, signature, account);
}

/**
 * Generates and appends xCallData for cross-chain UserOperations.
 */
export function appendXCallData(builders: UserOperationBuilder[], entryPoint: string, chainHashes: string[]): void {
  builders.forEach((builder, index) => {
    const xCallData = encodeCrossChainCallData(entryPoint, chainHashes[(index + 1) % chainHashes.length]);
    builder.setCallData(xCallData);
  });
}

/**
 * Encodes cross-chain call data for UserOperations.
 * @param entryPoint - Address of the entry point.
 * @param nextHash - Hash of the next operation in the chain.
 * @returns Encoded call data.
 */
function encodeCrossChainCallData(entryPoint: string, nextHash: string): BytesLike {
  // Use ethers.js or manual ABI encoding
  const abi = ethers.AbiCoder.defaultAbiCoder();
  return abi.encode(['address', 'bytes32'], [entryPoint, nextHash]);
}
