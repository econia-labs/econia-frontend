import { type GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

import { Header } from "@/components/Header";
import { DEFAULT_MARKET_ID } from "@/env";
import { type ApiMarket } from "@/types/api";
import { getAllMarket } from "@/utils/helpers";

type Props = {
  allMarketData: ApiMarket[];
};

export default function Trade({ allMarketData }: Props) {
  const router = useRouter();
  if (typeof window !== "undefined" && allMarketData.length > 0) {
    const defaultMarket = allMarketData.find(
      (m) => m.market_id === DEFAULT_MARKET_ID,
    );
    if (defaultMarket) {
      router.push(`/market/${defaultMarket.market_id}`);
    } else {
      const firstRecognizedMarket = allMarketData.find(
        (item) => item.recognized,
      );
      if (firstRecognizedMarket) {
        router.push(`/market/${firstRecognizedMarket.market_id}`);
      } else {
        router.push(`/market/${allMarketData[0].market_id}?recognized=false`);
      }
    }
  }

  return (
    <>
      <Head>
        <title>Trade | Econia</title>
      </Head>
      <div className="flex min-h-screen flex-col">
        <Header logoHref={`${allMarketData[0].market_id}`} />
        Market not found.
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const allMarketData = await getAllMarket();
  return {
    props: {
      allMarketData,
    },
  };
};
