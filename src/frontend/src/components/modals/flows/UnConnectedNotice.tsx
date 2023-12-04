import React, { useEffect, useState } from "react";
import { BaseModal } from "../BaseModal";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { UNCONNECTED_NOTICE_MESSAGE } from "@/env";

const UnConnectedNotice = () => {
  const [isOpen, setOpen] = useState(false);
  const { account, isLoading } = useWallet();

  useEffect(() => {
    if (!isLoading && !account?.address) {
      setOpen(true);
    }
  }, [isLoading]);
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      showCloseButton={true}
      showBackButton={false}
      className="!w-[500px]"
    >
      <div className="h-[400px] max-h-full w-full  p-4  md:p-10">
        <div className="flex h-[400px] max-h-full w-[400px] max-w-full flex-col items-center justify-center font-jost">
          <h1 className="mb-4 text-[32px] font-bold text-neutral-100">
            Notice
          </h1>
          <p className="text-sm text-neutral-500">
            {UNCONNECTED_NOTICE_MESSAGE}
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default UnConnectedNotice;
