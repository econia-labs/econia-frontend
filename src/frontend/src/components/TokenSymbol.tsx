export const TokenSymbol: React.FC<{
  symbol: string;
  className?: string;
}> = ({ symbol, className }) => {
  return (
    <span className={"text-neutral-600 " + className}>{symbol || "-"}</span>
  );
};
