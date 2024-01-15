import "rc-slider/assets/index.css";

import Slider, { type SliderProps } from "rc-slider";
import { type MarkObj } from "rc-slider/lib/Marks";

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

  return (
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
  );
};

export default RangeSlider;
