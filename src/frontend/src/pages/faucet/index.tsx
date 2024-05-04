import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { entryFunctions } from "@econia-labs/sdk";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { type GetStaticProps } from "next";
import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { Button } from "@/components/Button";
import { ConnectedButton } from "@/components/ConnectedButton";
import { Header } from "@/components/Header";
import { useAptos } from "@/contexts/AptosContext";
import { FAUCET_ADDR, RPC_NODE_URL } from "@/env";
import { type CoinStore } from "@/hooks/useCoinBalance";
import { type CoinInfo } from "@/hooks/useCoinInfo";
import { type ApiMarket } from "@/types/api";
import { fromRawCoinAmount } from "@/utils/coin";
import { getAllMarket } from "@/utils/helpers";
import { TypeTag } from "@/utils/TypeTag";

const TYPE_TAGS = [
  new TypeTag(FAUCET_ADDR, "example_apt", "ExampleAPT"),
  new TypeTag(FAUCET_ADDR, "example_usdc", "ExampleUSDC"),
] as const;
const AMOUNTS = [100, 600];

export default function Faucet({
  allMarketData,
  coinInfoList,
}: {
  allMarketData: ApiMarket[];
  coinInfoList: CoinInfo[];
}) {
  const { account, aptosClient, signAndSubmitTransaction } = useAptos();
  const queryClient = useQueryClient();
  const [isLoadingArray, setIsLoadingArray] = useState<boolean[]>(
    TYPE_TAGS.map((_) => false),
  );

  const balanceQueries = useQueries({
    queries: coinInfoList.map((coinInfo, i) => ({
      queryKey: ["balance", account?.address, coinInfo.name],
      queryFn: async () => {
        if (account?.address == null) {
          throw new Error("Query should not be enabled.");
        }
        const resource = await aptosClient.getAccountResource<CoinStore>({
          accountAddress: account.address,
          resourceType: `0x1::coin::CoinStore<${TYPE_TAGS[i].toString()}>`,
        });
        const coinStore = resource;
        return fromRawCoinAmount(coinStore.coin.value, coinInfo.decimals);
      },
      enabled: account?.address != null && TYPE_TAGS[i] != null,
    })),
  });

  useEffect(() => {
    queryClient.invalidateQueries(["balance", account?.address]);
  }, [account?.address, queryClient]);

  const mintCoin = useCallback(
    async (typeTag: TypeTag, i: number) => {
      setIsLoadingArray((isLoadingArray) => [
        ...isLoadingArray.slice(0, i),
        true,
        ...isLoadingArray.slice(i + 1),
      ]);
      try {
        const payload = entryFunctions.faucetMint(
          FAUCET_ADDR,
          typeTag.toString(),
          BigInt(Math.floor(AMOUNTS[i] * 10 ** coinInfoList[i].decimals)),
        );
        await signAndSubmitTransaction({ data: payload });
        await queryClient.invalidateQueries([
          "balance",
          coinInfoList[i].name,
          account?.address,
        ]);
      } catch (e) {
        if (e instanceof Error) {
          toast.error(e.message);
        } else {
          console.error(e);
        }
      } finally {
        setIsLoadingArray((isLoadingArray) => [
          ...isLoadingArray.slice(0, i),
          false,
          ...isLoadingArray.slice(i + 1),
        ]);
      }
    },
    [account?.address, coinInfoList, queryClient, signAndSubmitTransaction],
  );

  return (
    <>
      <Head>
        <title>Faucet | Econia</title>
      </Head>
      <div className="flex h-screen flex-col">
        <Header logoHref={`/market/${allMarketData[0].market_id}`} />
        <main className="flex h-full w-full">
          <div className="flex w-full">
            {TYPE_TAGS.map((typeTag, i) => (
              <div
                className={`flex flex-1 flex-col items-center justify-center gap-10 ${
                  i === 0 ? "border-r border-r-neutral-600" : ""
                }`}
                key={i}
              >
                <h2 className="font-jost text-6xl font-bold text-white">
                  {coinInfoList[i].symbol}
                </h2>
                <p className="font-roboto-mono text-gray-400">
                  Balance: {balanceQueries[i].data ?? "-"}{" "}
                  {coinInfoList[i].symbol}
                </p>
                <ConnectedButton>
                  <Button
                    variant="primary"
                    className="px-6 py-[10px] !leading-5"
                    onClick={async () => await mintCoin(typeTag, i)}
                    disabled={isLoadingArray[i]}
                  >
                    {isLoadingArray[i]
                      ? "Loading..."
                      : `Get ${coinInfoList[i].symbol}`}
                  </Button>
                </ConnectedButton>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const config = new AptosConfig({
    fullnode: RPC_NODE_URL,
  });
  const aptosClient = new Aptos(config);

  const coinInfoList = await Promise.all(
    TYPE_TAGS.map(async (typeTag) => {
      const res = await aptosClient.getAccountResource<CoinInfo>({
        accountAddress: typeTag.addr,
        resourceType: `0x1::coin::CoinInfo<${typeTag.toString()}>`,
      });
      return res;
    }),
  );

  const allMarketData = await getAllMarket();

  return {
    props: {
      allMarketData,
      coinInfoList,
    },
    revalidate: 600,
  };
};
