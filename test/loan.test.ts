import { Asset, Loan, CHAINS, IntentBuilder, PROJECTS, toBigInt, Account, amountToBigInt } from '../src';
import { TENDERLY_CHAIN_ID, TIMEOUT, Token, TOKENS } from './constants';
import { initSigner, initTest } from './testUtils';

describe('Loan', () => {
  let intentBuilder: IntentBuilder, account: Account;

  const loanWETH = async function (project: string, token: Token) {
    const assetETH = new Asset({
        address: TOKENS[CHAINS.Ethereum].ETH.address,
        amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
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

    const initialEthBalance = await account.getBalance(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH.address);
    await intentBuilder.execute(assetETH, assetWETH, account, TENDERLY_CHAIN_ID.Ethereum);
    await intentBuilder.execute(assetWETH, loanAaveWETH, account, TENDERLY_CHAIN_ID.Ethereum);

    const finalEthBalance = await account.getBalance(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH.address);
    expect(finalEthBalance).toBeLessThan(initialEthBalance);
  };

  const ethToLoanWEth = async function (project: string, token: Token) {
    const assetETH = new Asset({
        address: TOKENS[CHAINS.Ethereum].ETH.address,
        amount: amountToBigInt(0.1, TOKENS[CHAINS.Ethereum].ETH.decimal),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
      loanAaveWETH = new Loan({
        address: project,
        asset: token.address,
        chainId: toBigInt(CHAINS.Ethereum),
      });

    const initialEthBalance = await account.getBalance(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH.address);
    await intentBuilder.execute(assetETH, loanAaveWETH, account, TENDERLY_CHAIN_ID.Ethereum);

    const finalEthBalance = await account.getBalance(TENDERLY_CHAIN_ID.Ethereum, TOKENS[CHAINS.Ethereum].ETH.address);
    expect(finalEthBalance).toBeLessThan(initialEthBalance);
  };

  beforeAll(async () => {
    const chainConfigs = await initTest();
    ({ account, intentBuilder } = await initSigner(chainConfigs));
    await account.faucet(TENDERLY_CHAIN_ID.Ethereum, 1);
  }, TIMEOUT);
  // AAVE
  it('AaveWETH', async () => loanWETH(PROJECTS[CHAINS.Ethereum].Aave, TOKENS[CHAINS.Ethereum].WETH), TIMEOUT);
  // wrong token address WSTETH
  // it('AaveWstETH', async () => loanWETH(PROJECTS.Aave, TOKENS.WSTETH), TIMEOUT);

  it('ETH->AaveWETH', async () => ethToLoanWEth(PROJECTS[CHAINS.Ethereum].Aave, TOKENS[CHAINS.Ethereum].WETH), TIMEOUT);
  // wrong token address WSTETH
  // it('ETH->AaveWstETH', async () => ethToLoanWEth(PROJECTS.Aave, TOKENS.WSTETH), TIMEOUT);

  // SparkLend
  it('SparkWETH', async () => loanWETH(PROJECTS[CHAINS.Ethereum].SparkLend, TOKENS[CHAINS.Ethereum].WETH), TIMEOUT);
  // wrong token address WSTETH
  // it('SparkWstETH', async () => loanWETH(PROJECTS.SparkLend, TOKENS.WSTETH), TIMEOUT);

  it(
    'ETH->SparkWETH',
    async () => ethToLoanWEth(PROJECTS[CHAINS.Ethereum].SparkLend, TOKENS[CHAINS.Ethereum].WETH),
    TIMEOUT,
  );
  // compound -> USDC -> LINK
  it(
    'ETH->LINK',
    async () => ethToLoanWEth(PROJECTS[CHAINS.Ethereum].CompoundUSDCPool, TOKENS[CHAINS.Ethereum].LINK),
    TIMEOUT,
  );
  it(
    'ETH->WSTETH',
    async () => ethToLoanWEth(PROJECTS[CHAINS.Ethereum].CompoundETHPool, TOKENS[CHAINS.Ethereum].WSTETH),
    TIMEOUT,
  );
});
