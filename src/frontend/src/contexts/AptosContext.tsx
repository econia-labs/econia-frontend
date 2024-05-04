import {
  type Aptos,
  type PendingTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { CoinListClient, type NetworkType } from "@manahippo/coin-list";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { toast } from "react-toastify";

import { MAINNET_TOKEN_LIST, TESTNET_TOKEN_LIST } from "@/constants";
import { NETWORK_NAME, READ_ONLY_MESSAGE, READ_ONLY_MODE } from "@/env";
import { getAptosClient } from "@/utils/helpers";

type WalletContextState = ReturnType<typeof useWallet>;

export type AptosContextState = {
  aptosClient: Aptos;
  signAndSubmitTransaction: WalletContextState["signAndSubmitTransaction"];
  account: WalletContextState["account"];
  coinListClient: CoinListClient;
};

export const AptosContext = createContext<AptosContextState | undefined>(
  undefined,
);

export function AptosContextProvider({ children }: PropsWithChildren) {
  const { signAndSubmitTransaction: adapterSignAndSubmitTxn, account } =
    useWallet();
  const aptosClient = useMemo(() => {
    return getAptosClient();
  }, []);

  const signAndSubmitTransaction = useCallback(
    async (
      ...args: Parameters<WalletContextState["signAndSubmitTransaction"]>
    ) => {
      if (READ_ONLY_MODE === 1) {
        toast.error(READ_ONLY_MESSAGE);
        return;
      }
      const transaction = args[0];

      try {
        transaction.data.functionArguments =
          transaction.data.functionArguments.map((arg) => {
            if (typeof arg === "bigint") {
              return arg.toString();
            } else {
              return arg;
            }
          });
        const res: PendingTransactionResponse = await adapterSignAndSubmitTxn(
          transaction,
        );
        try {
          await aptosClient.waitForTransaction({
            transactionHash: res.hash,
          });
          toast.success("Transaction confirmed");
          return true;
        } catch (error) {
          toast.error("Transaction failed");
          console.error(error);
          return false;
        }
        //eslint-disable-next-line
      } catch (error: any) {
        if (error && error?.includes("Account not found")) {
          toast.error("You need APT balance!");
        }
      }
    },
    [adapterSignAndSubmitTxn, aptosClient],
  );
  const coinListClient = useMemo(() => {
    return new CoinListClient(
      true,
      (NETWORK_NAME as NetworkType) || "testnet",
      NETWORK_NAME === "mainnet" ? MAINNET_TOKEN_LIST : TESTNET_TOKEN_LIST,
    );
  }, []);

  const value: AptosContextState = {
    aptosClient,
    account,
    signAndSubmitTransaction,
    coinListClient,
  };

  return (
    <AptosContext.Provider value={value}>{children}</AptosContext.Provider>
  );
}

export const useAptos = (): AptosContextState => {
  const context = useContext(AptosContext);
  if (context == null) {
    throw new Error(
      "useAccountContext must be used within a AccountContextProvider.",
    );
  }
  return context;
};
