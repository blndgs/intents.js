import { Asset, Intent, BigInt as ProtoBigInt } from 'blndgs-model';
import {
  toBigInt,
  floatToWei,
  weiToFloat,
  tokenToFloat,
  floatToToken,
  amountToBigInt,
  generateSignature,
  computeUserOpHash,
  computeMessageHash,
  verifySignature,
  buildUserOp,
} from '../src/utils';
import { ethers } from 'ethers';
import { Account } from '../src/Account';
import { UserOperationBuilder } from 'userop';
import { ChainConfig } from '../src/types';
import { TIMEOUT } from './constants';

describe('Utility Functions', () => {
  describe('toBigInt', () => {
    it('should convert BigNumber to ProtoBigInt', () => {
      const bigintValue = BigInt('1000000000000000000');
      const result = toBigInt(bigintValue);
      expect(result).toBeInstanceOf(ProtoBigInt);
      expect(result.value).toEqual(new Uint8Array([13, 224, 182, 179, 167, 100, 0, 0]));
    });

    it('should convert number to ProtoBigInt', () => {
      const result = toBigInt(1000000);
      expect(result).toBeInstanceOf(ProtoBigInt);
      expect(result.value).toEqual(new Uint8Array([15, 66, 64]));
    });

    it('should throw error for negative numbers', () => {
      expect(() => toBigInt(-1)).toThrow();
    });
  });

  describe('floatToWei', () => {
    it('should convert float to Wei', () => {
      const result = floatToWei(1.5, 18);
      expect(result.toString()).toBe('1500000000000000000');
    });

    it('should handle very small numbers', () => {
      const result = floatToWei(0.000000000000000001, 18);
      expect(result.toString()).toBe('1');
    });
  });

  describe('weiToFloat', () => {
    it('should convert Wei to float', () => {
      const wei = BigInt('1500000000000000000');
      const result = weiToFloat(wei);
      expect(result).toBe(1.5);
    });

    it('should handle very large numbers', () => {
      const wei = BigInt('1000000000000000000000000000000');
      const result = weiToFloat(wei);
      expect(result).toBe(1000000000000); // 1 trillion ETH
    });
  });

  describe('tokenToFloat', () => {
    it('should convert token amount to float', () => {
      const amount = BigInt('1500000000');
      const result = tokenToFloat(amount, 6);
      expect(result).toBe(1500);
    });

    it('should handle different decimal places', () => {
      const amount = BigInt('1500000000000000000');
      const result = tokenToFloat(amount, 18);
      expect(result).toBe(1.5);
    });
  });

  describe('floatToToken', () => {
    it('should convert float to token amount', () => {
      const result = floatToToken(1500, 6);
      expect(result.toString()).toBe('1500000000');
    });

    it('should handle different decimal places', () => {
      const result = floatToToken(1.5, 18);
      expect(result.toString()).toBe('1500000000000000000');
    });
  });

  describe('amountToBigInt', () => {
    it('should convert float amount to ProtoBigInt within acceptable margin', () => {
      const result = amountToBigInt(0.1, 18);
      expect(result).toBeInstanceOf(ProtoBigInt);
      // 0.1 ETH in wei is close to 100000000000000000
      const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
      const expectedValue = BigInt('100000000000000000');
      const difference = bigintValue > expectedValue ? bigintValue - expectedValue : expectedValue - bigintValue;

      // Allow for a small margin of error (e.g., 10 wei)
      expect(difference).toBeLessThanOrEqual(BigInt(10));
    });

    it('should handle different decimal places', () => {
      const result = amountToBigInt(100, 6);
      expect(result).toBeInstanceOf(ProtoBigInt);
      // 100 USDC with 6 decimals is 100000000
      const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
      expect(bigintValue.toString()).toBe('100000000');
    });

    it('should throw error for negative numbers', () => {
      expect(() => amountToBigInt(-0.1, 18)).toThrow('Amount must be a positive number');
    });

    it('should handle very small numbers', () => {
      const result = amountToBigInt(0.000000000000000001, 18);
      const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
      expect(bigintValue.toString()).toBe('1');
    });

    it('should handle whole numbers accurately', () => {
      const result = amountToBigInt(1, 18);
      const bigintValue = BigInt(`0x${Buffer.from(result.value).toString('hex')}`);
      expect(bigintValue.toString()).toBe('1000000000000000000');
    });
  });
});

