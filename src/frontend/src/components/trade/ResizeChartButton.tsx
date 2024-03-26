import React from "react";

export interface ResizeChartButtonProps {
  /* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
  handleClick: () => void;
  priceScaleWidth: number;
}

export const ResizeChartButton = (props: ResizeChartButtonProps) => {
  return (
    <button
      style={{
        position: "absolute",
        zIndex: 3,
        top: "1ch",
        right: `${props.priceScaleWidth + 4}px`,
        color: "white",
      }}
      onClick={props.handleClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 28 28"
        strokeWidth="1.5"
        stroke="currentColor"
        className="h-6 w-6"
        style={{ width: "31", height: "31" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 8V4h4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M20 8V4h-4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 16v4h4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M20 16v4h-4"
        />
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          strokeWidth="1.5"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default ResizeChartButton;
