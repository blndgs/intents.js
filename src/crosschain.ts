import { UserOperationBuilder } from 'blndgs-userop';
import { ethers } from 'ethers';
import { BytesLike, arrayify } from '@ethersproject/bytes';

const CROSS_CHAIN_MARKER = 0xFFFF;
const MIN_OP_COUNT = 2;
const MAX_OP_COUNT = 3;

const KernelSignatureLength = 69;
const SimpleSignatureLength = 65;

function toBuffer(bytes: BytesLike): Buffer {
  return Buffer.from(arrayify(bytes));
}

/**
 * Aggregates the current UserOperationBuilder with another unsolved cross-chain UserOperationBuilder.
 *
 * @param op - The UserOperationBuilder that acts as the source
 * @param embeddedOp - The UserOperationBuilder to embed
 * @returns void
 * @throws Error if validation fails
 */
export function aggregate(op: UserOperationBuilder, embeddedOp: UserOperationBuilder): void {
  // Validate both main and userop to embed are cross-chain operations
  if (!isCrossChainOperation(op)) {
    throw new Error('Called UserOperationBuilder is not a valid cross-chain userOp');
  }

  if (!isCrossChainOperation(embeddedOp)) {
    throw new Error('UserOperationBuilder to embed is not a valid cross-chain userOp');
  }

  // Get signature index
  const signatureEndIdx = getSignatureEndIdx(toBuffer(op.getSignature()));
  if (signatureEndIdx === 0) {
    throw new Error('Unsigned UserOperationBuilders are not supported');
  }

  // Check existing packed data from the main userop
  const existingPackedData = toBuffer(op.getSignature()).slice(signatureEndIdx);

  // Get the packed data from embedded op
  const packedData = getPackedData(embeddedOp);

  // idempotency check
  if (
    existingPackedData.length === packedData.length + 1 &&
    existingPackedData[0] === 1 &&
    Buffer.compare(existingPackedData.slice(1), packedData) === 0
  ) {
    return;
  }

  const newSignature = Buffer.concat([
    toBuffer(op.getSignature()).slice(0, signatureEndIdx),
    Buffer.from([1]),
    packedData,
  ]);

  op.setSignature(newSignature);
}

function getPackedData(op: UserOperationBuilder): Buffer {
  const buffers: Buffer[] = [];

  //  nonce (32 bytes)
  const nonceBytes = ethers.zeroPadValue(ethers.toBeArray(BigInt(op.getNonce().toString())), 32);
  buffers.push(Buffer.from(nonceBytes));

  //  callGasLimit (8 bytes)
  const callGasLimitBytes = ethers.zeroPadValue(ethers.toBeArray(BigInt(op.getCallGasLimit().toString())), 8);
  buffers.push(Buffer.from(callGasLimitBytes));

  //  preVerificationGas (8 bytes)
  const preVerificationGasBytes = ethers.zeroPadValue(
    ethers.toBeArray(BigInt(op.getPreVerificationGas().toString())),
    8,
  );
  buffers.push(Buffer.from(preVerificationGasBytes));

  //  verificationGasLimit (8 bytes)
  const verificationGasLimitBytes = ethers.zeroPadValue(
    ethers.toBeArray(BigInt(op.getVerificationGasLimit().toString())),
    8,
  );
  buffers.push(Buffer.from(verificationGasLimitBytes));

  // Extract, write hash list from the callData
  const crossChainData = parseCrossChainData(toBuffer(op.getCallData()));
  const hashListBytes = serializeHashList(crossChainData.hashList);

  buffers.push(hashListBytes);

  // include initCode or not
  const initCode = toBuffer(op.getInitCode());
  if (initCode.length > 0) {
    buffers.push(initCode);
  }

  return Buffer.concat(buffers);
}

/**
 * Checks if a UserOperationBuilder is a cross-chain operation. This validates the
 * callData and signature fields for cross-chain data format from the spec
 *
 * @param op - The UserOperationBuilder to check
 * @returns boolean - True if the operation is a cross-chain operation
 */
export function isCrossChainOperation(op: UserOperationBuilder): boolean {
  // Convert BytesLike to Buffer for consistent handling
  const callData = toBuffer(op.getCallData());
  const signature = toBuffer(op.getSignature());

  // Check if callData contains cross-chain data
  const isCallDataCrossChain = isCrossChainData(callData, MIN_OP_COUNT, MAX_OP_COUNT);

  // If signature exists and has content after the signature end index,
  const signatureEndIdx = getSignatureEndIdx(signature);
  const isSignatureCrossChain =
    signature.length > signatureEndIdx && isCrossChainData(signature.slice(signatureEndIdx), 1, MAX_OP_COUNT);

  return isCallDataCrossChain || isSignatureCrossChain;
}

/**
 * Checks if the provided data follows the cross-chain data format.
 *
 * Cross-chain data format:
 * [2 bytes opType (0xFFFF)]
 * [2 bytes length of intent JSON]
 * [Intent JSON]
 * [1 byte hash list length (N)]
 * [Hash List Entries]
 *
 * @param data - The data to check
 * @param minHashListLength - Minimum required length of the hash list
 * @param maxHashListLength - Maximum allowed length of the hash list
 * @returns boolean - True if the data follows cross-chain format
 */
