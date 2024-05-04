import { entryFunctions } from "@econia-labs/sdk";
import { Menu, Tab } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useMemo, useState } from "react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { NO_CUSTODIAN } from "@/constants";
import { useAptos } from "@/contexts/AptosContext";
import { ECONIA_ADDR } from "@/env";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { useMarketAccountBalance } from "@/hooks/useMarketAccountBalance";
import { type ApiCoin, type ApiMarket } from "@/types/api";
import { toRawCoinAmount } from "@/utils/coin";
import { TypeTag } from "@/utils/TypeTag";

const SelectCoinInput: React.FC<{
  coins: ApiCoin[];
  startAdornment?: string;
  selectedCoin?: ApiCoin;
  onSelectCoin: (coin: ApiCoin) => void;
}> = ({ coins, startAdornment, selectedCoin, onSelectCoin }) => {
  const { coinListClient } = useAptos();

  const DEFAULT_TOKEN_ICON = "/tokenImages/default.svg";

  const assetIcon = selectedCoin
    ? coinListClient.getCoinInfoByFullName(
        TypeTag.fromString(
          `${selectedCoin.account_address}::${selectedCoin.module_name}::${selectedCoin.struct_name}`,
        ).toString(),
      )?.logo_url || DEFAULT_TOKEN_ICON
    : DEFAULT_TOKEN_ICON;

  return (
    <div className="flex h-10 w-full items-center border border-neutral-600 p-4 pr-0">
      <Menu as="div" className="relative inline-block w-full text-left">
        <Menu.Button className="flex w-full items-center justify-between pr-4">
          <p className="font-roboto-mono text-sm font-medium uppercase text-white">
            {startAdornment}
          </p>
          <div className="flex cursor-pointer items-center gap-0">
            <Image
              width={16}
              height={16}
              src={assetIcon}
              alt="token"
              className="mr-[6.75px] h-4 w-4"
            />
            <p className="mr-2 whitespace-nowrap font-roboto-mono text-sm font-medium text-white">
              {selectedCoin?.symbol}
            </p>
            <ChevronDownIcon className="h-[18.06px] w-[17px] fill-white" />
          </div>
        </Menu.Button>
        <Menu.Items className="absolute right-[-1px] top-[calc(100%+16px)]  border border-neutral-600 bg-neutral-800  bg-noise ring-1 ring-black ring-opacity-5 focus:outline-none">
          {coins.map((coin) => (
            <Menu.Item
              as="div"
              key={coin.account_address + coin.module_name + coin.struct_name}
              onClick={() => onSelectCoin(coin)}
              className="w-[97px] cursor-pointer items-center px-8 py-2 text-left font-roboto-mono hover:bg-neutral-600/30"
            >
              <p className="whitespace-nowrap text-sm leading-[18px] text-white">
                {coin.symbol}
              </p>
            </Menu.Item>
          ))}
        </Menu.Items>
      </Menu>
    </div>
  );
};

