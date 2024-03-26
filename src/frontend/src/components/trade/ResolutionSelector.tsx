import { ChevronDownIcon } from "@heroicons/react/20/solid";
import React, {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { DAY_BY_RESOLUTION } from "@/hooks/useChartData";

export type SetResolutionType = Dispatch<
  SetStateAction<keyof typeof DAY_BY_RESOLUTION>
>;

export interface ResolutionSelectorProps {
  resolution: keyof typeof DAY_BY_RESOLUTION;
  setResolution: SetResolutionType;
}

const RES_TO_STRING_FULL = {
  "1": "1 minute",
  "5": "5 minutes",
  "15": "15 minutes",
  "30": "30 minutes",
  "60": "1 hour",
  "240": "4 hours",
  "720": "12 hours",
  "1D": "1 day",
};

const RES_TO_STRING_SHORT = {
  "1": "1m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "240": "4h",
  "720": "12h",
  "1D": "1D",
};

const ResolutionSelector = (props: ResolutionSelectorProps) => {
  const [hoveringSelector, setHoveringSelector] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredResolution, setHoveredResolution] = useState<string | number>(
    "",
  );
  const selectorRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      selectorRef.current &&
      !selectorRef.current.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: "1ch",
        left: "1ch",
        background: showDropdown ? "#000000ee" : "#00000000",
        color: hoveringSelector ? "lightgrey" : "white",
        zIndex: 3,
        cursor: "pointer",
      }}
      className="timeframe-selector font-roboto-mono text-base"
      ref={selectorRef}
    >
      <div
        className="selected-timeframe"
        onMouseOver={() => setHoveringSelector(true)}
        onMouseLeave={() => setHoveringSelector(false)}
        onClick={() => toggleDropdown()}
        onFocus={() => toggleDropdown()}
        onBlur={() => setShowDropdown(false)}
        style={{ display: "flex", alignItems: "center" }}
      >
        {
          RES_TO_STRING_SHORT[
            props.resolution as keyof typeof RES_TO_STRING_SHORT
          ]
        }
        <ChevronDownIcon className="my-auto ml-1 h-[18px] w-[18px]" />
      </div>
      {showDropdown && (
        <ul className="dropdown-menu">
          {Object.keys(DAY_BY_RESOLUTION).map((key: string) => (
            <li
              key={key}
              className="dropdown-item"
              style={{
                color: "white",
                background:
                  key == props.resolution
                    ? "#2962FF"
                    : key == hoveredResolution
                    ? "#2A2E39"
                    : "#00000000",
                minWidth: "11ch",
              }}
              onMouseEnter={() => setHoveredResolution(key)}
              onMouseLeave={() => setHoveredResolution("")}
              onClick={() => {
                props.setResolution(key);
                setShowDropdown(false);
              }}
            >
              {RES_TO_STRING_FULL[key as keyof typeof RES_TO_STRING_FULL]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResolutionSelector;
