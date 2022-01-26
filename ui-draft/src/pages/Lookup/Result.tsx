import { renderToString } from "react-dom/server";
import {
  HiBadgeCheck,
  HiOutlineArrowLeft,
  HiOutlineInformationCircle,
  HiX,
} from "react-icons/hi";
import { Link } from "react-router-dom";
import ReactTooltip from "react-tooltip";
import Button from "../../components/Button";
import {
  ID_TO_CHAIN,
  REPOSITORY_URL_FULL_MATCH,
  REPOSITORY_URL_PARTIAL_MATCH,
} from "../../constants";
import { CheckAllByAddressResult } from "../../types";

type ResultProp = {
  response: CheckAllByAddressResult;
  setResponse: React.Dispatch<
    React.SetStateAction<CheckAllByAddressResult | undefined>
  >;
};

const URL_TYPE = {
  REMIX: "remix",
  REPO: "repo",
};

const generateUrl = (
  type: string,
  chainId: string,
  address: string,
  status: string
) => {
  const REPO_URL =
    status === "partial"
      ? REPOSITORY_URL_PARTIAL_MATCH
      : REPOSITORY_URL_FULL_MATCH;
  if (type === URL_TYPE.REMIX)
    return `https://remix.ethereum.org/?#activate=sourcify&call=sourcify//fetchAndSave//${address}//${chainId}`;
  return `${REPO_URL}/${chainId}/${address}/`;
};

type NetworkRowProp = {
  chainId: string;
  status: string;
  address: any;
};
type FoundProp = {
  response: CheckAllByAddressResult;
};
type NotFoundProp = {
  address: any;
};

const chainToName = (chainId: any) => {
  return ID_TO_CHAIN[chainId]?.label;
};

type MatchStatusProps = {
  status: string;
};
const PerfectMatchInfoText = (
  <span>
    A perfect match indicates the Solidity source code does not deviate a single
    byte from the source code when deployed. <br /> See{" "}
    <a
      href="https://docs.sourcify.dev/docs/full-vs-partial-match"
      className="underline cursor"
      target="_blank"
      rel="noreferrer"
    >
      docs
    </a>{" "}
    for details.
  </span>
);
const PartialMatchInfoText = (
  <span>
    A partial match indicates the Solidity source code functionally corresponds
    to the deployed contract but some aspects of the source code might differ
    from the original source code. <br /> See{" "}
    <a
      href="https://docs.sourcify.dev/docs/full-vs-partial-match"
      className="underline cursor"
      target="_blank"
      rel="noreferrer"
    >
      docs
    </a>{" "}
    for details.
  </span>
);
const MatchStatusBadge = ({ status }: MatchStatusProps) => {
  if (status === "perfect") {
    return (
      <>
        <ReactTooltip
          effect="solid"
          delayHide={500}
          clickable={true}
          className="max-w-xl"
          id="perfect-info"
        />
        <span
          className="text-sm px-3 ml-1 py-1.5 capitalize bg-green-600 text-white font-medium rounded-full"
          data-tip={renderToString(PerfectMatchInfoText)}
          data-html={true}
          data-for="perfect-info"
        >
          {status} match
        </span>
      </>
    );
  }
  if (status === "partial") {
    return (
      <>
        <ReactTooltip
          effect="solid"
          delayHide={500}
          clickable={true}
          className="max-w-xl"
          id="partial-info"
        />
        <span
          className="text-sm px-3 ml-1 py-1.5 capitalize bg-[#969f19] text-white font-medium rounded-full"
          data-tip={renderToString(PartialMatchInfoText)}
          data-html={true}
          data-for="partial-info"
        >
          {status} match
        </span>
      </>
    );
  }
  return null;
};
const NetworkRow = ({ address, chainId, status }: NetworkRowProp) => {
  return (
    <tr className="border-b hover:bg-gray-100">
      <td
        className="flex items-center py-4  
      pl-4"
      >
        <span className="text-lg font-bold">{chainToName(chainId)}</span>{" "}
      </td>
      <td>
        <MatchStatusBadge status={status} />
      </td>
      <td className="py-4 text-right">
        <a
          className="underline"
          href={generateUrl(URL_TYPE.REPO, chainId, address, status)}
          target="_blank"
          rel="noreferrer"
        >
          View in Sourcify Repository
        </a>
      </td>
      <td className="py-4 pr-4 text-right">
        <a
          className="underline"
          href={generateUrl(URL_TYPE.REMIX, chainId, address, status)}
          target="_blank"
          rel="noreferrer"
        >
          View in Remix
        </a>
      </td>
    </tr>
  );
};

const InfoText = (
  <span>
    Sourcify verification means a matching Solidity source code of the deployed
    contract is available on the Sourcify repo. <br /> See{" "}
    <a
      href="https://docs.sourcify.dev/docs/full-vs-partial-match"
      className="underline cursor"
      target="_blank"
      rel="noreferrer"
    >
      docs
    </a>{" "}
    for details.
  </span>
);
const Found = ({ response }: FoundProp) => {
  return (
    <div className="flex flex-col justify-center">
      <ReactTooltip
        effect="solid"
        delayHide={500}
        clickable={true}
        className="max-w-xl"
        id="verified-info"
      />
      <div className="mx-20 mt-1">
        <p>
          The contract at address{" "}
          <span className="font-medium">{response?.address}</span> is{" "}
          <span
            data-tip={renderToString(InfoText)}
            data-html={true}
            data-for="verified-info"
          >
            verified
            <HiOutlineInformationCircle className="inline text-gray-600 text-lg" />
          </span>{" "}
          on the following networks:
        </p>
      </div>
      <table className="mt-12 mx-4 border-t">
        {response?.chainIds.map(({ chainId, status }) => (
          <NetworkRow
            address={response?.address}
            chainId={chainId}
            status={status}
            key={chainId}
          />
        ))}
      </table>
      <div className="mt-14">
        <p>Can’t find the network you’re looking for?</p>
        <Link to="/verifier">
          <Button>Verify Contract</Button>
        </Link>
      </div>
    </div>
  );
};

const NotFound = ({ address }: NotFoundProp) => {
  return (
    <>
      <div className="mx-20 mt-6">
        <p>
          The contract at address <span className="font-medium">{address}</span>{" "}
          is not verified on Sourcify.
        </p>
      </div>
      <div className="mt-14">
        <p>Do you have the source code and metadata??</p>
        <Link to="/verifier">
          <Button>Verify Contract</Button>
        </Link>
      </div>
    </>
  );
};

const verificationIcon = (status: string | undefined) => {
  if (status === "false") {
    return <HiX className="text-8xl text-red-600" />;
  }
  return <HiBadgeCheck className="text-8xl text-green-600" />;
};

const Result = ({ response, setResponse }: ResultProp) => {
  return (
    <div className="flex flex-col basis-0 py-8 flex-grow rounded-lg px-8 transition-all ease-in-out duration-300 bg-white overflow-hidden shadow-md">
      <HiOutlineArrowLeft
        className="h-8 w-8 cursor-pointer"
        onClick={() => setResponse(undefined)}
      />
      <div className="flex flex-col items-center text-center">
        {verificationIcon(response?.status)}
        {!!response && response?.status !== "false" ? (
          <Found response={response} />
        ) : (
          <NotFound address={response?.address} />
        )}
      </div>
    </div>
  );
};

export default Result;
