/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';
import { SourcifyChain } from '../src/lib/types';
import Web3 from 'web3';
import Ganache from 'ganache';
import {
  callContractMethodWithTx,
  checkAndVerifyDeployed,
  deployCheckAndVerify,
  deployFromAbiAndBytecode,
  expectMatch,
} from './utils';
import { describe, it, before } from 'mocha';

const ganacheServer = Ganache.server({
  wallet: { totalAccounts: 1 },
  chain: { chainId: 0, networkId: 0 },
});
const GANACHE_PORT = 8545;

const sourcifyChainGanache: SourcifyChain = {
  name: 'ganache',
  shortName: 'ganache',
  chainId: 0,
  networkId: 0,
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpc: [`http://localhost:${GANACHE_PORT}`],
  monitored: false,
  supported: true,
};

let localWeb3Provider: Web3;
let accounts: string[];

describe('Verify Deployed Contract', () => {
  before(async () => {
    await ganacheServer.listen(GANACHE_PORT);
    localWeb3Provider = new Web3(`http://localhost:${GANACHE_PORT}`);
    accounts = await localWeb3Provider.eth.getAccounts();
  });

  it('should verify a simple contract', async () => {
    const contractFolderPath = path.join(__dirname, 'sources', 'Storage');
    const { match, deployedAddress } = await deployCheckAndVerify(
      contractFolderPath,
      sourcifyChainGanache,
      localWeb3Provider,
      accounts[0]
    );
    expectMatch(match, 'perfect', deployedAddress);
  });

  it('should verify a contract with library placeholders', async () => {
    // Originally https://goerli.etherscan.io/address/0x399B23c75d8fd0b95E81E41e1c7c88937Ee18000#code
    const contractFolderPath = path.join(__dirname, 'sources', 'UsingLibrary');
    const { match, deployedAddress } = await deployCheckAndVerify(
      contractFolderPath,
      sourcifyChainGanache,
      localWeb3Provider,
      accounts[0]
    );
    const expectedLibraryMap = {
      __$da572ae5e60c838574a0f88b27a0543803$__:
        '11fea6722e00ba9f43861a6e4da05fecdf9806b7',
    };
    expectMatch(match, 'perfect', deployedAddress, expectedLibraryMap);
  });

  it('should verify a contract with viaIR:true', async () => {
    const contractFolderPath = path.join(__dirname, 'sources', 'StorageViaIR');
    const { match, deployedAddress } = await deployCheckAndVerify(
      contractFolderPath,
      sourcifyChainGanache,
      localWeb3Provider,
      accounts[0]
    );
    expectMatch(match, 'perfect', deployedAddress);
  });

  // https://github.com/ethereum/sourcify/issues/640
  it('should remove the inliner option from metadata for solc >=0.8.2 to <=0.8.4 and be able to verify', async () => {
    const contractFolderPath = path.join(
      __dirname,
      'sources',
      'StorageInliner'
    );
    const { match, deployedAddress } = await deployCheckAndVerify(
      contractFolderPath,
      sourcifyChainGanache,
      localWeb3Provider,
      accounts[0]
    );
    expectMatch(match, 'perfect', deployedAddress);
  });

  it('should verify a contract created by a factory contract and has immutables without constructor arguments but with msg.sender assigned immutable', async () => {
    const deployValue = 12345;
    const childFolderPath = path.join(
      __dirname,
      'sources',
      'FactoryImmutable',
      'Child'
    );
    const factoryFolderPath = path.join(
      __dirname,
      'sources',
      'FactoryImmutable',
      'Factory'
    );
    const factoryAddress = await deployFromAbiAndBytecode(
      localWeb3Provider,
      factoryFolderPath,
      accounts[0],
      [deployValue]
    );

    // Deploy the child by calling the factory
    const txReceipt = await callContractMethodWithTx(
      localWeb3Provider,
      factoryFolderPath,
      factoryAddress,
      'deploy',
      accounts[0],
      [deployValue]
    );
    const childAddress = txReceipt.events.Deployment.returnValues[0];
    const abiEncoded = localWeb3Provider.eth.abi.encodeParameter(
      'uint',
      deployValue
    );
    const match = await checkAndVerifyDeployed(
      childFolderPath,
      sourcifyChainGanache,
      childAddress,
      {
        abiEncodedConstructorArguments: abiEncoded,
      }
    );

    expectMatch(match, 'perfect', childAddress);
  });

  it('should verify a contract created by a factory contract and has immutables', async () => {
    const childFolderPath = path.join(
      __dirname,
      'sources',
      'FactoryImmutableWithoutConstrArg',
      'Child'
    );
    const factoryFolderPath = path.join(
      __dirname,
      'sources',
      'FactoryImmutableWithoutConstrArg',
      'Factory'
    );
    const factoryAddress = await deployFromAbiAndBytecode(
      localWeb3Provider,
      factoryFolderPath,
      accounts[0],
      []
    );

    // Deploy the child by calling the factory
    const txReceipt = await callContractMethodWithTx(
      localWeb3Provider,
      factoryFolderPath,
      factoryAddress,
      'createChild',
      accounts[0],
      []
    );
    const childAddress = txReceipt.events.ChildCreated.returnValues[0];
    const match = await checkAndVerifyDeployed(
      childFolderPath,
      sourcifyChainGanache,
      childAddress,
      {
        msgSender: factoryAddress,
      }
    );

    expectMatch(match, 'perfect', childAddress);
  });
});
