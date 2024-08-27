import { BigInt as ProtoBigInt } from 'blndgs-model';
import { ethers } from 'ethers';
/**
 * Converts a number or bigint into a ProtoBigInt, suitable for serialization and transport in network requests.
 *
 * @param value The numerical value to convert. Must be a positive non-zero integer.
 * @returns A ProtoBigInt instance representing the provided value.
 * @throws Error if the provided value is zero or negative.
 */
export function toBigInt(value: ethers.BigNumber | number): ProtoBigInt {
  // Convert all inputs to BigNumber to simplify handling inside the function
  const bigNumberValue = ethers.BigNumber.isBigNumber(value) ? value : ethers.BigNumber.from(value);

  let hexString = bigNumberValue.toHexString().substring(2); // remove the '0x' prefix
  hexString = hexString.length % 2 !== 0 ? '0' + hexString : hexString; // pad if necessary

  const byteArray = ethers.utils.arrayify('0x' + hexString); // create a Uint8Array
  const protoBigInt = new ProtoBigInt();
  protoBigInt.value = byteArray;
  return protoBigInt;
}
/**
 * Converts a floating-point number to Wei (the smallest unit of Ether).
 *
 * This function takes a floating-point number representing an Ether value
 * and converts it into Wei, which is represented as a `BigNumber`.
 *
 * @param {number} amount - The amount in Ether as a floating-point number.
 * @returns {ethers.BigNumber} - The corresponding amount in Wei as a `BigNumber`.
 */
export function floatToWei(amount: number): ethers.BigNumber {
  // Convert float to string with high precision
  const amountStr = amount.toFixed(18);
  return ethers.utils.parseEther(amountStr);
}

/**
 * Converts a Wei value (as a `BigNumber`) to a floating-point number representing Ether.
 *
 * This function takes a value in Wei and converts it to a floating-point number
 * representing the equivalent amount in Ether.
 *
 * @param {ethers.BigNumber} wei - The amount in Wei as a `BigNumber`.
 * @returns {number} - The corresponding amount in Ether as a floating-point number.
 */
export function weiToFloat(wei: ethers.BigNumber): number {
  // Convert wei to float, limiting to 18 decimal places
  return parseFloat(ethers.utils.formatEther(wei));
}

/**
 * Converts a token amount (as a `BigNumber`) to a floating-point number,
 * using the specified number of decimals for the token.
 *
 * This function is useful for converting token amounts to human-readable
 * floating-point numbers based on the token's decimals.
 *
 * @param {ethers.BigNumber} amount - The amount of tokens as a `BigNumber`.
 * @param {number} decimals - The number of decimal places the token uses.
 * @returns {number} - The corresponding amount as a floating-point number.
 */
export function tokenToFloat(amount: ethers.BigNumber, decimals: number): number {
  return parseFloat(ethers.utils.formatUnits(amount, decimals));
}

/**
 * Converts a floating-point number to a token amount represented as a `BigNumber`,
 * using the specified number of decimals for the token.
 *
 * This function takes a floating-point number and converts it into the smallest
 * unit of the token, based on the token's decimals.
 *
 * @param {number} amount - The amount as a floating-point number.
 * @param {number} decimals - The number of decimal places the token uses.
 * @returns {ethers.BigNumber} - The corresponding amount as a `BigNumber`.
 */
export function floatToToken(amount: number, decimals: number): ethers.BigNumber {
  const amountStr = amount.toFixed(decimals);
  return ethers.utils.parseUnits(amountStr, decimals);
}
