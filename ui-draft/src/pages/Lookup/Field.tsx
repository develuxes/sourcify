import { isAddress } from "@ethersproject/address";
import { ChangeEventHandler, FormEventHandler, useState } from "react";
import Input from "../../components/Input";
import LoadingOverlay from "../../components/LoadingOverlay";
import Toast from "../../components/Toast";

type FieldProp = {
  loading: boolean;
  handleRequest: (address: string) => void;
};

const Field = ({ loading, handleRequest }: FieldProp) => {
  const [address, setAddress] = useState<any>("");
  const [error, setError] = useState<string>("");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const isValidAddress = isAddress(address);
    if (!isValidAddress) {
      setError("Invalid Address");
      return;
    }
    handleRequest(address);
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const newAddress = e.currentTarget.value;
    setAddress(newAddress);
    const isValidAddress = isAddress(newAddress);
    if (!isValidAddress) {
      setError("Invalid Address");
      return;
    }
    handleRequest(newAddress);
  };

  return (
    <div className="flex flex-col py-16 px-12 flex-grow rounded-lg transition-all ease-in-out duration-300 bg-white overflow-hidden shadow-md">
      <div className="flex flex-col text-left relative">
        {loading && <LoadingOverlay message="Looking up the contract" />}
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="contract-address"
            className="font-bold mb-8 text-xl block text-center"
          >
            Contract Address
          </label>
          <Input
            id="contract-address"
            value={address}
            onChange={handleChange}
            placeholder="0xcaaf6B2ad74003502727e8b8Da046Fab40D6c035"
          />
          {!!error && (
            <Toast
              message={error}
              isShown={!!error}
              dismiss={() => setError("")}
            />
          )}{" "}
        </form>
      </div>
    </div>
  );
};

export default Field;