const DepositWithdrawForm: React.FC<{
  selectedMarket: ApiMarket;
  mode: "deposit" | "withdraw";
  isRegistered: boolean;
}> = ({ selectedMarket, mode, isRegistered }) => {
  const { account, signAndSubmitTransaction } = useAptos();
  const queryClient = useQueryClient();
  const [selectedCoin, setSelectedCoin] = useState<ApiCoin>(
    selectedMarket.base ?? selectedMarket.quote,
  );
  const { data: marketAccountBalance } = useMarketAccountBalance(
    account?.address,
    selectedMarket.market_id,
    selectedCoin,
  );

  const [amount, setAmount] = useState<string>("");
  const { data: balance } = useCoinBalance(
    TypeTag.fromApiCoin(selectedCoin),
    account?.address,
  );

  const disabledReason = useMemo(() => {
    return balance == null || marketAccountBalance == null
      ? "Loading balance..."
      : (mode === "deposit" && parseFloat(amount) > balance) ||
        (mode === "withdraw" && parseFloat(amount) > marketAccountBalance)
      ? "Not enough coins"
      : null;
  }, [amount, balance, marketAccountBalance, mode]);

  const handleSubmit = async () => {
    if (!Number(amount)) {
      return "";
    }
    const payload =
      mode === "deposit"
        ? entryFunctions.depositFromCoinstore(
            ECONIA_ADDR,
            TypeTag.fromApiCoin(selectedCoin).toString(),
            BigInt(selectedMarket.market_id),
            BigInt(NO_CUSTODIAN),
            BigInt(toRawCoinAmount(amount, selectedCoin.decimals).toString()),
          )
        : entryFunctions.withdrawToCoinstore(
            ECONIA_ADDR,
            TypeTag.fromApiCoin(selectedCoin).toString(),
            BigInt(selectedMarket.market_id),
            BigInt(toRawCoinAmount(amount, selectedCoin.decimals).toString()),
          );
    await signAndSubmitTransaction({ data: payload });
  };

  const handleRegisterMarketAccount = async () => {
    if (selectedMarket?.base == null) {
      throw new Error("Generic markets not supported");
    }
    const payload = entryFunctions.registerMarketAccount(
      ECONIA_ADDR,
      TypeTag.fromApiCoin(selectedMarket.base).toString(),
      TypeTag.fromApiCoin(selectedMarket.quote).toString(),
      BigInt(selectedMarket.market_id),
      BigInt(NO_CUSTODIAN),
    );
    const res = await signAndSubmitTransaction({ data: payload });
    if (res) {
      // refetch user market accounts
      await queryClient.invalidateQueries({
        queryKey: [
          "userCheckRegisteredMarketAccount",
          account?.address,
          selectedMarket.market_id,
        ],
      });
    }
  };

  return (
    <>
      <div className="w-full">
        <SelectCoinInput
          coins={[
            ...(selectedMarket?.base ? [selectedMarket.base] : []),
            ...(selectedMarket?.quote ? [selectedMarket.quote] : []),
          ]}
          selectedCoin={selectedCoin}
          onSelectCoin={setSelectedCoin}
          startAdornment={mode === "deposit" ? "DEPOSIT COIN" : "WITHDRAW COIN"}
        />
        <div className="mt-3">
          <Input
            value={amount}
            onChange={setAmount}
            placeholder="0.00"
            startAdornment="AMOUNT"
            type="number"
            autoFocus={true}
          />
        </div>
        <div className="mt-[17.51px] flex w-full justify-between">
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px] text-neutral-500">
            Available in market account
          </p>
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px] text-neutral-500">
            {marketAccountBalance ?? "--"} {selectedCoin.symbol}
          </p>
        </div>
        <div className="mt-3 flex w-full justify-between">
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px] text-neutral-500">
            In Wallet
          </p>
          <p className="font-roboto-mono text-[13px] font-light uppercase tracking-[0.26px] text-neutral-500">
            {balance ?? "--"} {selectedCoin.symbol}
          </p>
        </div>
        {isRegistered ? (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabledReason={disabledReason}
            className="mt-[15px] w-full pb-[13px] pt-[15px] text-sm uppercase !leading-3"
            disabled={Number(amount) === 0}
          >
            {Number(amount) === 0
              ? "Enter amount"
              : mode === "deposit"
              ? "Deposit"
              : "Withdraw"}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleRegisterMarketAccount}
            className="relative z-50 mt-8 w-full pb-[13px] pt-[15px] text-sm !font-bold uppercase leading-[11.5px] tracking-[0.28px]"
            loadingText="Creating account.."
          >
            create a market account
          </Button>
        )}
      </div>
    </>
  );
};

export const DepositWithdrawContent: React.FC<{
  selectedMarket: ApiMarket;
  isRegistered: boolean;
}> = ({ selectedMarket, isRegistered }) => {
  return (
    <div className="px-[34.79px] pb-[33px] pt-[37px]">
      <h2 className="font-jost text-xl font-bold text-white">
        {selectedMarket.name.replace("-", " / ")}
      </h2>
      <Tab.Group>
        <Tab.List className="mt-5 w-full">
          <Tab className="w-1/2 border-b border-b-neutral-600 py-2 font-jost font-bold text-neutral-600 outline-none ui-selected:border-b-white ui-selected:text-white">
            Deposit
          </Tab>
          <Tab className="w-1/2 border-b border-b-neutral-600 py-2 font-jost font-bold text-neutral-600 outline-none ui-selected:border-b-white ui-selected:text-white">
            Withdraw
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-7 w-full">
          <Tab.Panel>
            <DepositWithdrawForm
              selectedMarket={selectedMarket}
              mode="deposit"
              isRegistered={isRegistered}
            />
          </Tab.Panel>
          <Tab.Panel>
            <DepositWithdrawForm
              selectedMarket={selectedMarket}
              mode="withdraw"
              isRegistered={isRegistered}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
