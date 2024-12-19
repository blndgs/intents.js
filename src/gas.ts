import { GasOptions } from './types'
import { JsonRpcProvider, ethers, getBigInt } from 'ethers'


export const getDefaultSameChainGas = (): GasOptions => {
  return {
    maxFeePerGas: "0",
    maxPriorityFeePerGas: "0",
    callGasLimit: "1500000",
    verificationGasLimit: "1500000",
    preVerificationGas: "60000"
  }
}

export const getCrossChainGas = async (
  provider: JsonRpcProvider,
): Promise<GasOptions> => {
  // Get priority fee first since we need it for both returns
  const maxPriorityFee = await getMaxPriorityFee(provider);
  const maxFeePerGas = await getMaxFeePerGas(provider, maxPriorityFee);

  return {
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFee.toString(),
    callGasLimit: "1500000",
    verificationGasLimit: "1500000",
    preVerificationGas: "60000"
  };
}

async function getMaxPriorityFee(provider: ethers.JsonRpcProvider): Promise<bigint> {
  try {
    const maxPriorityFee = await provider.send("eth_maxPriorityFeePerGas", []);
    return getBigInt(maxPriorityFee);
  } catch (error) {
    console.error("Error fetching maxPriorityFeePerGas:", error);
    throw error;
  }
}

async function getMaxFeePerGas(
  provider: ethers.JsonRpcProvider,
  priorityFeePerGas: bigint
): Promise<bigint> {
  try {
    const feeHistory = await provider.send("eth_feeHistory", [
      "0x1", // Last block only
      "latest",
      [50] // Percentile for priority fee (optional)
    ]);

    const baseFeePerGas = getBigInt(feeHistory.baseFeePerGas[0]);

    // Estimate maxFeePerGas: base fee + priority fee
    // Add 20% buffer to base fee to account for base fee variations
    const maxFeePerGas = (baseFeePerGas * BigInt(120) / BigInt(100)) + priorityFeePerGas;
    return maxFeePerGas;
  } catch (error) {
    console.error("Error fetching maxFeePerGas:", error);
    throw error;
  }
}
