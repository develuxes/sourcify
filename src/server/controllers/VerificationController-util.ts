import { Request } from 'express';
import { Session } from 'express-session';
import { PathContent, CheckedContract, isEmpty, StringMap } from '@ethereum-sourcify/core';
import Web3 from 'web3';
import { MissingSources } from '@ethereum-sourcify/core';
import { InvalidSources } from '@ethereum-sourcify/core';

export interface PathContentMap {
    [id: string]: PathContent;
}

export type ContractLocation = {
    chain: string,
    address: string
}

export type ContractMeta = {
    compiledPath?: string,
    name?: string
    address?: string,
    chainId?: string,
    status?: Status,
    statusMessage?: string,
    storageTimestamp?: Date
}

export type ContractWrapper =
    ContractMeta & {
    contract: CheckedContract
}
export interface ContractWrapperMap {
    [id: string]: ContractWrapper;
}

export type SessionMaps = {
    inputFiles: PathContentMap;
    contractWrappers: ContractWrapperMap;
};

export type MySession = 
    Session &
    SessionMaps & { 
    unusedSources: string[]
};

export type MyRequest = 
    Request & {
    addresses: string[],
    chain: string,
    chosenContract: number
};

export type Status = "perfect" | "partial" | "error";

export type SendableContract =
    ContractMeta & {
    files: {
        found: string[],
        missing: MissingSources,
        invalid: InvalidSources
    },
    verificationId?: string
}

export function isVerifiable(contractWrapper: ContractWrapper) {
    const contract = contractWrapper.contract;
    return isEmpty(contract.missing)
        && isEmpty(contract.invalid)
        && Boolean(contractWrapper.address)
        && Boolean(contractWrapper.chainId);
}

function getSendableContract(contractWrapper: ContractWrapper, verificationId: string): SendableContract {
    const contract = contractWrapper.contract;

    return {
        verificationId,
        compiledPath: contract.compiledPath,
        name: contract.name,
        address: contractWrapper.address,
        chainId: contractWrapper.chainId,
        files: {
            found: Object.keys(contract.solidity), // Source paths
            missing: contract.missing,
            invalid: contract.invalid
        },
        status: contractWrapper.status || "error",
        statusMessage: contractWrapper.statusMessage,
        storageTimestamp: contractWrapper.storageTimestamp
    };
}

export function getSessionJSON(session: MySession) {
    const contractWrappers = session.contractWrappers || {};
    const contracts: SendableContract[] = [];    
    for (const id in contractWrappers) {
        const sendableContract = getSendableContract(contractWrappers[id], id);
        contracts.push(sendableContract);
    }

    const files: string[] = [];
    for (const id in session.inputFiles) {
        files.push(session.inputFiles[id].path)
    }
    const unused = session.unusedSources || [];
    return { contracts, unused, files };
}

export function generateId(obj: any): string {
    return Web3.utils.keccak256(JSON.stringify(obj));
}

export function updateUnused(unused: string[], session: MySession) {
    if (!session.unusedSources) {
        session.unusedSources = [];
    }
    session.unusedSources = unused;
}