describe('computeUserOpHash', () => {
  it('should compute a valid hash for a UserOperation', () => {
    const mockUserOp = {
      sender: '0x1234567890123456789012345678901234567890',
      nonce: '1',
      initCode: '0x',
      callData: '0x1234',
      callGasLimit: '1000000',
      verificationGasLimit: '1000000',
      preVerificationGas: '1000000',
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '1000000000',
      paymasterAndData: '0x',
    };

    const mockBuilder = {
      getOp: jest.fn().mockReturnValue(mockUserOp),
    } as unknown as UserOperationBuilder;
    const expectedHash = '0xfb65960f1001da5618a675bb640a3dcf9c2d6446c1dc2cb29dd9cd17ebdc6756';
    const hash = computeUserOpHash(1, mockBuilder);
    expect(hash).toEqual(expectedHash);
  });
});

describe('computeMessageHash', () => {
  it('should compute a valid hash for multiple UserOperations', () => {
    const mockUserOp1 = {
      sender: '0x1234567890123456789012345678901234567890',
      nonce: '1',
      initCode: '0x',
      callData: '0x1234',
      callGasLimit: '1000000',
      verificationGasLimit: '1000000',
      preVerificationGas: '1000000',
      maxFeePerGas: '1000000000',
      maxPriorityFeePerGas: '1000000000',
      paymasterAndData: '0x',
    };

    const mockUserOp2 = {
      ...mockUserOp1,
      sender: '0x0987654321098765432109876543210987654321',
    };

    const mockBuilder1 = {
      getOp: jest.fn().mockReturnValue(mockUserOp1),
    } as unknown as UserOperationBuilder;

    const mockBuilder2 = {
      getOp: jest.fn().mockReturnValue(mockUserOp2),
    } as unknown as UserOperationBuilder;

    const chainIds = [1, 56];

    const hash = computeMessageHash(chainIds, [mockBuilder1, mockBuilder2]);
    const expectedHsh = '0xd9838e154a554803476cd7fdc53c9837e3e43e466cc13ae55848885901ab4150';
    expect(hash).toEqual(expectedHsh);
  });

  it('should throw an error if chainIDs and builders lengths do not match', () => {
    const mockBuilder = {} as UserOperationBuilder;
    const chainIds = [1, 2];

    expect(() => computeMessageHash(chainIds, [mockBuilder])).toThrow('Number of chainIDs and userOps must match');
  });
});

describe('generateSignature', () => {
  it('should generate a valid signature for a message hash', async () => {
    const messageHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const mockAccount = {
      signer: {
        signMessage: jest.fn().mockResolvedValue('0xsignature123'),
      },
    } as unknown as Account;

    const signature = await generateSignature(messageHash, mockAccount);
    expect(signature).toBe('0xsignature123');
    expect(mockAccount.signer.signMessage).toHaveBeenCalledWith(ethers.getBytes(messageHash));
  });
});

describe('verifySignature', () => {
  it('should verify a valid signature', async () => {
    const messageHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const signature = '0xvalidSignature123';
    const mockAddress = '0x1234567890123456789012345678901234567890';

    const mockAccount = {
      signer: {
        getAddress: jest.fn().mockResolvedValue(mockAddress),
      },
    } as unknown as Account;

    // Mock ethers.verifyMessage to return the mock address
    jest.spyOn(ethers, 'verifyMessage').mockReturnValue(mockAddress);

    const isValid = await verifySignature(messageHash, signature, mockAccount);
    expect(isValid).toBe(true);
    expect(ethers.verifyMessage).toHaveBeenCalledWith(ethers.getBytes(messageHash), signature);
    expect(mockAccount.signer.getAddress).toHaveBeenCalled();
  });

  it('should return false for an invalid signature', async () => {
    const messageHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const signature = '0xinvalidSignature123';
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const invalidAddress = '0x0987654321098765432109876543210987654321';

    const mockAccount = {
      signer: {
        getAddress: jest.fn().mockResolvedValue(mockAddress),
      },
    } as unknown as Account;

    // Mock ethers.verifyMessage to return a different address
    jest.spyOn(ethers, 'verifyMessage').mockReturnValue(invalidAddress);

    const isValid = await verifySignature(messageHash, signature, mockAccount);
    expect(isValid).toBe(false);
    expect(ethers.verifyMessage).toHaveBeenCalledWith(ethers.getBytes(messageHash), signature);
    expect(mockAccount.signer.getAddress).toHaveBeenCalled();
  });
});

