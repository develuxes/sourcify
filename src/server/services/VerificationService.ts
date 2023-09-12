import {
  verifyDeployed,
  CheckedContract,
  SourcifyChainMap,
  Match,
  /* ContextVariables, */
} from "@ethereum-sourcify/lib-sourcify";
import { getCreatorTx } from "./utils/contract-creation-util";

export interface IVerificationService {
  supportedChainsMap: SourcifyChainMap;
  verifyDeployed(
    checkedContract: CheckedContract,
    chainId: string,
    address: string,
    /* contextVariables?: ContextVariables, */
    creatorTxHash?: string
  ): Promise<Match>;
}

export class VerificationService implements IVerificationService {
  supportedChainsMap: SourcifyChainMap;

  constructor(supportedChainsMap: SourcifyChainMap) {
    this.supportedChainsMap = supportedChainsMap;
  }

  public async verifyDeployed(
    checkedContract: CheckedContract,
    chainId: string,
    address: string,
    /* contextVariables?: ContextVariables, */
    creatorTxHash?: string
  ): Promise<Match> {
    const sourcifyChain = this.supportedChainsMap[chainId];
    const foundCreatorTxHash = await getCreatorTx(sourcifyChain, address);
    let match;
    try {
      const creatorTxHash_ = creatorTxHash || foundCreatorTxHash || undefined;
      match = await verifyDeployed(
        checkedContract,
        sourcifyChain,
        address,
        /* contextVariables, */
        creatorTxHash_
      );
      match.creatorTxHash = creatorTxHash_;
      return match;
    } catch (err) {
      // Find the creator tx if it wasn't supplied and try verifying again with it.
      if (
        !creatorTxHash &&
        err instanceof Error &&
        err.message === "The deployed and recompiled bytecode don't match."
      ) {
        if (foundCreatorTxHash) {
          match = await verifyDeployed(
            checkedContract,
            sourcifyChain,
            address,
            /* contextVariables, */
            foundCreatorTxHash
          );
          return match;
        }
      }
      throw err;
    }
  }
}
