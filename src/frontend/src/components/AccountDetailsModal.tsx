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

// get_all_market_account_ids_for_user

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
          `${API_URL}/user_balances?select=*,markets(*)&user=eq.${account.address}`,
        );
        const data = await response.json();
        return data;
      } catch (e) {
        if (e instanceof Error) {
          // toast.error(e.message);
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
    // remove notif after 1 second
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
      <div className="scrollbar-none mt-[-24px] max-h-[524px] min-h-[524px] overflow-auto">
        <p className="mb-8 mt-[36px] font-jost text-xl font-bold text-white">
          Account Details
        </p>
        {/* card */}
        <div
          className={
            "mb-4 flex h-[105px] w-[378px] justify-between border-[1px] border-neutral-600 px-[21px] py-[18px]"
          }
        >
          {/* left side */}
          <div className="flex-1">
            {/* input copy row 1 */}
            <div className="mb-[15px] flex w-full items-center">
              <div className="flex-1 border-[1px] border-neutral-600 px-2 py-1 text-xs uppercase tracking-[0.24px] text-white">
                {/* invisible character,  */}
                {showCopiedNotif ? "COPIED!" : shorten(account?.address) || "‎"}
              </div>
              <CopyIcon
                className={"ml-4 h-4 w-4 cursor-pointer"}
                onClick={copyToClipboard}
              />
            </div>
            {/* row 2 */}
            <Button
              variant="secondary"
              onClick={disconnectWallet}
              className={
                "flex items-center !px-3 !py-1 !text-[10px] !leading-[18px]"
              }
            >
              Disconnect
              <ExitIcon className="ml-2 inline-block h-4 w-4 text-center" />
            </Button>
          </div>
          {/* right side */}
          <div className="ml-[39px] flex-1">
            <div className="ml-8 flex flex-col text-left">
              <span className="align-text-top font-roboto-mono text-[10px] font-light text-neutral-500">
                WALLET BALANCE
              </span>
              <p className="font-roboto-mono text-xs font-light text-white">
                <span className="inline-block align-text-top text-white">
                  {/* TODO wallet value */}
                  $35.03
                </span>
              </p>
            </div>
            <div className="ml-8 text-left">
              <span className="font-roboto-mono text-[10px] font-light text-neutral-500">
                TOTAL IN ECONIA
              </span>
              <p className="font-roboto-mono text-xs font-light text-white">
                <span className="inline-block text-white">
                  {/* TODO wallet value */}
                  $222,222.00
                </span>
              </p>
            </div>
          </div>
        </div>
        <p className="mb-3 font-jost text-sm font-bold text-white">
          Market Accounts
        </p>
        {/* market accounts */}
        {marketAccounts?.map((marketAccount) => (
          <MarketAccountCard
            key={marketAccount.market_id.toString() + "deposit card"}
            onDepositWithdrawClick={onDepositWithdrawClick}
            marketAccountData={marketAccount}
          />
        ))}
      </div>
      {/* spacer to compensate for sticky bottom row */}
      {/* note, has to be same height as the sticky row -- iirc no way to do this dynamically as absolutely positioned elements take up 0 space */}
      <div className="h-[36px]" />
      {/* sticky bottom row */}
      {/* todo, height 80px but negative margin due to modal padding */}
      <div className="absolute bottom-0 left-[50%] mb-[-24px] flex h-[84px] w-full min-w-[500px] translate-x-[-50%] items-center justify-center border-[1px] border-neutral-600 text-center">
        <Button
          variant="secondary"
          onClick={() => {
            onRegisterAccountClick();
          }}
          className={
            "flex h-[35px] w-[144px] items-center justify-center !px-3 !py-1 text-center !text-xs"
          }
        >
          Add New Account
        </Button>
      </div>

      {/* sticky fade out header */}
      <div className="absolute left-[50%] top-[-24px] mb-[-24px] flex h-[48px] w-full min-w-[500px] translate-x-[-50%] border-[1px] border-b-0 border-neutral-600 bg-gradient-to-t from-transparent to-black"></div>
    </div>
  );
};
