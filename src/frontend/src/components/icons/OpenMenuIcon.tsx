import React, { type HTMLAttributes } from "react";

const OpenMenuIcon = (props: HTMLAttributes<HTMLOrSVGElement>) => {
  return (
    <svg
      width="38"
      height="5"
      viewBox="0 0 38 5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line
        x1="0.957336"
        y1="2.10547"
        x2="37.9344"
        y2="2.10547"
        stroke="white"
        strokeWidth="4"
      />
    </svg>
  );
};

export default OpenMenuIcon;
