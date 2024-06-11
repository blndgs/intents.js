import { ethers } from 'ethers';
import { NODE_URL } from './Constants';

export class Helpers {
  public static async faucet(addrss: string) {
    // Import ethers

    // Connect to your Ethereum node or gateway
    const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

    // Define the JSON-RPC request for the tenderly_addBalance method
    const method = 'tenderly_addBalance';
    const params = [[addrss], '0x6f05b59d3b20000'];
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1, // The ID can be any number or string
    };

    try {
      const response = await provider.send(jsonRpcRequest.method, jsonRpcRequest.params);
      console.log('Response:', response);
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  public static async checkBalance(address: string, tokenAddress?: string): Promise<string> {
    const provider = new ethers.providers.JsonRpcProvider(NODE_URL);

    try {
      if (tokenAddress) {
        // ERC20 balance check
        const abi = [
          {
            constant: true,
            inputs: [{ name: '_owner', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: 'balance', type: 'uint256' }],
            type: 'function',
          },
        ];

        const contract = new ethers.Contract(tokenAddress, abi, provider);
        const balance = await contract.balanceOf(address);
        const formattedBalance = ethers.utils.formatUnits(balance, 18);
        console.log(`ERC20 Balance: ${formattedBalance}`);
        return formattedBalance;
      } else {
        // Ethereum balance check
        const balance = await provider.getBalance(address);
        const formattedBalance = ethers.utils.formatEther(balance);
        console.log(`Ethereum Balance: ${formattedBalance}`);
        return formattedBalance;
      }
    } catch (error) {
      console.error('Error checking balance:', error);
      return '0';
    }
  }
}
