/**
 * The address of the entry point smart contract.
 */
export const ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

/**
 * Record of factory addresses for different blockchain networks.
 * @type {Record<number, string>}
 */
export const FACTORY: Record<number, string> = {
  1: '0x61e218301932a2550AE8E4Cd1EcfCA7bE64E57DC', // Ethereum Mainnet
  56: '0x61e218301932a2550AE8E4Cd1EcfCA7bE64E57DC', // Binance Smart Chain
  137: '0xd9a6d24030c0DFB0bf78170556a8B671Ec432AAC', // Polygon
};

export const PRE_VERIFICATION_GAS = '0x493E0'; // 300,000
export const MAX_FEE_PER_GAS = '0x493E0'; // 300,000
export const MAX_PRIORITY_FEE_PER_GAS = '0x0';
export const VERIFICATION_GAS_LIMIT = '0x493E0'; // 300,000
export const CALL_GAS_LIMIT = '0xC3500'; // 800,000
