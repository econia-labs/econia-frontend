import { useWallet } from "@aptos-labs/wallet-adapter-react";
import React, { useEffect, useState } from "react";

import { UNCONNECTED_NOTICE_MESSAGE } from "@/env";

import { BaseModal } from "../BaseModal";

const UnConnectedNotice = () => {
  const [isOpen, setOpen] = useState(false);
  const { account, isLoading } = useWallet();

  useEffect(() => {
    if (!isLoading && !account?.address) {
      setOpen(true);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      showCloseButton={true}
      showBackButton={false}
      className="max-width-full !h-[295px] !w-[460px]"
    >
      <div className="h-[400px] max-h-full w-full  p-4  md:p-10">
        <div className="flex h-[400px] max-h-full max-w-full flex-col items-center justify-center">
          <h1 className="mb-2 font-jost text-[32px] font-bold text-neutral-100">
            Notice
          </h1>
          <p className="p-2 text-center align-middle font-roboto-mono text-sm font-light leading-6 text-neutral-500">
            {UNCONNECTED_NOTICE_MESSAGE}
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default UnConnectedNotice;
