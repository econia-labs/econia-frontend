export const TokenSymbol: React.FC<{
  symbol: string;
  smallSymbol?: boolean;
  normalSymbol?: boolean;
}> = ({ symbol, smallSymbol = false, normalSymbol = false }) => {
  const symbolSize = smallSymbol
    ? "text-[10px]"
    : normalSymbol
    ? "text-normal"
    : "text-xs";
  return (
    <span className={"text-neutral-600 " + symbolSize}>{symbol || "-"}</span>
  );
};