function isCrossChainData(data: Buffer, minHashListLength: number, maxHashListLength: number): boolean {
  try {
    // Minimum length check: 2 (opType) + 2 (intentJSONLength) = 4 bytes
    if (data.length < 4) {
      return false;
    }

    // Check opType marker
    const opType = data.readUInt16BE(0);
    if (opType !== CROSS_CHAIN_MARKER) {
      return false;
    }

    // Read intent JSON length
    const intentJSONLength = data.readUInt16BE(2);

    // Check if data is long enough to contain the intent JSON
    const minLength = 4 + intentJSONLength + 1; // +1 for hash list length
    if (data.length < minLength) {
      return false;
    }

    // Read hash list length
    const hashListLength = data[4 + intentJSONLength];

    // Validate hash list length
    if (hashListLength < minHashListLength || hashListLength > maxHashListLength) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function getSignatureEndIdx(signature: Buffer): number {
  if (signature.length >= 2 && !(signature[0] === 0x30 && signature[1] === 0x78)) {
    const lenSig = signature.length;

    // Check kernel signature
    if (lenSig === KernelSignatureLength) {
      // Cannot have a simple signature length fitting a kernel signature
      return sigHasKernelPrefix(signature) ? KernelSignatureLength : 0;
    }

    if (lenSig > KernelSignatureLength && sigHasKernelPrefix(signature)) {
      return KernelSignatureLength;
    }

    // Check normal signature
    if (lenSig >= SimpleSignatureLength) {
      return SimpleSignatureLength;
    }
  }

  return 0;
}

function sigHasKernelPrefix(signature: Buffer): boolean {
  if (signature.length < KernelSignatureLength) {
    return false;
  }

  const kernelPrefixes = [Buffer.from([0, 0, 0, 0]), Buffer.from([0, 0, 0, 1]), Buffer.from([0, 0, 0, 2])];

  return kernelPrefixes.some(prefix => signature.subarray(0, 4).equals(prefix));
}

interface CrossChainHashListEntry {
  isPlaceholder: boolean;
  operationHash: Buffer;
}

interface CrossChainData {
  intentJSON: Buffer;
  hashList: CrossChainHashListEntry[];
}

function parseCrossChainData(callData: Buffer): CrossChainData {
  if (callData.length < 4) {
    throw new Error('Missing cross-chain data');
  }

  // Verify OpType
  const opType = callData.readUInt16BE(0);
  if (opType !== CROSS_CHAIN_MARKER) {
    throw new Error('Not a cross-chain operation');
  }

  let offset = 2;

  // Get IntentJSON length
  const intentJSONLength = callData.readUInt16BE(offset);
  offset += 2;

  // Check if IntentJSON is present
  if (callData.length < offset + intentJSONLength) {
    throw new Error('Intent JSON is incomplete');
  }

  // Extract
  const intentJSON = callData.subarray(offset, offset + intentJSONLength);
  offset += intentJSONLength;

  // Get HashList length
  if (callData.length <= offset) {
    throw new Error('Hash list length is missing');
  }

  const hashListLength = callData[offset];
  offset++;

  if (hashListLength < MIN_OP_COUNT || hashListLength > MAX_OP_COUNT) {
    throw new Error('Invalid hash list length');
  }

  const hashList: CrossChainHashListEntry[] = [];
  let foundPlaceholder = false;

  for (let i = 0; i < hashListLength; i++) {
    // Check for placeholder (2 bytes)
    if (offset + 2 > callData.length) {
      throw new Error('Invalid hash list entry');
    }

    const placeholder = callData.readUInt16BE(offset);
    if (placeholder === 0xffff) {
      if (foundPlaceholder) {
        throw new Error('Invalid hash list with multiple placeholders');
      }

      foundPlaceholder = true;

      hashList.push({ isPlaceholder: true, operationHash: Buffer.alloc(0) });
      offset += 2;
      continue;
    }

    // Read complete 32-byte hash
    if (offset + 32 > callData.length) {
      throw new Error('Invalid operation hash');
    }

    const operationHash = callData.subarray(offset, offset + 32);
    if (!validateOperationHash(operationHash)) {
      throw new Error('Invalid hash list hash value');
    }

    hashList.push({ isPlaceholder: false, operationHash });
    offset += 32;
  }

  if (!foundPlaceholder) {
    throw new Error('Invalid hash list with missing placeholder');
  }

  return {
    intentJSON,
    hashList,
  };
}

function serializeHashList(hashList: CrossChainHashListEntry[]): Buffer {
  const buffers: Buffer[] = [];

  // Write hash list length
  buffers.push(Buffer.from([hashList.length]));

  let wrotePlaceholder = false;
  for (const entry of hashList) {
    if (entry.isPlaceholder) {
      if (wrotePlaceholder) {
        throw new Error('Invalid hash list with multiple placeholders');
      }
      // Write placeholder (0xFFFF)
      const placeholderBuffer = Buffer.alloc(2);
      placeholderBuffer.writeUInt16BE(CROSS_CHAIN_MARKER, 0);
      buffers.push(placeholderBuffer);
      wrotePlaceholder = true;
    } else {
      if (entry.operationHash.length !== 32) {
        throw new Error(`Invalid operation hash length: expected 32 bytes, got ${entry.operationHash.length}`);
      }
      buffers.push(entry.operationHash);
    }
  }

  if (!wrotePlaceholder) {
    throw new Error('Invalid hash list with missing placeholder');
  }

  return Buffer.concat(buffers);
}

function validateOperationHash(hash: Buffer): boolean {
  if (hash.length !== 32) {
    return false;
  }

  // Check if hash is not all zeros
  return hash.some(byte => byte !== 0);
}
