import { type GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

import { Header } from "@/components/Header";
import { type ApiMarket } from "@/types/api";
import { getAllMarket } from "@/utils/helpers";

type Props = {
  allMarketData: ApiMarket[];
};

export default function Trade({ allMarketData }: Props) {
  const router = useRouter();
  if (typeof window !== "undefined" && allMarketData.length > 0) {
    const firstRecognizedMarket = allMarketData.find((item) => item.recognized);
    if (firstRecognizedMarket) {
      router.push(`/market/${firstRecognizedMarket.market_id}`);
    } else {
      router.push(`/market/${allMarketData[0].market_id}?recognized=false`);
    }
  }

  // TODO: Better empty message
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
  // const res = await fetch(new URL("markets", API_URL).href);
  // const marketData: ApiMarket[] = await res.json();
  // TODO: Working API
  const allMarketData = await getAllMarket();
  return {
    props: {
      allMarketData,
    },
  };
};
