import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";

import { Button } from "@/components/Button";
import { API_URL } from "@/env";
import { type ApiMarket } from "@/types/api";
import { shorten } from "@/utils/formatter";

import { CopyIcon } from "./icons/CopyIcon";
import { ExitIcon } from "./icons/ExitIcon";
import { MarketAccountCard } from "./MarketAccountCard";

interface MarketData {
  market_id: number;
  registration_time: string;
  base_account_address: string;
  base_module_name: string;
  base_struct_name: string;
  base_name_generic: string | null;
  quote_account_address: string;
  quote_module_name: string;
  quote_struct_name: string;
  lot_size: number;
  tick_size: number;
  min_size: number;
  underwriter_id: number;
  is_recognized: boolean;
  last_fill_price_24hr: number | null;
  price_change_as_percent_24hr: number;
  price_change_24hr: number | null;
  min_price_24h: number | null;
  max_price_24h: number | null;
  base_volume_24h: number | null;
  quote_volume_24h: number | null;
  base_name: string;
  base_decimals: number;
  base_symbol: string;
  quote_name: string;
  quote_decimals: number;
  quote_symbol: string;
}

export interface MarketAccountData {
  user: string;
  market_id: number;
  custodian_id: number;
  base_total: number;
  base_available: number;
  base_ceiling: number;
  quote_total: number;
  quote_available: number;
  quote_ceiling: number;
  last_update_time: string;
  last_update_txn_version: number;
  markets: MarketData;
}

export const AccountDetailsModal: React.FC<{
  selectedMarket?: ApiMarket;
  onClose: () => void;
  onDepositWithdrawClick: (selected: ApiMarket) => void;
  onRegisterAccountClick: () => void;
}> = ({ onClose, onDepositWithdrawClick, onRegisterAccountClick }) => {
  const { account, disconnect } = useWallet();

  const [showCopiedNotif, setShowCopiedNotif] = useState<boolean>(false);

  const { data: marketAccounts } = useQuery<MarketAccountData[]>(
    ["userMarketAccounts", account?.address],
    async () => {
      if (!account?.address) return null;
      try {
        const response = await fetch(
          `${API_URL}/user_balances?select=*,markets(*)&address=eq.${account.address}`,
        );
        const data = await response.json();
        return data;
      } catch (e) {
        if (e instanceof Error) {
          console.warn(e.message);
        } else {
          console.error(e);
        }
        return null;
      }
    },
  );

  const copyToClipboard = useCallback(() => {
    setShowCopiedNotif(true);
    setTimeout(() => {
      setShowCopiedNotif(false);
    }, 1000);

    navigator.clipboard.writeText(account?.address || "");
  }, [account?.address]);

  const disconnectWallet = () => {
    onClose();
    disconnect();
  };

  return (
    <div className="relative flex flex-col items-center gap-6 font-roboto-mono">
      <div className="scrollbar-none mt-[-24px] h-[543px] overflow-auto">
        <p className="mb-8 mt-[28px] font-jost text-xl font-bold text-white">
          Account Details
        </p>
        <div className="mb-7 flex justify-between gap-9 border-[1px] border-neutral-600 px-9 py-7">
          <div
            onClick={copyToClipboard}
            className="flex h-[30px] w-[137px] cursor-pointer items-center justify-center gap-2 border-[1px] border-neutral-600 bg-white py-1 text-xs font-medium uppercase tracking-[0.24px]"
          >
            {showCopiedNotif ? (
              "COPIED!"
            ) : (
              <>
                {(
                  <>
                    {shorten(account?.address)}{" "}
                    <CopyIcon className={"h-4 cursor-pointer text-black"} />{" "}
                  </>
                ) || "‎"}
              </>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={disconnectWallet}
            className="flex h-[30px] w-[130px] items-center justify-center font-roboto-mono text-xs uppercase"
          >
            Disconnect
            <ExitIcon className="ml-2 inline-block h-4 w-4 text-center" />
          </Button>
        </div>
        <p className="mb-[26.8px] font-jost font-bold text-white">
          Open Market Accounts
        </p>
        {marketAccounts?.map((marketAccount, index: number) => {
          return (
            <div key={`${marketAccount.market_id}deposit card`}>
              <MarketAccountCard
                onDepositWithdrawClick={onDepositWithdrawClick}
                marketAccountData={marketAccount}
              />
              {index === marketAccounts.length - 1 && (
                <div className="h-[50px]"></div>
              )}
            </div>
          );
        })}
      </div>
      <div className="add-new-account-bg pointer-events-none absolute bottom-[19px] left-[50%] mb-[-19px] flex h-[120px] !w-[455px] translate-x-[-50%] items-end justify-center">
        <Button
          variant="primary"
          onClick={() => {
            onRegisterAccountClick();
          }}
          className="pointer-events-auto mb-[17.4px] h-fit !px-[17.5px] text-xs uppercase"
        >
          Add New Account
        </Button>
      </div>
    </div>
  );
};
