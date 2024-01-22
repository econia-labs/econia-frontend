import BigNumber from "bignumber.js";
import { Chart } from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";

import { useOrderBook } from "@/hooks/useOrderbook";
import { type ApiMarket } from "@/types/api";
import { toDecimalPrice, toDecimalSize } from "@/utils/econia";
import { formatNumber } from "@/utils/formatter";

export const ZERO_BIGNUMBER = new BigNumber(0);
export const OFFSET = 0.25;
export const DepthChart: React.FC<{
  marketData: ApiMarket;
}> = ({ marketData }) => {
  const baseCoinInfo = marketData?.base;
  const quoteCoinInfo = marketData?.quote;

  const { data, isFetching } = useOrderBook(marketData.market_id);

  const { labels, midMarket, bidData, askData } = useMemo(() => {
    const labels: number[] = [];
    const bidData: (number | undefined)[] = [];
    const askData: (number | undefined)[] = [];
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    if (!isFetching && data?.bids) {
      for (const order of data.bids.concat(data.asks)) {
        if (order.price < minPrice) {
          minPrice = order.price;
        }
        if (order.price > maxPrice) {
          maxPrice = order.price;
        }
      }

      data.bids
        .slice()
        .concat(data.asks.slice())
        .sort((a, b) => a.price - b.price)
        .forEach((o) => {
          labels.push(o.price);
          bidData.push(undefined);
          askData.push(undefined);
        });

      const bidPriceToSize = new Map<number, number>();
      const askPriceToSize = new Map<number, number>();
      for (const { price, size } of data.bids) {
        const priceKey = price;
        if (!bidPriceToSize.has(priceKey)) {
          bidPriceToSize.set(priceKey, 0);
        }
        bidPriceToSize.set(priceKey, bidPriceToSize.get(priceKey)! + size);
      }
      for (const { price, size } of data.asks) {
        const priceKey = price;
        if (!askPriceToSize.has(priceKey)) {
          askPriceToSize.set(priceKey, 0);
        }
        askPriceToSize.set(priceKey, askPriceToSize.get(priceKey)! + size);
      }

      let askAcc = ZERO_BIGNUMBER;
      for (let i = 0; i < labels.length; i++) {
        const price = labels[i];
        if (askPriceToSize.has(price))
          askAcc = askAcc.plus(askPriceToSize.get(price)!);
        if (askAcc.gt(0))
          askData[i] = toDecimalSize({
            size: askAcc,
            marketData,
          }).toNumber();
      }

      let bidAcc = ZERO_BIGNUMBER;
      for (let i = labels.length - 1; i >= 0; i--) {
        const price = labels[i];
        if (bidPriceToSize.has(price))
          bidAcc = bidAcc.plus(bidPriceToSize.get(price)!);
        if (bidAcc.gt(0))
          bidData[i] = toDecimalSize({
            size: bidAcc,
            marketData,
          }).toNumber();
      }

      labels.forEach((price, i) => {
        labels[i] = toDecimalPrice({
          price,
          marketData,
        }).toNumber();
      });
    }
    const midMarket = (() => {
      if (labels.length === 0) {
        return 0;
      }
      if (labels.length === 1) {
        return labels[0];
      }
      if (labels.length % 2 === 0) {
        return (labels[labels.length / 2] + labels[labels.length / 2 - 1]) / 2;
      }

      return labels[(labels.length - 1) / 2];
    })();

    return {
      labels: labels.filter(
        (l) => l >= (1 - OFFSET) * midMarket && l <= (1 + OFFSET) * midMarket,
      ),
      bidData: bidData.filter((b, i) => {
        const l = labels[i];
        return l >= (1 - OFFSET) * midMarket && l <= (1 + OFFSET) * midMarket;
      }),
      askData: askData.filter((a, i) => {
        const l = labels[i];
        return l >= (1 - OFFSET) * midMarket && l <= (1 + OFFSET) * midMarket;
      }),
      minPrice: toDecimalPrice({
        price: minPrice,
        marketData,
      }),
      maxPrice: toDecimalPrice({
        price: maxPrice,
        marketData,
      }),
      midMarket,
    };
  }, [marketData, data, isFetching]);

  return (
    <>
      <p className={"absolute ml-4 mt-2 font-jost font-bold text-white"}>
        Depth
      </p>
      <div
        className={
          "relative h-full min-w-0 py-2 pr-2 [&>canvas]:!h-full [&>canvas]:!w-full"
        }
      >
        <Line
          options={{
            maintainAspectRatio: false,
            layout: {
              padding: 0,
            },
            elements: {
              line: { stepped: true, borderWidth: 1 },
              point: {
                hoverRadius: 3,
                radius: 0,
                hoverBorderColor: "white",
                hoverBackgroundColor: "none",
                borderWidth: 5,
              },
            },
            interaction: {
              intersect: false,
            },
            plugins: {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              crosshair: {
                color: "white",
              },
              title: {
                display: true,
                text: `MID MARKET ${formatNumber(midMarket, 2) ?? "-"} ${
                  marketData.quote.symbol
                }`,
                color: "white",
              },
              animation: {
                duration: 0,
              },
              responsiveAnimationDuration: 0,
              showLine: false,
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (item: { label: string; raw: unknown }) => {
                    return [
                      `Price: ${item.label} ${quoteCoinInfo?.symbol}`,
                      `Total Size: ${item.raw} ${baseCoinInfo?.symbol}`,
                    ];
                  },
                  title: () => "",
                },
                displayColors: false,
                bodyAlign: "right",
              },
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 0,
                  color: "white",
                  autoSkip: true,
                  padding: 0,
                  minRotation: 0,
                  //eslint-disable-next-line
                  callback: function (value, index, values) {
                    if (index % 3 === 2) {
                      return formatNumber(labels[index], 2) ?? "-";
                    } else {
                      return "";
                    }
                  },
                },
              },
              y: {
                position: "right",
                max: Math.max(
                  bidData[0] || 0,
                  askData[askData.length - 1] || 0,
                ),
                ticks: {
                  padding: 5,
                  color: "white",
                  maxTicksLimit: 2,
                  callback: function (value) {
                    const formatter = Intl.NumberFormat("en", {
                      notation: "compact",
                      compactDisplay: "short",
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    });
                    const formatted = formatter.format(Number(value));

                    return value === 0
                      ? "0"
                      : formatted === "0.0"
                      ? "<0.1"
                      : formatted;
                  },
                },
                beginAtZero: true,
              },
            },
          }}
          data={{
            labels,
            datasets: [
              {
                fill: true,
                label: "Size",
                data: bidData,
                borderColor: "rgba(110, 213, 163, 1)",
                backgroundColor: "rgba(110, 213, 163, 0.3)",
                stepped: true,
              },
              {
                fill: true,
                label: "Size",
                data: askData,
                borderColor: "rgba(213, 110, 110, 1)",
                backgroundColor: "rgba(213, 110, 110, 0.3)",
                stepped: true,
              },
            ],
          }}
        />
      </div>
    </>
  );
};

