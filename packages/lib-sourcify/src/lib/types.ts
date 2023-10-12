import { Abi } from 'abitype';
import { FetchRequest } from 'ethers';
import SourcifyChain from './SourcifyChain';
export interface PathBuffer {
  path: string;
  buffer: Buffer;
}

export interface PathContent {
  path: string;
  content: string;
}

export interface StringMap {
  [key: string]: string;
}

export interface InvalidSources {
  [key: string]: {
    expectedHash: string;
    calculatedHash: string;
    msg?: string; // Keep msg for compatibilty with legacy UI
  };
}

export interface MissingSources {
  [key: string]: {
    keccak256: string;
    urls: string[];
  };
}

export interface MetadataSource {
  keccak256: string;
  content?: string;
  urls?: string[];
  license?: string;
}

export interface MetadataSourceMap {
  [index: string]: MetadataSource;
}

export interface Devdoc {
  author?: string;
  details?: string;
  errors?: {
    [index: string]: {
      details?: string;
    };
  };
  events?: {
    [index: string]: {
      details?: string;
      params?: any;
    };
  };
  kind: 'dev';
  methods: {
    [index: string]: {
      details?: string;
      params?: any;
      returns?: any;
    };
  };
  stateVariables?: any;
  title?: string;
  version?: number;
}

export interface Userdoc {
  errors?: {
    [index: string]: {
      notice?: string;
    }[];
  };
  events?: {
    [index: string]: {
      notice?: string;
    };
  };
  kind: 'user';
  methods: {
    [index: string]: {
      notice: string;
    };
  };
  version?: number;
}

export interface MetadataOutput {
  abi: Abi;
  devdoc: Devdoc;
  userdoc: Userdoc;
}

// Metadata type that reflects the metadata object from
// https://docs.soliditylang.org/en/latest/metadata.html
export interface Metadata {
  compiler: {
    keccak256?: string;
    version: string;
  };
  language: string;
  output: MetadataOutput;
  settings: {
    compilationTarget: {
      [sourceName: string]: string;
    };
    evmVersion: string;
    libraries?: {
      [index: string]: string;
    };
    metadata?: {
      appendCBOR?: boolean;
      bytecodeHash?: 'none' | 'ipfs' | 'bzzr0' | 'bzzr1';
      useLiteralContent?: boolean;
    };
    optimizer?: {
      details?: {
        constantOptimizer?: boolean;
        cse?: boolean;
        deduplicate?: boolean;
        inliner?: boolean;
        jumpdestRemover?: boolean;
        orderLiterals?: boolean;
        peephole?: boolean;
        yul?: boolean;
        yulDetails?: {
          optimizerSteps?: string;
          stackAllocation?: boolean;
        };
      };
      enabled: boolean;
      runs: number;
    };
    viaIR?: boolean;
    outputSelection?: any;
  };
  sources: MetadataSourceMap;
  version: number;
}

// TODO: Fully define solcJsonInput
export declare interface CompilableMetadata {
  solcJsonInput: JsonInput;
  contractPath: string;
  contractName: string;
}

export interface ImmutableReferences {
  [key: string]: Array<{
    length: number;
    start: number;
  }>;
}
export interface RecompilationResult {
  creationBytecode: string;
  deployedBytecode: string;
  metadata: string;
  immutableReferences: ImmutableReferences;
}

export type Transformation = {
  type: 'insert' | 'replace';
  reason:
    | 'constructor'
    | 'library'
    | 'immutable'
    | 'auxdata'
    | 'call-protection';
  offset: number;
  id?: string;
};

export const ConstructorTransformation = (offset: number): Transformation => ({
  type: 'insert',
  reason: 'constructor',
  offset,
});

export const AuxdataTransformation = (
  offset: number,
  id: string
): Transformation => ({
  type: 'replace',
  reason: 'auxdata',
  offset,
  id,
});

export const ImmutablesTransformation = (
  reason: 'library' | 'immutable',
  offset: number,
  id: string
): Transformation => ({
  type: 'replace',
  reason,
  offset,
  id,
});

export interface TransformationValues {
  constructorArguments?: string;
  libraries?: {
    [index: string]: string;
  };
  immutables?: {
    [index: string]: string;
  };
  cborAuxdata?: {
    [index: string]: string;
  };
}

export interface Match {
  address: string;
  chainId: string;
  runtimeMatch: Status;
  creationMatch: Status;
  storageTimestamp?: Date;
  message?: string;
  abiEncodedConstructorArguments?: string;
  create2Args?: Create2Args;
  libraryMap?: StringMap;
  /* contextVariables?: ContextVariables; */
  creatorTxHash?: string;
  immutableReferences?: ImmutableReferences;
  runtimeTransformations?: Transformation[];
  creationTransformations?: Transformation[];
  runtimeTransformationValues?: TransformationValues;
  creationTransformationValues?: TransformationValues;
  onchainRuntimeBytecode?: string;
  onchainCreationBytecode?: string;
}

export type Status =
  | 'perfect'
  | 'partial'
  | 'extra-file-input-bug'
  | 'error'
  | null;

