import { GasOptions } from './types'
import { JsonRpcProvider, ethers, getBigInt } from 'ethers'


export const getDefaultSameChainGas = (): GasOptions => {
  return {
    maxFeePerGas: "0",
    maxPriorityFeePerGas: "0",
    verificationGasLimit: "1500000",
    callGasLimit: "1500000",
    preVerificationGas: "90000"
  }
}

export const getCrossChainGas = async (
  provider: JsonRpcProvider,
): Promise<GasOptions> => {
  const [maxFeePerGas, maxPriorityFee] = await Promise.all([
    getMaxFeePerGas(provider),
    getMaxPriorityFee(provider)
  ]);

  return {
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFee.toString(),
    verificationGasLimit: "1500000",
    callGasLimit: "1500000",
    preVerificationGas: "90000"
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

async function getMaxFeePerGas(provider: ethers.JsonRpcProvider): Promise<bigint> {
  try {
    const feeHistory = await provider.send("eth_feeHistory", [
      "0x1", // Last block only
      "latest",
      [50] // Percentile for priority fee (optional)
    ]);

    const baseFeePerGas = getBigInt(feeHistory.baseFeePerGas[0]);
    const priorityFeePerGas = getBigInt(feeHistory.reward[0][0]);

    // Estimate maxFeePerGas
    const maxFeePerGas = baseFeePerGas + priorityFeePerGas;
    return maxFeePerGas;
  } catch (error) {
    console.error("Error fetching maxFeePerGas:", error);
    throw error;
  }
}
