import { BigInt as ProtoBigInt } from 'blndgs-model';
import { ethers } from 'ethers';

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

// // normalizeChainId normalize the chain ID
// // important: not in use but need it in future
// export function normalizeChainId(chainId: ProtoBigInt | bigint | number): number {
//   if (typeof chainId === 'number') {
//     return chainId;
//   }
//   if (typeof chainId === 'bigint') {
//     return Number(chainId);
//   }
//   if ('value' in chainId && chainId.value instanceof Uint8Array) {
//     // Convert Uint8Array to number
//     return parseInt(Buffer.from(chainId.value).toString('hex'), 16);
//   }
//   throw new Error('Unsupported chainId format');
// }
