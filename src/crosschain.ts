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
  // 1. Validate cross-chain operations
  if (!isCrossChainOperation(op)) {
    throw new Error('Called UserOperationBuilder is not a valid cross-chain userOp');
  }

  if (!isCrossChainOperation(embeddedOp)) {
    throw new Error('UserOperationBuilder to embed is not a valid cross-chain userOp');
  }

  // 2. Check signature
  const signature = toBuffer(op.getSignature());
  const signatureEndIdx = getSignatureEndIdx(signature);
  if (signatureEndIdx === 0) {
    throw new Error('Unsigned UserOperationBuilders are not supported');
  }

  // 3. Get packed data
  const packedData = getPackedData(embeddedOp);

  // 4. Check existing packed data for idempotency
  if (signature.length > signatureEndIdx) {
    const existingPackedData = signature.slice(signatureEndIdx);
    if (existingPackedData.length === packedData.length + 1 &&
      existingPackedData[0] === 1 &&
      Buffer.compare(existingPackedData.slice(1), packedData) === 0) {
      return;
    }
  }

  // 5. Create new signature
  const newSignature = Buffer.alloc(signatureEndIdx + 1 + packedData.length);
  signature.copy(newSignature, 0, 0, signatureEndIdx);
  newSignature[signatureEndIdx] = 1;
  packedData.copy(newSignature, signatureEndIdx + 1);

  op.setSignature(newSignature);
}

function getPackedData(op: UserOperationBuilder): Buffer {
  const buffers: Buffer[] = [];

  // Write nonce (32 bytes)
  const nonce = BigInt(op.getNonce().toString());
  const nonceBytes = ethers.zeroPadValue(ethers.toBeArray(nonce), 32);
  buffers.push(Buffer.from(nonceBytes));

  // Write gas limits (8 bytes each)
  const callGasLimit = BigInt(op.getCallGasLimit().toString());
  const callGasLimitBytes = ethers.zeroPadValue(ethers.toBeArray(callGasLimit), 8);
  buffers.push(Buffer.from(callGasLimitBytes));

  const preVerificationGas = BigInt(op.getPreVerificationGas().toString());
  const preVerificationGasBytes = ethers.zeroPadValue(ethers.toBeArray(preVerificationGas), 8);
  buffers.push(Buffer.from(preVerificationGasBytes));

  const verificationGasLimit = BigInt(op.getVerificationGasLimit().toString());
  const verificationGasLimitBytes = ethers.zeroPadValue(ethers.toBeArray(verificationGasLimit), 8);
  buffers.push(Buffer.from(verificationGasLimitBytes));

  // Write gas prices (32 bytes each)
  const maxFeePerGas = BigInt(op.getMaxFeePerGas().toString());
  const maxFeePerGasBytes = ethers.zeroPadValue(ethers.toBeArray(maxFeePerGas), 32);
  buffers.push(Buffer.from(maxFeePerGasBytes));

  const maxPriorityFeePerGas = BigInt(op.getMaxPriorityFeePerGas().toString());
  const maxPriorityFeePerGasBytes = ethers.zeroPadValue(ethers.toBeArray(maxPriorityFeePerGas), 32);
  buffers.push(Buffer.from(maxPriorityFeePerGasBytes));

  // Write hash list
  const crossChainData = parseCrossChainData(toBuffer(op.getCallData()));
  const hashListBytes = serializeHashList(crossChainData.hashList);
  buffers.push(hashListBytes);

  // Write initCode if present
  const initCode = toBuffer(op.getInitCode());
  if (initCode.length > 0) {
    buffers.push(initCode);
  }

  return Buffer.concat(buffers);
}

/**
 * Checks if a UserOperationBuilder is a cross-chain operation.
 *
 * @param op - The UserOperationBuilder to check
 * @returns boolean - True if the operation is a cross-chain operation
 */
export function isCrossChainOperation(op: UserOperationBuilder): boolean {
  // Check if callData contains cross-chain data
  if (isCrossChainData(toBuffer(op.getCallData()), MIN_OP_COUNT, MAX_OP_COUNT)) {
    return true;
  }

  // Check if signature exists and has content after the signature end index
  const signature = toBuffer(op.getSignature());
  const signatureEndIdx = getSignatureEndIdx(signature);
  if (signatureEndIdx > 0 && signature.length > signatureEndIdx) {
    return isCrossChainData(signature.slice(signatureEndIdx), 1, MAX_OP_COUNT);
  }

  return false;
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

  // Check if data is long enough to contain the intent JSON and hash list length
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
}

function getSignatureEndIdx(signature: Buffer): number {
  // Check if signature has 0x prefix
  if (signature.length >= 2 && signature[0] === 0x30 && signature[1] === 0x78) {
    return 0;
  }

  const lenSig = signature.length;

  // Check kernel signature
  if (lenSig === KernelSignatureLength) {
    if (hasKernelPrefix(signature)) {
      return KernelSignatureLength;
    }
    return 0;
  }

  if (lenSig > KernelSignatureLength && hasKernelPrefix(signature)) {
    return KernelSignatureLength;
  }

  // Check normal signature
  if (lenSig >= SimpleSignatureLength) {
    return SimpleSignatureLength;
  }

  return 0;
}

function hasKernelPrefix(signature: Buffer): boolean {
  if (signature.length < 4) {
    return false;
  }

  const prefix = signature.slice(0, 4);
  return (
    Buffer.compare(prefix, Buffer.from([0, 0, 0, 0])) === 0 ||
    Buffer.compare(prefix, Buffer.from([0, 0, 0, 1])) === 0 ||
    Buffer.compare(prefix, Buffer.from([0, 0, 0, 2])) === 0
  );
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
  const intentJSON = callData.slice(offset, offset + intentJSONLength);
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

      hashList.push({
        isPlaceholder: true,
        operationHash: Buffer.alloc(0),
      });
      offset += 2;
      continue;
    }

    // Read complete 32-byte hash
    if (offset + 32 > callData.length) {
      throw new Error('Invalid operation hash');
    }

    const operationHash = callData.slice(offset, offset + 32);
    if (!validateOperationHash(operationHash)) {
      throw new Error('Invalid hash list hash value');
    }

    hashList.push({
      isPlaceholder: false,
      operationHash,
    });
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
