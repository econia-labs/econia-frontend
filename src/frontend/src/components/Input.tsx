import React from "react";

export const Input: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  startAdornment?: string;
  endAdornment?: string;
  disabled?: boolean;
  type: "text" | "number";
  autoFocus?: boolean;
}> = ({
  value,
  onChange,
  placeholder,
  startAdornment,
  endAdornment,
  disabled,
  type,
  autoFocus,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  return (
    <div className="flex h-10 w-full items-center gap-2 border border-neutral-600 p-4">
      <span className="flex h-full items-center whitespace-nowrap font-roboto-mono text-sm font-medium text-white">
        {startAdornment}
      </span>
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-right font-roboto-mono font-light text-neutral-400 outline-none"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          if (!onChange) return;
          if (type == "number") {
            if (e.target.value !== "." && isNaN(Number(e.target.value))) return;
          }
          onChange(e.target.value);
        }}
        disabled={disabled}
      />
      <span className="flex h-full items-center font-roboto-mono font-light text-neutral-400">
        {endAdornment}
      </span>
    </div>
  );
};
