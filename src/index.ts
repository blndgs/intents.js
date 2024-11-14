import { Intent, Asset, Loan, Stake } from 'blndgs-model';
import type { PartialMessage } from '@bufbuild/protobuf';

/**
 * Defines possible states for entities as Asset, Loan, or Stake.
 */
type State = Asset | Loan | Stake;

/**
 * Union type representing possible source states for transactions.
 */
type FromState =
  | { value: Asset; case: 'fromAsset' }
  | { value: Stake; case: 'fromStake' }
  | { value: Loan; case: 'fromLoan' }
  | { case: undefined; value?: undefined };
type ToState =
  | { value: Asset; case: 'toAsset' }
  | { value: Stake; case: 'toStake' }
  | { value: Loan; case: 'toLoan' }
  | { case: undefined; value?: undefined };

export * from './projects';
export * from './IntentBuilder';
export * from './Account';
export * from './utils';
export { Intent, Asset, Loan, Stake, PartialMessage, State, FromState, ToState };
