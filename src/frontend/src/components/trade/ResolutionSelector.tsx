import React, { type Dispatch, type SetStateAction, useState } from "react";

import { DAY_BY_RESOLUTION } from "@/hooks/useChartData";

export type SetResolutionType = Dispatch<
  SetStateAction<keyof typeof DAY_BY_RESOLUTION>
>;

export interface ResolutionSelectorProps {
  resolution: keyof typeof DAY_BY_RESOLUTION;
  setResolution: SetResolutionType;
}

const ResolutionSelector = (props: ResolutionSelectorProps) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        top: "0",
        left: "0",
        background: "white",
        zIndex: 3,
      }}
      className="timeframe-selector"
      onMouseLeave={() => setShowDropdown(false)}
    >
      <div
        className="selected-timeframe"
        onMouseOver={() => {
          setShowDropdown(true);
        }}
      >
        {props.resolution}
      </div>
      {showDropdown && (
        <ul className="dropdown-menu">
          {Object.keys(DAY_BY_RESOLUTION).map((key: string) => (
            <li
              key={key}
              className="dropdown-item"
              onClick={() => {
                props.setResolution(key);
                setShowDropdown(false);
              }}
            >
              {key}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResolutionSelector;