describe('Cross-Chain ECDSA Signature', () => {
  let account: Account;
  beforeAll(async () => {
    // TODO:: change it to as per testUtils
    const privateKey = 'e8776ff1bf88707b464bda52319a747a71c41a137277161dcabb9f821d6c0bd7';
    const wallet = new ethers.Wallet(privateKey);

    const mockChainConfigs: Record<number, ChainConfig> = {
      137: {
        // Polygon
        rpcUrl: 'https://virtual.polygon.rpc.tenderly.co/f359f5fb-6bf7-4a0b-a1c9-61f72e6dc0a7',
        bundlerUrl: 'https://polygon.bundler.dev.balloondogs.network',
        factory: '0xd9a6d24030c0DFB0bf78170556a8B671Ec432AAC',
      },
      56: {
        // BSC
        rpcUrl: 'https://virtual.binance.rpc.tenderly.co/4e9d15b6-3c42-43b7-a254-359a7893e8e6',
        bundlerUrl: 'https://bsc.bundler.dev.balloondogs.network',
        factory: '0x61e218301932a2550AE8E4Cd1EcfCA7bE64E57DC',
      },
    };
    account = await Account.createInstance(wallet, mockChainConfigs);
  }, TIMEOUT);
  it('should generate and verify a valid cross-chain signature', async () => {
    const sourceChainID = 137; // Polygon
    const destChainID = 56; // BSC

    // Create states for the intent
    const from = new Asset({
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      amount: amountToBigInt(1, 18),
      chainId: toBigInt(sourceChainID),
    });
    const to = new Asset({
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      amount: amountToBigInt(1, 18),
      chainId: toBigInt(destChainID),
    });

    // Build UserOperations
    const sourceUserOp = await buildUserOp(sourceChainID, account, {
      calldata: ethers.toUtf8Bytes(
        JSON.stringify(new Intent({ from: { case: 'fromAsset', value: from }, to: { case: 'toAsset', value: to } })),
      ),
      maxPriorityFeePerGas: '1000000000',
      verificationGasLimit: '100000',
      callGasLimit: '100000',
      preVerificationGas: '21000',
      maxFeePerGas: '20000000000',
    });

    const destUserOp = await await buildUserOp(destChainID, account, {
      calldata: ethers.toUtf8Bytes(
        JSON.stringify(new Intent({ from: { case: 'fromAsset', value: from }, to: { case: 'toAsset', value: to } })),
      ),
      maxPriorityFeePerGas: '1000000000',
      verificationGasLimit: '100000',
      callGasLimit: '100000',
      preVerificationGas: '21000',
      maxFeePerGas: '20000000000',
    });

    // Generate cross-chain signature
    const chainIDs = [sourceChainID, destChainID];
    const userOps = [sourceUserOp, destUserOp];

    const messageHash = computeMessageHash(chainIDs, userOps);
    const signature = await generateSignature(messageHash, account);
    console.log('messageHash', messageHash);
    console.log('signature', signature);
    // Verify the signature
    const isValid = await verifySignature(messageHash, signature, account);
    expect(isValid).toBe(true);

    // Check if the signature matches the one from the Solidity test
    const expectedSignature =
      '21eea4f85e597719d9aaf71aa97048a9b5943f4b43d8b1d505c67f8b01b1acba5567323c8baeb1667e90ba1643b84a494f86d17ea801c8adc14a90871199b2d51c';
    expect(signature.slice(2)).toBe(expectedSignature);
  });
});
