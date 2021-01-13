import Web3 from 'web3';
import { StringMap, SourceMap, Metadata } from './types';
import { isEmpty } from './utils';
import bunyan from 'bunyan';
import fetch from 'node-fetch';

const STANDARD_JSON_SETTINGS_KEYS = [
        "stopAfter", "remappings", "optimizer", "evmVersion", "debug", "metadata", "libraries", "outputSelection"
];

const IPFS_PREFIX = "dweb:/ipfs/";

/**
 * Abstraction of a checked solidity contract. With metadata and source (solidity) files.
 * The getInfo method returns the information about compilation or errors encountered while validating the metadata.
 */
export class CheckedContract {
    /** The raw string representation of the contract's metadata. */
    metadataRaw: string;

    /** Object containing contract metadata keys and values. */
    metadata: Metadata;

    /** SourceMap mapping the original compilation path to PathContent. */
    solidity: StringMap;

    /** Object containing the information about missing source files. */
    missing: any;

    /** Contains the invalid source files. */
    invalid: StringMap;

    /** Object containing input for solc when used with the --standard-json flag. */
    standardJson: any;

    /** The path of the contract during compile-time. */
    compiledPath: string;

    /** The version of the Solidity compiler to use for compilation. */
    compilerVersion?: string;

    /** The name of the contract. */
    name: string;

    /** Checks whether this contract is valid or not.
     * @returns true if no sources are missing or are invalid (malformed); false otherwise
     */
    public static isValid(contract: CheckedContract): boolean {
        return isEmpty(contract.missing) && isEmpty(contract.invalid);
    }

    private sourceMapToStringMap(input: SourceMap) {
        const ret: StringMap = {};
        for (const key in input) {
            ret[key] = input[key].content;
        }
        return ret;
    }

    public constructor(metadata: any, solidity: SourceMap, missing: any, invalid: StringMap) {
        this.metadataRaw = JSON.stringify(metadata);
        this.metadata = JSON.parse(JSON.stringify(metadata));
        this.solidity = this.sourceMapToStringMap(solidity);
        this.missing = missing;
        this.invalid = invalid;

        const sources = this.metadata.sources;
        for (const compiledPath in sources) {
            const metadataSource = sources[compiledPath];
            const foundSource = solidity[compiledPath];
            if (!metadataSource.content && foundSource) {
                metadataSource.content = foundSource.content;
            }
            delete metadataSource.license;
        }

        if (metadata.compiler && metadata.compiler.version) {
            this.compilerVersion = metadata.compiler.version;
        }
        const { contractPath, contractName } = this.getPathAndName();
        this.compiledPath = contractPath;
        this.name = contractName;
    }

    /**
     * Returns the contract path and name as specified in the metadata provided during construction.
     */
    private getPathAndName() {
        const compilationTarget = this.metadata.settings.compilationTarget;
        const contractPath = Object.keys(compilationTarget)[0];
        const contractName = compilationTarget[contractPath];
        return { contractPath, contractName };
    }

    /**
     * Returns a JSON object compatible with solc --standard-json.
     * 
     * @param useOriginalSettings If true, the returned object will contain settings as specified
     * during the original compilation; otherwise no settings will be imposed.
     */
    public getStandardJson(useOriginalSettings = true) {
        const standardJson: any = {
            language: "Solidity",
            sources: this.metadata.sources
        };

        if (useOriginalSettings && this.metadata.settings) {
            standardJson.settings = {};
            standardJson.settings.outputSelection = { "*": { "*": [ "evm.bytecode", "abi" ] } };
            for (const key of STANDARD_JSON_SETTINGS_KEYS) {
                const settings: any = this.metadata.settings; // has to be of type any, does not compile if calling this.metadata.settings
                if (Object.prototype.hasOwnProperty.call(settings, key)) {
                    standardJson.settings[key] = settings[key];
                }
            }
        }

        return standardJson;
    }

    /**
     * Constructs the message to be displayed in case of a successful finding
     * of source files related to the provided metadata file.
     */
    private composeSuccessMessage(): string {
        const simpleCompilerVersion = this.compilerVersion.split("+")[0];
        const msgLines: string[] = [];
        msgLines.push(`${this.name} (${this.compiledPath}):`);
        msgLines.push("  Success!");
        msgLines.push(`  Compiled with Solidity ${simpleCompilerVersion}`);
        msgLines.push(`  https://solc-bin.ethereum.org/wasm/soljson-v${this.compilerVersion}.js`);
        msgLines.push(`  https://solc-bin.ethereum.org/linux-amd64/solc-linux-amd64-v${this.compilerVersion}`);
        return msgLines.join("\n");
    }

