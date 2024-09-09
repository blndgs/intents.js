export type Token = { address: string; decimal: number };

export const TOKENS = {
  ETH: { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimal: 18 } as Token,
  USDT: { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimal: 18 } as Token,
  DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimal: 18 } as Token,
  ADAI: { address: '0x018008bfb33d285247a21d44e50697654f754e63', decimal: 18 } as Token,
  USDC: { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimal: 6 } as Token,
  AUSDC: { address: '0x98c23e9d8f34fefb1b7bd6a91b7ff122f4e16f5c', decimal: 6 } as Token,
  STETH: { address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', decimal: 18 } as Token,
  WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimal: 18 } as Token,
  AWETH: { address: '0x4d5f47fa6a74757f35c14fd3a6ef8e3c9bc514e8', decimal: 18 } as Token,
  WBTC: { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimal: 8 } as Token,
  AWBTC: { address: '0x5ee5bf7ae06d1be5997a1a72006fe6c607ec6de8', decimal: 8 } as Token,
  WSTETH: { address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0', decimal: 18 } as Token,
  UNI: { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', decimal: 18 } as Token,
  LINK: { address: '0x514910771af9ca656af840dff83e8264ecf986ca', decimal: 18 } as Token,
  AETH: { address: '0xE95A203B1a91a908F9B9CE46459d101078c2c3cb', decimal: 18 } as Token,
  RETH: { address: '0xae78736Cd615f374D3085123A210448E74Fc6393', decimal: 18 } as Token,
};

export const TIMEOUT = 30 * 1000;

// custom chain id for tenderly ethereum.
export const ChainID = 888;
