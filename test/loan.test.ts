import { Asset, Loan, CHAINS, IntentBuilder, PROJECTS, toBigInt, Account } from '../src';
import { TIMEOUT, Token, TOKENS } from './constants';
import { amountToBigInt, initTest } from './testUtils';

describe('Loan', () => {
  let intentBuilder: IntentBuilder, account: Account;

  const loanWETH = async function (project: string, token: Token) {
    const assetETH = new Asset({
        address: TOKENS.ETH.address,
        amount: amountToBigInt(0.1, TOKENS.ETH),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
      assetWETH = new Asset({
        address: token.address,
        amount: amountToBigInt(0.1, TOKENS.ETH),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
      loanAaveWETH = new Loan({
        address: project,
        asset: token.address,
        chainId: toBigInt(CHAINS.Ethereum),
      });

    const initialEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
    await intentBuilder.execute(assetETH, assetWETH, account);
    await intentBuilder.execute(assetWETH, loanAaveWETH, account);

    const finalEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
    expect(finalEthBalance).toBeLessThan(initialEthBalance);
  };

  const ethToLoanWEth = async function (project: string, token: Token) {
    const assetETH = new Asset({
        address: TOKENS.ETH.address,
        amount: amountToBigInt(0.1, TOKENS.ETH),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
      loanAaveWETH = new Loan({
        address: project,
        asset: token.address,
        chainId: toBigInt(CHAINS.Ethereum),
      });

    const initialEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
    await intentBuilder.execute(assetETH, loanAaveWETH, account);

    const finalEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
    expect(finalEthBalance).toBeLessThan(initialEthBalance);
  };

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(CHAINS.Ethereum, 1);
  });

  it(
    'AaveETH',
    async () => {
      const assetETH = new Asset({
          address: TOKENS.ETH.address,
          amount: amountToBigInt(0.1, TOKENS.ETH),
          chainId: toBigInt(CHAINS.Ethereum),
        }),
        loanAaveETH = new Loan({
          address: PROJECTS.Aave,
          asset: TOKENS.ETH.address,
          chainId: toBigInt(CHAINS.Ethereum),
        });

      const initialEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
      await intentBuilder.execute(assetETH, loanAaveETH, account);

      const finalEthBalance = await account.getBalance(CHAINS.Ethereum, TOKENS.ETH.address);
      expect(finalEthBalance).toBeLessThan(initialEthBalance);
    },
    TIMEOUT,
  );
  // AAVE
  it('AaveWETH', async () => loanWETH(PROJECTS.Aave, TOKENS.Weth), TIMEOUT);
  // it('AaveWstETH', async () => loanWETH(PROJECTS.Aave, TOKENS.WstETH), TIMEOUT);
  // it('AaveRETH', async () => loanWETH(PROJECTS.Aave, TOKENS.RETH), TIMEOUT);

  it('ETH->AaveWETH', async () => ethToLoanWEth(PROJECTS.Aave, TOKENS.Weth), TIMEOUT);
  // it('ETH->AaveWstETH', async () => ethToLoanWEth(PROJECTS.Aave, TOKENS.WstETH), TIMEOUT);
  // it('ETH->AaveRETH', async () => ethToLoanWEth(PROJECTS.Aave, TOKENS.RETH), TIMEOUT);

  // Compound
  // it('CompoundWETH', async () => loanWETH(PROJECTS.Compound, TOKENS.Weth), TIMEOUT);
  // it('CompoundWstETH', async () => loanWETH(PROJECTS.Compound, TOKENS.WstETH), TIMEOUT);
  // it('CompoundRETH', async () => loanWETH(PROJECTS.Compound, TOKENS.RETH), TIMEOUT);

  // it('ETH->CompoundWETH', async () => ethToLoanWEth(PROJECTS.Compound, TOKENS.Weth), TIMEOUT);
  // it('ETH->CompoundWstETH', async () => ethToLoanWEth(PROJECTS.Compound, TOKENS.WstETH), TIMEOUT);
  // it('ETH->CompoundRETH', async () => ethToLoanWEth(PROJECTS.Compound, TOKENS.RETH), TIMEOUT);
});
