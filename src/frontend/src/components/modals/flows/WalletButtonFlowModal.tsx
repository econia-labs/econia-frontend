import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { AccountDetailsModal } from "@/components/AccountDetailsModal";
import { SelectMarketContent } from "@/components/trade/DepositWithdrawModal/SelectMarketContent";
import { type ApiMarket } from "@/types/api";
import { getAllMarket } from "@/utils/helpers";

import { BaseModal } from "../BaseModal";
import { DepositWithdrawContent } from "../content/DepositWithdrawContent";
import { RegisterAccountContent } from "../content/RegisterAccountContent";

type Props = {
  selectedMarket: ApiMarket;
  allMarketData: ApiMarket[];
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal flows:
 * 1. Account Details -> Deposit/Withdraw
 * 2. Account Details -> Register Account -> Select Market -> Account Details // wait for on chain registration / loader
 *
 * edge cases:
 * - filtered markets is empty
 *    - show "no markets available" message
 *    - no unregistered markets available
 */
enum FlowStep {
  AccountDetails,
  DepositWithdraw,
  RegisterAccount,
  MarketSelect,
  Closed,
}

export const WalletButtonFlowModal: React.FC<Props> = ({
  selectedMarket,
  isOpen,
  onClose,
  allMarketData,
}) => {
  const [market, setMarket] = useState(selectedMarket);
  const [flowStep, setFlowStep] = useState(FlowStep.Closed);
  const [selectedMarketToRegister, setSelectedMarketToRegister] =
    useState<ApiMarket>();
  const { account } = useWallet();
  const queryClient = useQueryClient();

  // TODO: change this after merge with ECO-319
  const { data: registeredMarkets } = useQuery(
    ["registeredMarkets", account?.address],
    async () => {
      // TODO pull registered markets from SDK (ECO-355)
      return await getAllMarket();
    },
  );

  const onDepositWithdrawClick = (selected: ApiMarket) => {
    setMarket(selected);
    // assumes that market selected is valid
    setFlowStep(FlowStep.DepositWithdraw);
  };
  const onRegisterAccountClick = () => {
    if (allMarketData.length == 0) {
      toast.info("No unregistered markets available!");
      return;
    }
    setFlowStep(FlowStep.MarketSelect);
  };
  const onMarketSelectClick = () => {
    setFlowStep(FlowStep.MarketSelect);
  };
  const selectMarketCallback = (selected: number) => {
    setFlowStep(FlowStep.RegisterAccount);
    setSelectedMarketToRegister(
      allMarketData.find(({ market_id }) => market_id === selected),
    );
  };

  // TODO: https://github.com/econia-labs/econia/pull/421#discussion_r1323744522
  useEffect(() => {
    if (isOpen && flowStep === FlowStep.Closed) {
      setFlowStep(FlowStep.AccountDetails);
    }

    // if the modal is closed, we want to reset the flow step and trigger the onClose callback
    if (!isOpen) {
      onClose();
      setFlowStep(FlowStep.Closed);
    }

    // TODO: refetch registered markets on chain registration OR flow step change
  }, [isOpen, flowStep, onClose, allMarketData, registeredMarkets]);

  return (
    <>
      {flowStep === FlowStep.AccountDetails && (
        <BaseModal
          isOpen={isOpen}
          onClose={onClose}
          showCloseButton={true}
          showBackButton={false}
          className="h-[545px] !w-[457px]"
        >
          <AccountDetailsModal
            onClose={onClose}
            onDepositWithdrawClick={onDepositWithdrawClick}
            onRegisterAccountClick={onRegisterAccountClick}
          />
        </BaseModal>
      )}
      {flowStep === FlowStep.DepositWithdraw && (
        <BaseModal
          className="!w-[457.093px] !p-0"
          isOpen={flowStep === FlowStep.DepositWithdraw}
          onClose={onClose}
          // custom step, so we don't want to close the modal when the user clicks the close button
          // rather we go back to the account details step
          onBack={() => {
            setFlowStep(FlowStep.AccountDetails);
          }}
          showCloseButton={true}
          showBackButton={true}
        >
          <DepositWithdrawContent
            isRegistered={true}
            selectedMarket={market}
          ></DepositWithdrawContent>
        </BaseModal>
      )}
      {flowStep === FlowStep.RegisterAccount && (
        <BaseModal
          className="h-[327px] !w-[342px] px-9 py-10"
          isOpen={isOpen}
          onClose={onClose}
          showCloseButton={true}
          showBackButton={true}
          onBack={() => {
            setFlowStep(FlowStep.MarketSelect);
          }}
        >
          <RegisterAccountContent
            // if user hasn't selected one through modal, automatically select the first one that user doesnt have an account for
            selectedMarket={selectedMarketToRegister || allMarketData[0]}
            selectMarket={onMarketSelectClick}
            onAccountCreated={(status: boolean) => {
              if (status) {
                queryClient.invalidateQueries({
                  queryKey: ["createMarketAccount"],
                });
                setFlowStep(FlowStep.AccountDetails);
              }
            }}
          />
        </BaseModal>
      )}
      {flowStep === FlowStep.MarketSelect && (
        <BaseModal
          isOpen={isOpen}
          onClose={onClose}
          showCloseButton={true}
          className={"pl-0 pr-0"}
          showBackButton={true}
          onBack={() => {
            setFlowStep(FlowStep.AccountDetails);
          }}
        >
          <SelectMarketContent
            allMarketData={allMarketData}
            onSelectMarket={selectMarketCallback}
          />
        </BaseModal>
      )}
    </>
  );
};
