import { IntentBuilder, CHAINS, toBigInt, Asset, Account } from '../src';
import { TIMEOUT, Token, TOKENS } from './constants';
import { amountToBigInt, getPrice, initTest } from './testUtils';

describe('swap', () => {
  let intentBuilder: IntentBuilder, account: Account;

  const swap = async function (sourceToken: Token, targetToken: Token, fromAmount: number) {
    const toAmount = await getPrice(sourceToken.address, targetToken.address, fromAmount);

    const from = new Asset({
        address: sourceToken.address,
        amount: amountToBigInt(fromAmount, sourceToken),
        chainId: toBigInt(CHAINS.Ethereum),
      }),
      to = new Asset({
        address: targetToken.address,
        amount: amountToBigInt(toAmount, targetToken),
        chainId: toBigInt(CHAINS.Ethereum),
      });

    const sourceBefore = await account.getBalance(1, sourceToken.address);
    const targetBefore = await account.getBalance(1, targetToken.address);
    console.log('fromAmount', fromAmount, 'sourceBefore', sourceBefore, 'sourceBefore-fromAmount=', sourceBefore - fromAmount);
    console.log('toAmount', toAmount, 'targetBefore', targetBefore);
    await intentBuilder.execute(from, to, account);

    const sourceAfter = await account.getBalance(CHAINS.Ethereum, sourceToken.address);
    const targetAfter = await account.getBalance(CHAINS.Ethereum, targetToken.address);

    expect(sourceAfter).toBeLessThan(sourceBefore);
    expect(targetAfter).toBeGreaterThan(targetBefore);
  };

  beforeAll(async () => {
    ({ account, intentBuilder } = await initTest());
    await account.faucet(CHAINS.Ethereum, 1);
  });

  it('ETH->WETH', async () => swap(TOKENS.ETH, TOKENS.Weth, 0.1), TIMEOUT);
  it('WETH->ETH', async () => swap(TOKENS.Weth, TOKENS.ETH, await account.getBalance(CHAINS.Ethereum, TOKENS.Weth.address)), TIMEOUT);
  it('ETH->DAI', async () => swap(TOKENS.ETH, TOKENS.Dai, 0.1), TIMEOUT);
  it('DAI->ETH', async () => swap(TOKENS.Dai, TOKENS.ETH, 0.99 * (await account.getBalance(CHAINS.Ethereum, TOKENS.Dai.address))), TIMEOUT);
  it('ETH->WBTC', async () => swap(TOKENS.ETH, TOKENS.Wbtc, 0.1), TIMEOUT);
  it(
    'WBTC->ETH',
    async () => swap(TOKENS.Wbtc, TOKENS.ETH, 0.99 * (await account.getBalance(CHAINS.Ethereum, TOKENS.Wbtc.address))),
    TIMEOUT,
  );
  it('ETH->LINK', async () => swap(TOKENS.ETH, TOKENS.LINK, 0.1), TIMEOUT);
  it(
    'LINK->ETH',
    async () => swap(TOKENS.LINK, TOKENS.ETH, 0.99 * (await account.getBalance(CHAINS.Ethereum, TOKENS.LINK.address))),
    TIMEOUT,
  );
  it('ETH->USDC', async () => swap(TOKENS.ETH, TOKENS.Usdc, 0.1), TIMEOUT);
  it(
    'USDC->ETH',
    async () => swap(TOKENS.Usdc, TOKENS.ETH, 0.99 * (await account.getBalance(CHAINS.Ethereum, TOKENS.Usdc.address))),
    TIMEOUT,
  );
  it('ETH->UNI', async () => swap(TOKENS.ETH, TOKENS.UNI, 0.1), TIMEOUT);
  it('UNI->ETH', async () => swap(TOKENS.UNI, TOKENS.ETH, 0.99 * (await account.getBalance(CHAINS.Ethereum, TOKENS.UNI.address))), TIMEOUT);
  it('ETH->WBTC', async () => swap(TOKENS.ETH, TOKENS.Wbtc, 0.1), TIMEOUT);
  it(
    'WBTC->LINK',
    async () => swap(TOKENS.Wbtc, TOKENS.LINK, 0.99 * (await account.getBalance(CHAINS.Ethereum, TOKENS.Wbtc.address))),
    TIMEOUT,
  );
  it(
    'LINK->ETH',
    async () => swap(TOKENS.LINK, TOKENS.ETH, 0.99 * (await account.getBalance(CHAINS.Ethereum, TOKENS.LINK.address))),
    TIMEOUT,
  );
});
