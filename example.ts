import { IntentBuilder, Projects } from './src';
import { ethers } from 'ethers';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const nodeUrl = '';

const intentBuilder = new IntentBuilder();

const sender = '0x';
const fromMode = 'currency';
const fromSelectedToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const inputValue = '0.1';
const toMode = 'staking';
const toSelectedToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const toAmount = '0.1';
const fromSelectedProject = '';
const toSelectedProject = Projects.Lido;

const intent = intentBuilder.createIntent(
  sender,
  fromMode,
  fromSelectedToken,
  inputValue,
  toMode,
  toSelectedToken,
  toAmount,
  fromSelectedProject,
  toSelectedProject,
);

intentBuilder
  .execute(intent, signer, nodeUrl)
  .then(() => console.log('Intent executed successfully.'))
  .catch(error => console.error('Error executing intent:', error));
