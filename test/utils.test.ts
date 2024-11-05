// import { BigInt as ProtoBigInt } from 'blndgs-model';
// import { toBigInt, floatToWei, weiToFloat, tokenToFloat, floatToToken, amountToBigInt } from '../src/utils';

// describe('Utility Functions', () => {
//   describe('toBigInt', () => {
//     it('should convert BigNumber to ProtoBigInt', () => {
//       const bigintValue = BigInt('1000000000000000000');
//       const result = toBigInt(bigintValue);
//       expect(result).toBeInstanceOf(ProtoBigInt);
//       expect(result.value).toEqual(new Uint8Array([13, 224, 182, 179, 167, 100, 0, 0]));
//     });

//     it('should convert number to ProtoBigInt', () => {
//       const result = toBigInt(1000000);
//       expect(result).toBeInstanceOf(ProtoBigInt);
//       expect(result.value).toEqual(new Uint8Array([15, 66, 64]));
//     });

//     it('should throw error for negative numbers', () => {
//       expect(() => toBigInt(-1)).toThrow();
//     });
//   });

//   describe('floatToWei', () => {
//     it('should convert float to Wei', () => {
//       const result = floatToWei(1.5, 18);
//       expect(result.toString()).toBe('1500000000000000000');
//     });

//     it('should handle very small numbers', () => {
//       const result = floatToWei(0.000000000000000001, 18);
//       expect(result.toString()).toBe('1');
//     });
//   });

//   describe('weiToFloat', () => {
//     it('should convert Wei to float', () => {
//       const wei = BigInt('1500000000000000000');
//       const result = weiToFloat(wei);
//       expect(result).toBe(1.5);
//     });

//     it('should handle very large numbers', () => {
//       const wei = BigInt('1000000000000000000000000000000');
//       const result = weiToFloat(wei);
//       expect(result).toBe(1000000000000); // 1 trillion ETH
//     });
//   });

//   describe('tokenToFloat', () => {
//     it('should convert token amount to float', () => {
//       const amount = BigInt('1500000000');
//       const result = tokenToFloat(amount, 6);
//       expect(result).toBe(1500);
//     });

//     it('should handle different decimal places', () => {
//       const amount = BigInt('1500000000000000000');
//       const result = tokenToFloat(amount, 18);
//       expect(result).toBe(1.5);
//     });
//   });

//   describe('floatToToken', () => {
//     it('should convert float to token amount', () => {
//       const result = floatToToken(1500, 6);
//       expect(result.toString()).toBe('1500000000');
//     });

//     it('should handle different decimal places', () => {
//       const result = floatToToken(1.5, 18);
//       expect(result.toString()).toBe('1500000000000000000');
//     });
//   });

//   describe('amountToBigInt', () => {
//     it('should convert float amount to ProtoBigInt within acceptable margin', () => {
//       const result = amountToBigInt(0.1, 18);
//       expect(result).toBeInstanceOf(ProtoBigInt);
//       // 0.1 ETH in wei is close to 100000000000000000
//       const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
//       const expectedValue = BigInt('100000000000000000');
//       const difference = bigintValue > expectedValue ? bigintValue - expectedValue : expectedValue - bigintValue;

//       // Allow for a small margin of error (e.g., 10 wei)
//       expect(difference).toBeLessThanOrEqual(BigInt(10));
//     });

//     it('should handle different decimal places', () => {
//       const result = amountToBigInt(100, 6);
//       expect(result).toBeInstanceOf(ProtoBigInt);
//       // 100 USDC with 6 decimals is 100000000
//       const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
//       expect(bigintValue.toString()).toBe('100000000');
//     });

//     it('should throw error for negative numbers', () => {
//       expect(() => amountToBigInt(-0.1, 18)).toThrow('Amount must be a positive number');
//     });

//     it('should handle very small numbers', () => {
//       const result = amountToBigInt(0.000000000000000001, 18);
//       const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
//       expect(bigintValue.toString()).toBe('1');
//     });

//     it('should handle whole numbers accurately', () => {
//       const result = amountToBigInt(1, 18);
//       const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
//       expect(bigintValue.toString()).toBe('1000000000000000000');
//     });
//   });
// });
