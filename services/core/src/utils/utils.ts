import fs from 'fs';
import cbor from 'cbor';
import { join as pathJoin } from 'path';

function customRead(fileName: string): any {
    const path = pathJoin(__dirname, "..", "..", "src", fileName);
    const file = fs.readFileSync(path).toString();
    return JSON.parse(file);
}

type Currency = {
    name: string,
    symbol: string,
    decimals: number
};

export type Chain = {
    name: string,
    chainId: number,
    shortName: string,
    network: string,
    networkId: number,
    nativeCurrency: Currency,
    web3: string[],
    faucets: string[],
    infoURL: string,
    fullnode?: { dappnode: string }
};

type ChainMap = {
    [chainId: string]: Chain
};

const chainMap: ChainMap = {};
const sourcifyChains = customRead("sourcify-chains.json");
for (const chain of customRead("chains.json")) {
    const chainId = chain.chainId;
    if (chainId in chainMap) {
        const err = `Corrupt chains file (chains.json): multiple chains have the same chainId: ${chainId}`;
        throw new Error(err);
    }

    if (chainId in sourcifyChains) {
        const sourcifyData = sourcifyChains[chainId];
        Object.assign(chain, sourcifyData);
    }

    chain.web3 = chain.rpc;
    delete chain.rpc;

    chainMap[chainId] = chain;
}

function filter(obj: any, predicate: ((c: any) => boolean)): any[] {
    const arr = [];
    for (const id in obj) {
        const value = obj[id];
        if (predicate(value)) {
            arr.push(value);
        }
    }
    return arr;
}

const supportedChains = filter(chainMap, c => c.supported);
const monitoredChains = filter(chainMap, c => c.monitored);
const fullnodeChains = filter(chainMap, c => c.fullnode);

const TEST_CHAINS: Chain[] = [{
    name: "Localhost",
    shortName: "Localhost",
    chainId: 0,
    faucets: [],
    infoURL: null,
    nativeCurrency: null,
    network: "testnet",
    networkId: 0,
    web3: [ `http://localhost:${process.env.LOCALCHAIN_PORT || 8545}` ]
}];

/**
 * Returns the chains currently supported by Sourcify server.
 * @returns array of chains currently supported by Sourcify server
 */
export function getSupportedChains(testing = false): Chain[] {
    return testing ? TEST_CHAINS : supportedChains;
}

/**
 * Returns the chains currently monitored by Sourcify.
 * @returns array of chains currently monitored by Sourcify
 */
export function getMonitoredChains(testing = false): Chain[] {
    return testing ? TEST_CHAINS : monitoredChains;
}

/**
 * Returns the chains with additional means
 */
export function getFullnodeChains(): Chain[] {
    return fullnodeChains;
}

/**
 * Checks whether the provided chain identifier is a legal chainId.
 * Throws if not.
 * 
 * @returns the same provided chainId if valid
 * @throws Error if not a valid chainId
 * @param chain chain
 */
export function getChainId(chain: string): string {
    if (!(chain in chainMap)) {
        throw new Error(`Chain ${chain} not supported!`);
    }

    return chain;
}

/**
 * Extracts cbor encoded segement from bytecode
 * @example
 *   const bytes = Web3.utils.hexToBytes(evm.deployedBytecode);
 *   cborDecode(bytes);
 *   > { ipfs: "QmarHSr9aSNaPSR6G9KFPbuLV9aEqJfTk1y9B8pdwqK4Rq" }
 *
 * @param  {number[]} bytecode
 * @return {any}
 */
export function cborDecode(bytecode: number[]): any {
    const cborLength: number = bytecode[bytecode.length - 2] * 0x100 + bytecode[bytecode.length - 1];
    const bytecodeBuffer = Buffer.from(bytecode.slice(bytecode.length - 2 - cborLength, -2));
    return cbor.decodeFirstSync(bytecodeBuffer);
}

/**
 * Checks whether the provided object contains any keys or not.
 * @param obj The object whose emptiness is tested.
 * @returns true if any keys present; false otherwise
 */
export function isEmpty(obj: object): boolean {
    return !Object.keys(obj).length && obj.constructor === Object;
}