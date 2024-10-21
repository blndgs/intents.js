import { ethers } from 'ethers';
import {
  amountToBigInt,
  computeMessageHash,
  computeUserOpHash,
  generateSignature,
  toBigInt,
  verifySignature,
} from '../src/utils';
import { UserOperationBuilder } from 'userop';
import { Account } from '../src/Account';
import { Asset, Intent } from 'blndgs-model';
import { initTest } from './testUtils';

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
    const expectedHash = '0xd9838e154a554803476cd7fdc53c9837e3e43e466cc13ae55848885901ab4150';
    expect(hash).toEqual(expectedHash);
  });

  it('should throw an error if chainIDs and builders lengths do not match', () => {
    const mockBuilder = {} as UserOperationBuilder;
    const chainIds = [1, 2];

    expect(() => computeMessageHash(chainIds, [mockBuilder])).toThrow('Number of chainIDs and userOps must match');
  });
});

describe('Account', () => {
  it('should correctly initialize and sign messages', async () => {
    const privateKey = 'e8776ff1bf88707b464bda52319a747a71c41a137277161dcabb9f821d6c0bd7';
    const wallet = new ethers.Wallet(privateKey);
    const configs = await initTest();
    // custom signer account for the testing
    const account = await Account.createInstance(wallet, configs);

    const message = 'Hello, World!';
    const messageBytes = ethers.toUtf8Bytes(message);
    const messageHash = ethers.keccak256(messageBytes);

    const signature = await account.signer.signMessage(ethers.getBytes(messageHash));
    const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);

    console.log('Message:', message);
    console.log('Message Hash:', messageHash);
    console.log('Signature:', signature);
    console.log('Account address:', await account.signer.getAddress());
    console.log('Recovered address:', recoveredAddress);

    expect(recoveredAddress.toLowerCase()).toBe((await account.signer.getAddress()).toLowerCase());
  });
});

describe('Cross-Chain ECDSA Signature', () => {
  it('should generate and verify a valid cross-chain signature', async () => {
    const sender = '0xc47331bcCdB9b68C54ABe2783064a91FeA22271b';
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

    const calldata = ethers.toUtf8Bytes(
      JSON.stringify(new Intent({ from: { case: 'fromAsset', value: from }, to: { case: 'toAsset', value: to } })),
    );

    // Build source user operation
    const sourceUserOp = new UserOperationBuilder()
      .useDefaults({ sender })
      .setCallData(calldata)
      .setPreVerificationGas('21000')
      .setMaxFeePerGas('20000000000')
      .setMaxPriorityFeePerGas('1000000000')
      .setVerificationGasLimit('100000')
      .setCallGasLimit('100000')
      .setNonce('0')
      .setInitCode('0x');

    const destUserOp = new UserOperationBuilder();
    destUserOp.useDefaults(sourceUserOp.getOp());

    // Generate cross-chain signature
    const chainIDs = [sourceChainID, destChainID];
    const userOps = [sourceUserOp, destUserOp];

    // Initialize wallet with private key
    const privateKey = 'e8776ff1bf88707b464bda52319a747a71c41a137277161dcabb9f821d6c0bd7';
    const wallet = new ethers.Wallet(privateKey);
    const configs = await initTest();
    const account = await Account.createInstance(wallet, configs);

    const actualSignerAddress = await account.signer.getAddress();
    console.log('Actual Signer Address:', actualSignerAddress);

    const messageHash = computeMessageHash(chainIDs, userOps);
    console.log('Message Hash:', messageHash);

    const signature = await generateSignature(messageHash, account);
    console.log('Generated Signature:', signature);

    const isValid = await verifySignature(messageHash, signature, account);
    console.log('Is signature valid?', isValid);

    const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
    console.log('Recovered Address:', recoveredAddress);
    console.log('Expected Address:', actualSignerAddress);

    expect(recoveredAddress.toLowerCase()).toBe(actualSignerAddress.toLowerCase());
    expect(isValid).toBe(true);

    const simpleMessage = 'Hello, World!';
    const simpleMessageHash = ethers.keccak256(ethers.toUtf8Bytes(simpleMessage));
    const simpleSignature = await generateSignature(simpleMessageHash, account);
    const simpleRecoveredAddress = ethers.verifyMessage(ethers.getBytes(simpleMessageHash), simpleSignature);

    console.log('Simple Message:', simpleMessage);
    console.log('Simple Message Hash:', simpleMessageHash);
    console.log('Simple Signature:', simpleSignature);
    console.log('Simple Recovered Address:', simpleRecoveredAddress);

    expect(simpleRecoveredAddress.toLowerCase()).toBe(actualSignerAddress.toLowerCase());
  });
});
