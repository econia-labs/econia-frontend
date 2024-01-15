import React, { useState } from "react";

import { BaseModal } from "@/components/modals/BaseModal";
import { type ApiMarket } from "@/types/api";

import { OrderEntry } from "../OrderEntry";

const MobileOrderEntry = ({
  marketData,
  onDepositWithdrawClick,
}: {
  marketData: ApiMarket;
  onDepositWithdrawClick: () => void;
}) => {
  const [modal, setModal] = useState<{
    side: "buy" | "sell";
    isOpen: boolean;
  }>({
    side: "buy",
    isOpen: false,
  });

  const openModal = (side: "buy" | "sell") => () => {
    setModal({
      isOpen: true,
      side: side,
    });
  };

  const closeModal = () => {
    setModal({
      ...modal,
      isOpen: false,
    });
  };
  return (
    <div className="z-20 md:hidden">
      <div className="fixed bottom-0 left-0 flex w-full gap-6 bg-fade px-6 py-4">
        <button
          onClick={openModal("buy")}
          className="h-9 w-[calc(50%-12px)] cursor-pointer bg-green text-center font-medium text-neutral-800"
        >
          Buy
        </button>
        <button
          onClick={openModal("sell")}
          className="h-9 w-[calc(50%-12px)] cursor-pointer bg-red text-center font-medium text-neutral-800"
        >
          Sell
        </button>
      </div>

      <div className="">
        <BaseModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          className="w-full max-w-[284px] !p-3 "
        >
          <OrderEntry
            onDepositWithdrawClick={onDepositWithdrawClick}
            defaultSide={modal.side}
            marketData={marketData}
          />
        </BaseModal>
      </div>
    </div>
  );
};

export default MobileOrderEntry;
