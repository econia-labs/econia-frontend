import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { type PropsWithChildren } from "react";

import { useConnectWallet } from "@/contexts/ConnectWalletContext";

import { Button } from "./Button";

export const ConnectedButton: React.FC<
  PropsWithChildren<{ className?: string }>
> = ({ className, children }) => {
  const { connected } = useWallet();
  const { connectWallet } = useConnectWallet();

  return (
    <>
      {!connected ? (
        <Button
          className={`whitespace-nowrap !font-roboto-mono !text-base tracking-[0.32px] !leading-[22px] !font-bold w-[182px] text-neutral-700 ${className}`}
          variant="primary"
          onClick={(e) => {
            e.preventDefault();
            connectWallet();
          }}
        >
          CONNECT WALLET
        </Button>
      ) : (
        children
      )}
    </>
  );
};
