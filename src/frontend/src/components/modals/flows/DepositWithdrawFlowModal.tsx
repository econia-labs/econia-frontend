import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAptos } from "@/contexts/AptosContext";
import { ECONIA_ADDR } from "@/env";
import { type ApiMarket } from "@/types/api";

// import { getAllMarket } from "@/utils/helpers";
import { BaseModal } from "../BaseModal";
import { DepositWithdrawContent } from "../content/DepositWithdrawContent";

type Props = {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal states:
 * 1. Market Account is registered, able to interact and data is available
 * 2. Market account is not registered, unable to interact and data is not available until account is created
 */

export const DepositWithdrawFlowModal: React.FC<Props> = ({
  selectedMarket,
  isOpen,
  onClose,
  allMarketData,
}) => {
  const { account, aptosClient } = useAptos();

  // TODO: change this after merge with ECO-319
  // const { data: registeredMarkets } = useQuery(
  //   ["userMarketAccounts", account?.address],
  //   async () => {
  //     // TODO pull registered markets from SDK (ECO-355)
  //     return await getAllMarket();
  //   },
  // );

  const handleCheckRegisteredMarketAccount = useCallback(async () => {
    try {
      if (!account?.address) {
        return false;
      }
      const payload = {
        function: `${ECONIA_ADDR}::user::has_market_account_by_market_id`,
        type_arguments: [],
        arguments: [`${account?.address}`, selectedMarket.market_id.toString()],
      };
      const data = await aptosClient.view(payload);

      const isRegistered = data[0] as boolean;
      return isRegistered;
    } catch (error) {
      console.warn(error);
      return false;
    }
  }, [account?.address, aptosClient, selectedMarket]);

  const { data: isRegistered } = useQuery(
    [
      "userCheckRegisteredMarketAccount",
      account?.address,
      selectedMarket.market_id,
    ],
    () => {
      // TODO pull registered markets from SDK (ECO-355)
      return handleCheckRegisteredMarketAccount();
      // return MOCK_MARKETS;
    },
  );

  // const isRegistered = useMemo(
  //   () =>
  //     // !!registeredMarkets &&
  //     // registeredMarkets.some(
  //     //   (market) => market.market_id === selectedMarket.market_id,
  //     // ),

  //   [handleCheckRegisteredMarketAccount],
  // );

  return (
    <>
      <BaseModal
        className="w-[602px]"
        isOpen={isOpen}
        onClose={onClose}
        showCloseButton={true}
        showBackButton={false}
      >
        <DepositWithdrawContent
          isRegistered={!!isRegistered}
          selectedMarket={selectedMarket}
        />
      </BaseModal>
    </>
  );
};
