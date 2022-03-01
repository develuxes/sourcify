import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Toast from "../../components/Toast";
import {
  ADD_FILES_URL,
  RESTART_SESSION_URL,
  SESSION_DATA_URL,
  VERIFY_VALIDATED_URL,
} from "../../constants";
import {
  Chain,
  ChainMap,
  DropzoneFile,
  IGenericError,
  IResponseError,
  SendableContract,
  SessionResponse,
  VerificationInput,
} from "../../types";
import { getSourcifyChains } from "../../utils/api";
import CheckedContractsView from "./CheckedContractsView";
import FileUpload from "./FileUpload";

const Verifier: React.FC = () => {
  const [addedFiles, setAddedFiles] = useState<string[]>([]);
  const [unusedFiles, setUnusedFiles] = useState<string[]>([]);
  const [checkedContracts, setCheckedContracts] = useState<SendableContract[]>(
    []
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sourcifyChains, setSourcifyChains] = useState<Chain[]>([]);
  const [sourcifyChainMap, setSourcifyChainMap] = useState<ChainMap>({});

  useEffect(() => {
    fetchAndUpdate(SESSION_DATA_URL);
    getSourcifyChains()
      .then((sourcifyChains) => {
        setSourcifyChains(sourcifyChains);
        const chainMap = sourcifyChains.reduce<ChainMap>(function (
          acc,
          currentChain
        ) {
          acc[currentChain.chainId] = currentChain;
          return acc;
        },
        {});
        setSourcifyChainMap(chainMap);
      })
      .catch((err) => {
        setErrorMessage("Can't fetch Sourcify chains from the server!");
        console.log(err);
      });
  }, []);

  const fetchAndUpdate = async (URL: string, fetchOptions?: RequestInit) => {
    try {
      const rawRes: Response = await fetch(URL, {
        credentials: "include",
        method: fetchOptions?.method || "GET", // default GET
        ...fetchOptions,
      });
      if (!rawRes.ok) {
        const err: IGenericError = await rawRes.json();
        throw new Error(err.error);
      }
      const res: SessionResponse = await rawRes.json();
      setUnusedFiles([...res.unused]);
      setCheckedContracts([...res.contracts]);
      setAddedFiles([...res.files]);
      setErrorMessage("");
      return res;
    } catch (e) {
      const error = e as IResponseError;
      setErrorMessage(error.message);
    }
  };

  const handleFiles = async (files: DropzoneFile[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    await fetchAndUpdate(ADD_FILES_URL, {
      method: "POST",
      body: formData,
    });
  };

  const restartSession = async () => {
    await fetch(RESTART_SESSION_URL, {
      credentials: "include",
      method: "POST",
    });
    setUnusedFiles([]);
    setCheckedContracts([]);
    setAddedFiles([]);
    return;
  };

  /**
   * Function to submit a validated contract to verification with chainId and address.
   *
   * @param sendable -
   */
  const verifyCheckedContract = async (sendable: VerificationInput) => {
    console.log("Verifying checkedContract " + sendable.verificationId);
    return fetchAndUpdate(VERIFY_VALIDATED_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contracts: [sendable],
      }),
    });
  };

  return (
    <div className="flex flex-col flex-1 pb-8 px-8 md:px-12 lg:px-24">
      <Header />
      <Toast
        message={errorMessage}
        isShown={!!errorMessage}
        dismiss={() => setErrorMessage("")}
      />
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold">Verifier</h1>
        <p className="mt-2">
          Verify smart contracts by recompiling with the Solidity source code
          and metadata.
        </p>
      </div>
      <div className="flex flex-col md:flex-row flex-grow mt-6">
        <FileUpload
          handleFilesAdded={handleFiles}
          addedFiles={addedFiles}
          metadataMissing={
            unusedFiles.length > 0 && checkedContracts.length === 0
          }
          restartSession={restartSession}
          fetchAndUpdate={fetchAndUpdate}
        />
        <CheckedContractsView
          checkedContracts={checkedContracts}
          isHidden={checkedContracts.length < 1}
          verifyCheckedContract={verifyCheckedContract}
        />
      </div>
    </div>
  );
};

export default Verifier;
