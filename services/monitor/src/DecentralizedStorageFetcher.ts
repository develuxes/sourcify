import { FileHash } from "./util";
import logger from "./logger";
import { DecentralizedStorageOrigin } from "./types";
import assert from "assert";
import { EventEmitter } from "stream";
import { GatewayFetcher } from "./GatewayFetcher";

/**
 * Fetcher for a certain type of Decentralized Storage (e.g. IPFS)
 * Will try to fetch from multiple gateways.
 */
export default class DecentralizedStorageFetcher extends EventEmitter {
  // TODO: Run local js-ipfs instead of using gateways??
  public origin: DecentralizedStorageOrigin;
  private gatewayFetchers: GatewayFetcher[];

  // A file can be requested for multiple contracts. We only want to fetch it once. This mapping keeps track of the number of unique files.
  private uniqueFiles: { [key: string]: boolean } = {};
  // Counter to keep track of the number of unique files. Used for logging.
  private uniqueFilesCounter = 0;

  // A file can be requested by multiple contracts. This counter keeps track of the number of subscribers, i.e. contracts that want to receive a file. Used for logging.
  private subcriberCounter = 0;

  constructor(origin: DecentralizedStorageOrigin, gateways: string[]) {
    super();
    this.origin = origin;
    const fetchTimeout = parseInt(
      process.env[`${origin.toUpperCase()}_GATEWAY_TIMEOUT`] || "30000"
    );
    const fetchInterval = parseInt(
      process.env[`${origin.toUpperCase()}_GATEWAY_INTERVAL`] || "5000"
    );
    const fetchRetries = parseInt(
      process.env[`${origin.toUpperCase()}_GATEWAY_RETRIES`] || "3"
    );

    this.gatewayFetchers = gateways.map(
      (gatewayURL) =>
        new GatewayFetcher({
          url: gatewayURL,
          fetchTimeout,
          fetchInterval,
          fetchRetries,
        })
    );
  }

  fetch = (fileHash: FileHash) => {
    assert(fileHash.origin === this.origin, "Invalid origin");

    return new Promise<string>((resolve, reject) => {
      const cleanupSubscription = () => {
        this.subcriberCounter--;
        this.removeListener(`${fileHash.hash} fetched`, successListener);
        this.removeListener(`${fileHash.hash} fetch failed`, failListener);
        logger.info(
          `Removed listener for ${fileHash.hash}. \n Unique Files counter: ${this.uniqueFilesCounter} \n Subscriber counter: ${this.subcriberCounter}`
        );
      };

      // Only resolve on success or failure
      const successListener = (file: string) => {
        cleanupSubscription();
        resolve(file);
      };

      const failListener = () => {
        cleanupSubscription();
        reject(`Failed to fetch ${fileHash.hash} from ${this.origin}`);
      };

      // Subscribe to fetching of the file.
      this.on(`${fileHash.hash} fetched`, successListener);
      // Subscribe to failure of fetching the file.
      this.on(`${fileHash.hash} fetch failed`, failListener);

      // Need the file for the first time.
      if (!this.uniqueFiles[fileHash.hash]) {
        this.uniqueFiles[fileHash.hash] = true;
        this.subcriberCounter++;
        this.uniqueFilesCounter++;

        for (const gatewayFetcher of this.gatewayFetchers) {
          let shouldBreak = false;

          logger.info(
            `Fetching ${fileHash.hash} from ${gatewayFetcher.url} \n Unique Files counter: ${this.uniqueFilesCounter} \n Subscriber counter: ${this.subcriberCounter}`
          );
          gatewayFetcher
            .fetchWithRetries(fileHash.hash)
            .then((file) => {
              logger.info(
                `Fetched ${fileHash.hash} from ${gatewayFetcher.url}`
              );
              this.uniqueFilesCounter--;
              delete this.uniqueFiles[fileHash.hash];
              // Notify the subscribers
              this.emit(`${fileHash.hash} fetched`, file);
            })
            .catch((err) => {
              if (err.timeout) {
                logger.info(
                  `Timeout fetching ${fileHash.hash} from ${gatewayFetcher.url} \n ${err}`
                );
                this.uniqueFilesCounter--;
                delete this.uniqueFiles[fileHash.hash];
                // Notify the subscribers
                this.emit(`${fileHash.hash} fetch failed`);
                shouldBreak = true; // Don't try to fetch from other gateways
              } else {
                // Something's wront with the GW. Use fallback
                logger.error(
                  `Error fetching ${fileHash.hash} from ${gatewayFetcher.url} \n ${err}`
                );
              }
            });
          if (shouldBreak) {
            break;
          }
        }
        logger.info(`Couldn't fetch ${fileHash.hash} from any gateways.`);
        this.emit(`${fileHash.hash} fetch failed`);
      }
      // Already trying to fetch this file. Don't fetch again.
      // The event listener for when the file is fetches is already added above.
      else {
        this.subcriberCounter++;
        logger.info(
          `Received a fetch for ${fileHash.hash}. There's already a fetch in progress. \n Unique Files counter: ${this.uniqueFilesCounter} \n Subscriber counter: ${this.subcriberCounter}`
        );
      }
    });
  };
}
