export const CHAIN_OPTIONS = [
    {value: "mainnet", label: "Ethereum Mainnet", id: 1},
    {value: "ropsten", label: "Ropsten", id: 3},
    {value: "rinkeby", label: "Rinkeby", id: 4},
    {value: "kovan", label: "Kovan", id: 42},
    {value: "goerli", label: "Görli", id: 5},
    {value: "xdai", label: "xDai", id: 100},
    {value: "binance smart chain mainnet", label: "Binance Smart Chain Mainnet", id: 56},
    {value: "binance smart chain testnet", label: "Binance Smart Chain Testnet", id: 97},
    {value: "matic mainnet", label: "Matic Mainnet", id: 137},
    {value: "mumbai testnet", label: "Mumbai Testnet", id: 80001}
];

export const REPOSITORY_URL = process.env.REPOSITORY_URL;
export const SERVER_URL = process.env.SERVER_URL;
export const REPOSITORY_URL_FULL_MATCH = `${REPOSITORY_URL}/contracts/full_match`;
export const REPOSITORY_URL_PARTIAL_MATCH = `${REPOSITORY_URL}/contracts/partial_match`;
export const IPFS_IPNS_GATEWAY_URL = `https://gateway.ipfs.io/ipns/${process.env.IPNS}`;
export const GITTER_URL = `https://gitter.im/ethereum/source-verify`;
export const GITHUB_URL = `https://github.com/ethereum/sourcify`;
export const TWITTER_URL = `https://twitter.com/sourcifyeth`;
export const SOLIDITY_ETHEREUM_URL = `https://solidity.ethereum.org/2020/06/25/sourcify-faq/`;
