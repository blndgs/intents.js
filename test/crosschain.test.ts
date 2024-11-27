import { UserOperationBuilder } from 'blndgs-userop';
import { aggregate, isCrossChainOperation } from '../src/crosschain';
import { encodeCrossChainCallData } from '../src/utils';
import { Asset, Intent, Stake } from 'blndgs-model';
import {
  amountToBigInt,
  toBigInt,
} from '../src';

const sourceChainID = 137; // Polygon
const destChainID = 56; // BSC

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

const intentJSON = JSON.stringify(new Intent({ from: { case: 'fromAsset', value: from }, to: { case: 'toStake', value: to } }))

describe('Cross-chain operations', () => {
  // Helper function to create a mock UserOperationBuilder
  function createMockUserOp(
    callData: Uint8Array,
    signature: string = '0x00000001' + '00'.repeat(65), // Default kernel signature
    nonce: number = 0,
  ): UserOperationBuilder {
    const op = new UserOperationBuilder();
    op.setCallData(callData);
    op.setSignature(signature);
    op.setNonce(nonce);
    return op;
  }

  describe('aggregate', () => {
    it('should aggregate two cross-chain operations', () => {

      const mockHash = '0x' + '11'.repeat(32);

      // Use encodeCrossChainCallData to create cross-chain data
      const crossChainData = encodeCrossChainCallData(
        new TextEncoder().encode(intentJSON),
        mockHash,
        mockHash,
        true
      );

      // Create source and destination operations
      const sourceOp = createMockUserOp(crossChainData);
      const destOp = createMockUserOp(crossChainData);

      // Aggregate the operations
      aggregate(sourceOp, destOp);

      // Verify the aggregation
      expect(isCrossChainOperation(sourceOp)).toBe(true);
      expect(sourceOp.getSignature().length).toBeGreaterThan(69); // Kernel signature (69) + packed data
    });

    it('should throw error when aggregating non-cross-chain operations', () => {
      const normalOp = createMockUserOp(new Uint8Array([0x12, 0x34]));
      const destOp = createMockUserOp(new Uint8Array([0x56, 0x78]));

      expect(() => aggregate(normalOp, destOp)).toThrow(
        'Called UserOperationBuilder is not a valid cross-chain userOp',
      );
    });

    it('should be idempotent when aggregating the same operation multiple times', () => {
      const mockHash = '0x' + '11'.repeat(32);

      // Use encodeCrossChainCallData to create cross-chain data
      const crossChainData = encodeCrossChainCallData(
        new TextEncoder().encode(intentJSON),
        mockHash,
        mockHash,
        true
      );

      const sourceOp = createMockUserOp(crossChainData);
      const destOp = createMockUserOp(crossChainData);

      // Aggregate multiple times
      aggregate(sourceOp, destOp);
      const firstSignature = sourceOp.getSignature();

      aggregate(sourceOp, destOp);
      const secondSignature = sourceOp.getSignature();

      // Signatures should be identical
      expect(firstSignature).toEqual(secondSignature);
    });

    it('should throw error when aggregating unsigned operations', () => {
      const mockHash = '0x' + '11'.repeat(32);

      // Use encodeCrossChainCallData to create cross-chain data
      const crossChainData = encodeCrossChainCallData(
        new TextEncoder().encode(intentJSON),
        mockHash,
        mockHash,
        true
      );

      const sourceOp = createMockUserOp(crossChainData, '0x'); // Empty signature
      const destOp = createMockUserOp(crossChainData);

      expect(() => aggregate(sourceOp, destOp)).toThrow('Unsigned UserOperationBuilders are not supported');
    });
  });
});
