import { BigInt as ProtoBigInt } from 'blndgs-model';
import { toBigInt } from '../src';
import { Token } from '../test/constants';

/**
 * Represents a request for a quote from the Borsa Network API
 */
export interface BorsaQuoteRequest {
  sender: string;
  nonce: number;
  intent: {
    fromAsset: {
      address: string;
      amount: ProtoBigInt
      chainId: ProtoBigInt
    };
    toAsset: {
      address: string;
      amount: ProtoBigInt
      chainId: ProtoBigInt
    };
  };
}


interface OperationDetails {
  amount?: string;
  from?: string;
  to?: string;
  spender?: string;
  amount_in?: string;
  amount_out?: string;
  estimated_gas?: number;
  expected_slippage?: string;
  min_amount_out?: string;
  provider?: string;
  token_in?: string;
  token_out?: string;
}

interface Step {
  name: string;
  operation_details: OperationDetails;
}

/**
 * Represents a response from the Borsa Network API
 */
interface BorsaQuoteResponse {
  id: string;
  intent_type: string;
  sub_type: string;
  steps: Step[];
}

export class BorsaQuoter {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'https://quote.dev.borsa.network') {
    this.baseUrl = baseUrl;
  }

  async getQuote(
    chainId: number,
    sourceToken: Token,
    targetToken: Token,
    amount: ProtoBigInt,
    sender: string,
    nonce: number
  ): Promise<bigint> {
    const request: BorsaQuoteRequest = {
      sender: sender,
      nonce,
      intent: {
        fromAsset: {
          address: sourceToken.address,
          amount,
          chainId: toBigInt(chainId),
        },
        toAsset: {
          address: targetToken.address,
          amount,
          chainId: toBigInt(chainId),
        }
      }
    };

    const response = await fetch(`${this.baseUrl}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Quote failed: ${response.statusText}`);
    }

    const quote: BorsaQuoteResponse = await response.json();

    const swapStep = quote.steps.find(s => s.name === 'swap');

    if (!swapStep?.operation_details.amount_out) {
      throw new Error('No valid quote received');
    }

    return BigInt(swapStep.operation_details.amount_out);
  }
}
