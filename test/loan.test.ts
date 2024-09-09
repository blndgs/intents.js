import { Asset, Loan, CHAINS, IntentBuilder, PROJECTS, toBigInt, Account, amountToBigInt } from '../src';
import { ChainID, TIMEOUT, Token, TOKENS } from './constants';
import { initTest } from './testUtils';

describe('Loan', () => {
  let intentBuilder: IntentBuilder, account: Account;

  const loanWETH = async function (project: string, token: Token) {
    const assetETH = new Asset({
      address: TOKENS.ETH.address,
      amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
      chainId: toBigInt(CHAINS.Ethereum),
    }),
      assetWETH = new Asset({
        address: token.address,
        amount: amountToBigInt(0.1, token.decimal),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
      loanAaveWETH = new Loan({
        address: project,
        asset: token.address,
        chainId: toBigInt(CHAINS.Ethereum),
      });

    const initialEthBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
    await intentBuilder.execute(assetETH, assetWETH, account, ChainID);
    await intentBuilder.execute(assetWETH, loanAaveWETH, account, ChainID);

    const finalEthBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
    expect(finalEthBalance).toBeLessThan(initialEthBalance);
  };

  const ethToLoanWEth = async function (project: string, token: Token) {
    const assetETH = new Asset({
      address: TOKENS.ETH.address,
      amount: amountToBigInt(0.1, TOKENS.ETH.decimal),
      chainId: toBigInt(CHAINS.Ethereum),
    }),
      loanAaveWETH = new Loan({
        address: project,
        asset: token.address,
        chainId: toBigInt(CHAINS.Ethereum),
      });

    const initialEthBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
    await intentBuilder.execute(assetETH, loanAaveWETH, account, ChainID);

    const finalEthBalance = await account.getBalance(ChainID, TOKENS.ETH.address);
    expect(finalEthBalance).toBeLessThan(initialEthBalance);
  };

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(ChainID, 1);
  }, TIMEOUT);
  // AAVE
  it('AaveWETH', async () => loanWETH(PROJECTS.Aave, TOKENS.WETH), TIMEOUT);
  // wrong token address WSTETH
  // it('AaveWstETH', async () => loanWETH(PROJECTS.Aave, TOKENS.WSTETH), TIMEOUT);

  it('ETH->AaveWETH', async () => ethToLoanWEth(PROJECTS.Aave, TOKENS.WETH), TIMEOUT);
  // wrong token address WSTETH
  // it('ETH->AaveWstETH', async () => ethToLoanWEth(PROJECTS.Aave, TOKENS.WSTETH), TIMEOUT);

  // Spark
  it('SparkWETH', async () => loanWETH(PROJECTS.Spark, TOKENS.WETH), TIMEOUT);
  // wrong token address WSTETH
  // it('SparkWstETH', async () => loanWETH(PROJECTS.Spark, TOKENS.WSTETH), TIMEOUT);

  it('ETH->SparkWETH', async () => ethToLoanWEth(PROJECTS.Spark, TOKENS.WETH), TIMEOUT);
  // compound -> USDC -> LINK
  it('ETH->LINK', async () => ethToLoanWEth(PROJECTS.CompoundUSDCPool, TOKENS.LINK), TIMEOUT);
  it('ETH->WETH', async () => ethToLoanWEth(PROJECTS.CompoundETHPool, TOKENS.WETH), TIMEOUT);
});
