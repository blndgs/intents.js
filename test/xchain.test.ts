import { ethers } from 'ethers';
import {
  amountToBigInt,
  appendXCallData,
  hashCrossChainUserOp,
  hashUserOp,
  sign,
  toBigInt,
  verifyCrossChainSignature,
  verifySignature,
} from '../src';
import { UserOperationBuilder } from 'blndgs-userop';
import { Account } from '../src';
import { Asset, Intent, Stake } from 'blndgs-model';
import { initTest } from './testUtils';
import { TIMEOUT } from './constants';

describe('computeUserOpHash', () => {
  it('should compute a valid hash for a UserOperation', () => {
    const userOp = new UserOperationBuilder()
      .setSender('0x8Ee0051fDb9Bb3e3Ac94faa30d31895FA9A3ADC5')
      .setNonce(1)
      .setInitCode('0x')
      .setCallData('0x')
      .setCallGasLimit(799488)
      .setVerificationGasLimit(628384)
      .setPreVerificationGas(626688)
      .setMaxFeePerGas(0)
      .setMaxPriorityFeePerGas(0)
      .setPaymasterAndData('0x')
      .setSignature('0x');
    const hashPolygon = hashUserOp(137, userOp);
    const expectedHashPolygon = '0xe54bf247e2bc80896eaaffffdf198c84b411c8b91409567ba1a190e760e5af4e';
    expect(hashPolygon).toEqual(expectedHashPolygon);
    const hashBinance = hashUserOp(56, userOp);
    const expectedHashBinance = '0x41f3506fa26798abb85118021137de878f7dfd5c32e8211f477f650e1c485d79';
    expect(hashBinance).toEqual(expectedHashBinance);
  });
});

describe('UserOperation Aggregation UserOpHash', () => {
  it('should compute a valid cross-chain hash for multiple UserOperations', () => {
    const userOp1 = new UserOperationBuilder()
      .setSender('0x8Ee0051fDb9Bb3e3Ac94faa30d31895FA9A3ADC5')
      .setNonce(1)
      .setInitCode('0x')
      .setCallData('0x')
      .setCallGasLimit(799488)
      .setVerificationGasLimit(628384)
      .setPreVerificationGas(626688)
      .setMaxFeePerGas(0)
      .setMaxPriorityFeePerGas(0)
      .setPaymasterAndData('0x')
      .setSignature('0x');

    const userOp2 = new UserOperationBuilder()
      .setSender('0x8Ee0051fDb9Bb3e3Ac94faa30d31895FA9A3ADC5')
      .setNonce(2)
      .setInitCode('0x')
      .setCallData('0x')
      .setCallGasLimit(799488)
      .setVerificationGasLimit(628384)
      .setPreVerificationGas(626688)
      .setMaxFeePerGas(0)
      .setMaxPriorityFeePerGas(0)
      .setPaymasterAndData('0x')
      .setSignature('0x');

    const chainIds = [137, 56];
    const hash = hashCrossChainUserOp(chainIds, [userOp1, userOp2]);
    const expectedHash = '0x10284cff3f554f7c9757c7b0576359a78bea56ff16582725c639d854a52228d6';

    expect(hash).toEqual(expectedHash);
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
      amount: amountToBigInt(0.1, 18),
      chainId: toBigInt(sourceChainID),
    });
    const to = new Stake({
      address: '0x1adB950d8bB3dA4bE104211D5AB038628e477fE6',
      amount: amountToBigInt(1, 6),
      chainId: toBigInt(destChainID),
    });

    const calldata = ethers.toUtf8Bytes(
      JSON.stringify(new Intent({ from: { case: 'fromAsset', value: from }, to: { case: 'toStake', value: to } })),
    );

    // Build source user operation
    const sourceUserOp = new UserOperationBuilder()
      .useDefaults({ sender })
      .setNonce(1)
      .setCallData(calldata)
      .setCallGasLimit(799488)
      .setVerificationGasLimit(628384)
      .setPreVerificationGas(626688)
      .setMaxFeePerGas(0)
      .setMaxPriorityFeePerGas(0)
      .setPaymasterAndData('0x')
      .setSignature('0x');

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

    const isCrossChainSignValid = await verifyCrossChainSignature(userOps, chainIDs, account, signature);
    console.log('Cross-Chain Hash:', messageHash);
    console.log('Generated Signature:', signature);
    console.log('Verification Status:', isCrossChainSignValid);
    const hash1 = hashUserOp(sourceChainID, userOps[0]);
    const hash2 = hashUserOp(destChainID, userOps[1]);
    appendXCallData(userOps, [hash1, hash2], [calldata, calldata]);
    console.log('userOps 0:', userOps[0].getOp());
    console.log('userOps 1:', userOps[1].getOp());
  });
});
