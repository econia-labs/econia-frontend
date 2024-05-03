import "rc-slider/assets/index.css";

import Slider, { type SliderProps } from "rc-slider";
import { type MarkObj } from "rc-slider/lib/Marks";
import { useEffect, useState } from "react";

import { handleRender } from "./TooltipSlider";

type VariantType = "primary" | "secondary";
interface RangeSliderProps extends SliderProps {
  variant: VariantType;
}

const styles = {
  primary: {
    styles: {
      rail: {
        backgroundColor: "#56565680",
      },
      track: {
        backgroundColor: "#ffffff80",
      },
      handle: {
        backgroundColor: "white",
        opacity: 1,
        border: "none",
        boxShadow: "none",
        width: "10px",
        height: "10px",
        top: "7px",
      },
    },
  },
  secondary: {
    styles: {
      rail: {
        backgroundColor: "#fff",
      },
      track: {
        backgroundColor: "#dd6666",
      },
    },
  },
};

const RangeSlider = ({
  variant,
  marks,
  value,
  className,
  ...props
}: RangeSliderProps) => {
  const marksDefault = [0, 25, 50, 75, 100].reduce((result, curr) => {
    if (!result[curr]) {
      result[curr] = {
        style: {
          display: "none",
        },
        label: curr,
      };
    }
    return result;
  }, {} as Record<string | number, MarkObj>);

  const [rendered, setRendered] = useState(false);

  // Not entirely sure why this is suddenly necessary- perhaps because of the
  // change in the wallet adapter context provider?
  // In the previous build, useLayoutEffect was not triggered by the
  // Slider component below, but now it is.
  // This is causing a hydration error on page load, thus we wrap the render
  // in a useEffect to ensure it is only rendered client-side.
  // TODO: Investigate why this is necessary.
  useEffect(() => {
    setRendered(true);
  }, []);

  return (
    rendered && (
      <Slider
        defaultValue={0}
        min={0}
        marks={marks ?? marksDefault}
        value={value}
        className={`${className}`}
        draggableTrack={false}
        dotStyle={{
          backgroundColor: "white",
          borderColor: "white",
          bottom: "0",
          width: "4px",
          height: "4px",
        }}
        handleRender={handleRender}
        {...styles[variant]}
        {...props}
      />
    )
  );
};

export default RangeSlider;
