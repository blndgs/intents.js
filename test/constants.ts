import { CHAINS } from '../src';

export type Token = { address: string; decimal: number };
export type ChainTokens = { [tokenSymbol: string]: Token };

export const TOKENS: Record<number, ChainTokens> = {
  // Ethereum Mainnet (Chain ID: 1)
  [CHAINS.Ethereum]: {
    ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimal: 18 },
    USDT: { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimal: 6 },
    DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimal: 18 },
    ADAI: { address: '0x018008bfb33d285247a21d44e50697654f754e63', decimal: 18 },
    USDC: { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimal: 6 },
    AUSDC: { address: '0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c', decimal: 6 },
    STETH: { address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', decimal: 18 },
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimal: 18 },
    AWETH: { address: '0x4d5f47fa6a74757f35c14fd3a6ef8e3c9bc514e8', decimal: 18 },
    WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimal: 8 },
    AWBTC: { address: '0x5ee5bf7ae06d1be5997a1a72006fe6c607ec6de8', decimal: 8 },
    WSTETH: { address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', decimal: 18 },
    UNI: { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', decimal: 18 },
    LINK: { address: '0x514910771af9ca656af840dff83e8264ecf986ca', decimal: 18 },
    AETH: { address: '0xE95A203B1a91a908F9B9CE46459d101078c2c3cb', decimal: 18 },
    RETH: { address: '0xae78736Cd615f374D3085123A210448E74Fc6393', decimal: 18 },
  },

  // Binance Smart Chain (Chain ID: 56)
  [CHAINS.BNBChain]: {
    BNB: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimal: 18 },
    WBNB: { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimal: 18 },
    USDT: { address: '0x55d398326f99059fF775485246999027B3197955', decimal: 18 },
    BUSD: { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimal: 18 },
    USDC: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimal: 18 },
  },

  // Polygon (Chain ID: 137)
  [CHAINS.Polygon]: {
    POL: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimal: 18 },
    WPOL: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimal: 18 },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimal: 6 },
    USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimal: 6 },
    DAI: { address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', decimal: 18 },
  },
};
// 40000 ms
export const TIMEOUT = 40 * 1000;

// custom chain id for tenderly ethereum.
export const TENDERLY_CHAIN_ID = {
  Ethereum: 888,
  BNBChain: 890,
  Polygon: 8889,
};