export interface Create2Args {
  deployerAddress: string;
  salt: string;
  constructorArgs?: any[];
}

export type SourcifyChainExtension = {
  supported: boolean;
  contractFetchAddress?: string;
  graphQLFetchAddress?: string;
  txRegex?: string[];
  rpc?: Array<string | FetchRequest>;
};

// TODO: Double check against ethereum-lists/chains type
export type Chain = {
  name: string;
  title?: string;
  chainId: number;
  shortName?: string;
  network?: string;
  networkId?: number;
  nativeCurrency?: Currency;
  rpc: Array<string>;
  faucets?: string[];
  infoURL?: string;
};

export type SourcifyChainMap = {
  [chainId: string]: SourcifyChain;
};

type Currency = {
  name: string;
  symbol: string;
  decimals: number;
};

/* export type ContextVariables = {
  abiEncodedConstructorArguments?: string;
  msgSender?: string;
}; */

interface File {
  keccak256?: string;
  urls?: string[];
  content?: string;
}

interface Sources {
  [key: string]: File;
}

interface YulDetails {
  stackAllocation: boolean;
  optimizerSteps?: string;
}

interface Details {
  peephole?: boolean;
  inliner?: boolean;
  jumpdestRemover?: boolean;
  orderLiterals?: boolean;
  deduplicate?: boolean;
  cse?: boolean;
  constantOptimizer?: boolean;
  yul?: boolean;
  yulDetails?: YulDetails;
}

interface Optimizer {
  enabled?: boolean;
  runs?: number;
  details?: Details;
}

enum DebugInfo {
  default = 'default',
  strip = 'strip',
  debug = 'debug',
  verboseDebug = 'verboseDebug',
}

interface Debug {
  revertStrings: DebugInfo;
  debugInfo?: string[];
}

interface SettingsMetadata {
  useLiteralContent?: boolean;
  bytecodeHash?: string;
}

interface MapContractAddress {
  [key: string]: string;
}

interface Libraries {
  [key: string]: MapContractAddress;
}

interface OutputSelection {
  [key: string]: any;
}

interface Contracts {
  [key: string]: string[];
}

interface ModelChecker {
  contracts?: Contracts;
  divModNoSlacks?: boolean;
  engine?: string;
  invariants?: string[];
  showUnproved?: boolean;
  solvers?: string[];
  targets?: string[];
  timeout?: number;
}

interface Settings {
  stopAfter?: string;
  remappings?: string[];
  optimizer?: Optimizer;
  evmVersion?: string;
  viaIR?: boolean;
  debug?: Debug;
  metadata?: SettingsMetadata;
  libraries?: Libraries;
  outputSelection: OutputSelection;
  modelChecker?: ModelChecker;
  compilationTarget?: string;
}

export interface JsonInput {
  language: string;
  sources: Sources;
  settings?: Settings;
}
interface CompilerOutputError {
  sourceLocation?: {
    file: string;
    start: number;
    end: number;
  };
  type: 'TypeError' | 'InternalCompilerError' | 'Exception';
  component: 'general' | 'ewasm';
  severity: 'error' | 'warning';
  message: string;
  formattedMessage?: string;
}
interface CompilerOutputEvmBytecode {
  object: string;
  opcodes?: string;
  sourceMap?: string;
  linkReferences?:
    | {}
    | {
        [globalName: string]: {
          [name: string]: { start: number; length: number }[];
        };
      };
}

interface CompilerOutputEvmDeployedBytecode extends CompilerOutputEvmBytecode {
  immutableReferences?: ImmutableReferences;
}
interface CompilerOutputSources {
  [globalName: string]: {
    id: number;
    ast: any;
    legacyAST: any;
  };
}
interface CompilerOutputContracts {
  [globalName: string]: {
    [contractName: string]: {
      abi: Abi;
      metadata: string;
      userdoc?: any;
      devdoc?: any;
      ir?: string;
      irAst?: any;
      irOptimized?: string;
      irOptimizedAst?: any;
      storageLayout?: any;
      evm: {
        assembly?: string;
        legacyAssembly?: any;
        bytecode: CompilerOutputEvmBytecode;
        deployedBytecode?: CompilerOutputEvmDeployedBytecode;
        methodIdentifiers?: {
          [methodName: string]: string;
        };
        gasEstimates?: {
          creation: {
            codeDepositCost: string;
            executionCost: string;
            totalCost: string;
          };
          external: {
            [functionSignature: string]: string;
          };
          internal: {
            [functionSignature: string]: string;
          };
        };
      };
      ewasm?: {
        wast: string;
        wasm: string;
      };
    };
  };
}
export interface CompilerOutput {
  errors?: CompilerOutputError[];
  sources?: CompilerOutputSources;
  contracts: CompilerOutputContracts;
}

export interface CompiledContractArtifactsCborAuxdata {
  [index: string]: {
    offset: number;
    value: string;
  };
}

export interface CompiledContractArtifacts {
  creationBytecodeCborAuxdata: CompiledContractArtifactsCborAuxdata;
  runtimeBytecodeCborAuxdata: CompiledContractArtifactsCborAuxdata;
}
