export const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className,
  id,
  onClick,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      id={id}
      onClick={onClick}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.86038 1.97046H1.64478V9.18606H4.02416V5.59349V4.59349H5.02416H8.86038V1.97046ZM9.86038 4.59349V1.97046V0.970459H8.86038H1.64478H0.644775V1.97046V9.18606V10.1861H1.64478H4.02416V12.8091V13.8091H5.02416H12.2398H13.2398V12.8091V5.59349V4.59349H12.2398H9.86038ZM5.02416 5.59349H12.2398V12.8091H5.02416V5.59349Z"
        fill="#020202"
      />
    </svg>
  );
};