    /**
     * Constructs the message to be displayed in case the contract is not valid.
     * The structure of the message is as follows:
     * 
     * path: name
     * 
     *   missing sources
     * 
     *   invalid sources
     * 
     *   number of found sources
     */
    private composeErrorMessage(): string {
        const msgLines: string[] = [];
        msgLines.push(`${this.name} (${this.compiledPath}):`);

        if (!isEmpty(this.missing)) {
            msgLines.push("  Error: Missing sources:");
            msgLines.push("  The following files were not provided (or were altered, so their hash doesn't match the one in the metadata).");
            msgLines.push("  Please retrieve the files (potentially via ipfs) and re-run the script.");
        }

        for (const missingSourceName in this.missing) {
            msgLines.push(`    ${missingSourceName}:`);
            const missingSourceProps = this.missing[missingSourceName];
            for (const prop in missingSourceProps) {
                const propValue = missingSourceProps[prop];
                if (Array.isArray(propValue)) {
                    propValue.forEach((elem: string) => {
                        msgLines.push(`      ${elem}`);
                    });
                } else {
                    msgLines.push(`      ${prop}: ${propValue}`);
                }
            }
        }

        if (!isEmpty(this.invalid)) {
            msgLines.push("  Error: Invalid sources:");
        }

        for (const invalidSourceName in this.invalid) {
            msgLines.push(`    ${invalidSourceName}:`);
            msgLines.push(`      ${this.invalid[invalidSourceName]}`);
        }

        const foundSourcesNumber = Object.keys(this.solidity).length;
        if (foundSourcesNumber) {
            msgLines.push(`  ${foundSourcesNumber} other source files found successfully.`);
        }

        if (!this.compilerVersion) {
            msgLines.push("  No compiler version provided.");
        }

        return msgLines.join("\n");
    }

    /**
     * Asynchronously attempts to fetch the missing sources of this contract. An error is thrown in case of a failure.
     * 
     * @param log log object
     */
    public async fetchMissing(log?: bunyan): Promise<void> {
        const retrieved: StringMap = {};
        for (const fileName in this.missing) {
            if (!fileName.startsWith("@openzeppelin")) {
                continue;
            }

            const file = this.missing[fileName];
            const hash = this.missing[fileName].keccak256;

            let success = false;
            for (const url of file.urls) {
                if (url.startsWith(IPFS_PREFIX)) {
                    const ipfsCode = url.slice(IPFS_PREFIX.length);
                    const ipfsUrl = 'https://ipfs.infura.io:5001/api/v0/cat?arg='+ipfsCode;
                    const retrievedContent = await this.performFetch(ipfsUrl, hash, fileName, log);
                    if (retrievedContent) {
                        success = true;
                        retrieved[fileName] = retrievedContent;
                        break;
                    }
                }
            }
        }

        for (const fileName in retrieved) {
            delete this.missing[fileName];
            this.solidity[fileName] = retrieved[fileName];
        }

        const missingFiles = Object.keys(this.missing);
        if (missingFiles.length) {
            log.error({ loc: "[FETCH]", contractName: this.name, missingFiles });
            throw new Error(`Missing sources after fetching: ${missingFiles.join(", ")}`);
        }
    }

    private async performFetch(url: string, hash: string, fileName: string, log?: bunyan): Promise<string> {
        const infoObject = { loc: "[FETCH]", fileName, url };
        if (log) log.info(infoObject, "Fetch attempt");

        const res = await fetch(url);
        if (res.status === 200) {
            const content = await res.text();
            if (Web3.utils.keccak256(content) !== hash) {
                if (log) log.error(infoObject, "The calculated and the provided hash don't match.");
                return null;
            }

            if (log) log.info(infoObject, "Fetch successful!");
            return content;

        } else {
            if (log) log.error(infoObject, "Fetch failed!");
            return null;
        }
    }


    /**
     * Returns a message describing the errors encountered while validating the metadata.
     * Does not include a trailing newline.
     * 
     * @returns the validation info message
     */
    public getInfo() {
        return CheckedContract.isValid(this) ? this.composeSuccessMessage() : this.composeErrorMessage();
    }
}