
export const getDefaultSameChainGas = (): {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  verificationGasLimit?: string;
  callGasLimit: string;
} => {
  return {
    maxFeePerGas: "0",
    maxPriorityFeePerGas: "0",
    verificationGasLimit: "1500000",
    callGasLimit: "1500000"
  }
}
