/**
 * Maps the names of blockchain networks to their corresponding numeric chain IDs.
 */
export const CHAINS: Record<string, number> = {
  Ethereum: 1,
  BNBChain: 56,
  Polygon: 137,
};

/**
 * Holds the contract addresses for key projects in decentralized finance (DeFi) across different chains.
 * The outer key is the chain ID, and each inner key is a project name with its corresponding smart contract address.
 * These addresses are typically used to interact with specific DeFi protocols via smart contracts.
 */
export const PROJECTS: Record<number, Record<string, string>> = {
  // Ethereum Mainnet (Chain ID: 1)
  // only supported protocol should be here: https://github.com/blndgs/protocol_registry/blob/main/tokens/1.json
  [CHAINS.Ethereum]: {
    Ankr: '0x84db6ee82b7cf3b47e8f19270abde5718b936670',
    Lido: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
    RocketPool: '0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46',
    SparkLend: '0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
    CompoundETHPool: '0xa17581a9e3356d9a858b789d68b4d866e593ae94',
    CompoundUSDCPool: '0xc3d688b66703497daa19211eedff47f25384cdc3',
    Aave: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
  },

  // Binance Smart Chain (Chain ID: 56)
  // only supported protocol should be here: https://github.com/blndgs/protocol_registry/blob/main/tokens/56.json
  [CHAINS.BNBChain]: {
    ListaDAO: '0x1adB950d8bB3dA4bE104211D5AB038628e477fE6',
    Aave: '0x6807dc923806fE8Fd134338EABCA509979a7e0cB',
    Avalon: '0xf9278C7c4AEfAC4dDfd0D496f7a1C39cA6BCA6d4',
  },

  // Polygon (Chain ID: 137)
  // only supported protocol should be here: https://github.com/blndgs/protocol_registry/blob/main/tokens/137.json
  [CHAINS.Polygon]: {
    Aave: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
  },
};