const plugin = {
  id: "crosshair",
  defaults: {
    width: 1,
    color: "#FF4949",
    dash: [2, 2],
  },
  afterInit: (
    chart: { corsair: { x: number; y: number } },
    //eslint-disable-next-line
    args: any,
    //eslint-disable-next-line
    opts: any,
  ) => {
    chart.corsair = {
      x: 0,
      y: 0,
    };
  },
  afterEvent: (
    //eslint-disable-next-line
    chart: { corsair: { x: any; y: any; draw: any }; draw: () => void },
    //eslint-disable-next-line
    args: { event?: any; inChartArea?: any },
  ) => {
    const { inChartArea } = args;
    const { x, y } = args.event;

    chart.corsair = { x, y, draw: inChartArea };
    chart.draw();
  },
  beforeDatasetsDraw: (
    chart: {
      //eslint-disable-next-line
      _active: any;
      //eslint-disable-next-line
      chartArea?: any;
      //eslint-disable-next-line
      corsair?: any;
      //eslint-disable-next-line
      ctx?: any;
    },
    //eslint-disable-next-line
    args: any,
    //eslint-disable-next-line
    opts: { width: any; color: any; dash: any },
  ) => {
    const { ctx } = chart;
    const { top, bottom, left, right } = chart.chartArea;
    if (!chart.corsair) return;
    let { x, y } = chart.corsair;
    const { draw } = chart.corsair;

    if (chart._active.length) {
      x = chart._active[0].element.x;
      y = chart._active[0].element.y;
    }
    if (!draw) return;

    ctx.save();

    ctx.beginPath();
    ctx.lineWidth = opts.width;
    ctx.strokeStyle = opts.color;
    ctx.setLineDash(opts.dash);
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, top);
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    ctx.restore();
  },
};
Chart.register(plugin);
