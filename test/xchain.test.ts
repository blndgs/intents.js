import { ethers } from 'ethers';
import { amountToBigInt, hashCrossChainUserOp, hashUserOp, sign, toBigInt, verifySignature } from '../src';
import { UserOperationBuilder } from 'blndgs-userop';
import { Account } from '../src';
import { Asset, Intent } from 'blndgs-model';
import { initTest } from './testUtils';
import { TIMEOUT } from './constants';

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
    const hash = hashUserOp(1, mockBuilder);
    expect(hash).toEqual(expectedHash);
  });
});

describe('UserOperation Hash Tests', () => {
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
    const hash = hashUserOp(1, mockBuilder);

    expect(hash).toEqual(expectedHash);
  });

  it('should compute a valid cross-chain hash for multiple UserOperations', () => {
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
    const hash = hashCrossChainUserOp(chainIds, [mockBuilder1, mockBuilder2]);
    const expectedHash = '0xd9838e154a554803476cd7fdc53c9837e3e43e466cc13ae55848885901ab4150';

    expect(hash).toEqual(expectedHash);
  });

  it('should throw an error if chainIDs and builders lengths do not match', () => {
    const mockBuilder = {} as UserOperationBuilder;
    const chainIds = [1, 2];

    expect(() => hashCrossChainUserOp(chainIds, [mockBuilder])).toThrow('Number of chainIDs and userOps must match');
  });
});

describe('Account', () => {
  it(
    'should correctly initialize and sign messages',
    async () => {
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
    },
    TIMEOUT,
  );
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

    const messageHash = hashCrossChainUserOp(chainIDs, userOps);
    console.log('Message Hash:', messageHash);

    const signature = await sign(messageHash, account);
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
    const simpleSignature = await sign(simpleMessageHash, account);
    const simpleRecoveredAddress = ethers.verifyMessage(ethers.getBytes(simpleMessageHash), simpleSignature);

    console.log('Simple Message:', simpleMessage);
    console.log('Simple Message Hash:', simpleMessageHash);
    console.log('Simple Signature:', simpleSignature);
    console.log('Simple Recovered Address:', simpleRecoveredAddress);

    expect(simpleRecoveredAddress.toLowerCase()).toBe(actualSignerAddress.toLowerCase());
  });
});

describe('Signature Verification Tests', () => {
  it(
    'should generate and verify a valid cross-chain signature',
    async () => {
      const sender = '0xc47331bcCdB9b68C54ABe2783064a91FeA22271b';
      const sourceChainID = 137; // Polygon
      const destChainID = 56; // BSC

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

      const chainIDs = [sourceChainID, destChainID];
      const userOps = [sourceUserOp, destUserOp];

      const privateKey = 'e8776ff1bf88707b464bda52319a747a71c41a137277161dcabb9f821d6c0bd7';
      const wallet = new ethers.Wallet(privateKey);
      const configs = await initTest();
      const account = await Account.createInstance(wallet, configs);

      const actualSignerAddress = await account.signer.getAddress();

      const messageHash = hashCrossChainUserOp(chainIDs, userOps);
      const signature = await sign(messageHash, account);
      const isValid = await verifySignature(messageHash, signature, account);

      expect(isValid).toBe(true);

      const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
      expect(recoveredAddress.toLowerCase()).toBe(actualSignerAddress.toLowerCase());
    },
    TIMEOUT,
  );
});

describe('CLI Integration Tests', () => {
  it(
    'should match Go CLI outputs',
    async () => {
      const goSignedHash = '0x4501ef6b08a4b39e1effc8a14c6feb5435c9cc87db20b4080f37cb11c7361013';
      const sender = '0x8Ee0051fDb9Bb3e3Ac94faa30d31895FA9A3ADC5';
      const sourceChainID = 137; // Polygon
      const destChainID = 56; // BSC

      const from = new Asset({
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        amount: amountToBigInt(1, 18),
        chainId: toBigInt(sourceChainID),
      });

      const to = new Asset({
        address: '0x1adB950d8bB3dA4bE104211D5AB038628e477fE6',
        amount: amountToBigInt(1, 18),
        chainId: toBigInt(destChainID),
      });

      const calldata = ethers.toUtf8Bytes(
        JSON.stringify(new Intent({ from: { case: 'fromAsset', value: from }, to: { case: 'toStake', value: to } })),
      );

      const sourceUserOp = new UserOperationBuilder()
        .useDefaults({ sender })
        .setCallData(calldata)
        .setPreVerificationGas('626688')
        .setMaxFeePerGas('0')
        .setMaxPriorityFeePerGas('0')
        .setVerificationGasLimit('628384')
        .setCallGasLimit('800000')
        .setNonce('4')
        .setInitCode('0x');

      const destUserOp = new UserOperationBuilder();
      destUserOp.useDefaults(sourceUserOp.getOp());

      const chainIDs = [sourceChainID, destChainID];
      const userOps = [sourceUserOp, destUserOp];

      // Debugging step: Log serialized UserOperations
      console.log('Serialized Source UserOperation:', sourceUserOp.getOp());
      console.log('Serialized Destination UserOperation:', destUserOp.getOp());

      const messageHash = hashCrossChainUserOp(chainIDs, userOps);

      // Debugging step: Log the computed hash
      console.log('Computed Message Hash:', messageHash);

      // Verify the signature
      const privateKey = 'bd981a4345ea3bb934e2aa129e92b9ea5272d20468221ddbc8f2c2384c793da6';
      const wallet = new ethers.Wallet(privateKey);
      const configs = await initTest();
      const account = await Account.createInstance(wallet, configs);

      const signature = await sign(messageHash, account);
      const isValid = await verifySignature(messageHash, signature, account);

      console.log('Generated Signature:', signature);
      console.log('Is Signature Valid:', isValid);

      expect(messageHash).toEqual(goSignedHash);
      expect(isValid).toBe(true);
    },
    TIMEOUT,
  );
});
