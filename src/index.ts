import { Intent, Asset, Loan, Stake } from 'blndgs-model/dist/asset_pb';
import type { PartialMessage } from '@bufbuild/protobuf';

type State = Asset | Loan | Stake;
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
export * from './utils';
export * from './walletUtils';
export { Intent, Asset, Loan, Stake, PartialMessage, State, FromState, ToState };
