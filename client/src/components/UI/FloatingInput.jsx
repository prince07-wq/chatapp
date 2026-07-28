import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const FloatingInput = forwardRef(function FloatingInput(
  {
    id,
    label,
    type = "text",
    value,
    error = "",
    invalid = false,
    disabled = false,
    showPasswordToggle = false,
    className = "",
    onFocus,
    onBlur,
    grouped = false,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;

  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const hasValue = String(value ?? "").length > 0;
  const labelFloats = focused || hasValue;
  const hasError = Boolean(error) || invalid;

  const resolvedType =
    showPasswordToggle && type === "password"
      ? passwordVisible
        ? "text"
        : "password"
      : type;

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={resolvedType}
          value={value}
          disabled={disabled}
          placeholder=" "
          aria-invalid={hasError}
          aria-describedby={error ? errorId : undefined}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={[
            "peer h-16 w-full rounded-input border px-4 pb-2 pt-6",
            "bg-[#F5F5F7] text-[17px] font-medium text-ink",
            "outline-none transition-[border-color,background-color,box-shadow]",
            "duration-200 ease-out",
            "dark:bg-[#1C1C1E] dark:text-paper",
            "disabled:cursor-not-allowed disabled:opacity-60",
            showPasswordToggle ? "pr-12" : "",
           grouped
  ? "rounded-none border-0 shadow-none"
  : hasError
    ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.10)]"
    : focused
      ? "border-apple-blue shadow-[0_0_0_3px_rgba(52,120,246,0.12)]"
      : "border-grey-light dark:border-white/15",
          ].join(" ")}
        />

        <label
          htmlFor={inputId}
          className={[
            "pointer-events-none absolute left-4 origin-left text-grey",
            "transition-all duration-200 ease-out",
            labelFloats
              ? "top-2.5 translate-y-0 text-[11px] font-semibold"
              : "top-1/2 -translate-y-1/2 text-[16px] font-medium",
            hasError ? "text-red-500" : "",
          ].join(" ")}
        >
          {label}
        </label>

        {showPasswordToggle && hasValue && (
          <button
            type="button"
            onClick={() => setPasswordVisible((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-grey transition-colors duration-200 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue dark:hover:text-paper"
            aria-label={passwordVisible ? "Hide password" : "Show password"}
          >
            {passwordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        )}
      </div>

      {error && (
        <p
          id={errorId}
          className="mt-2 px-1 text-sm font-medium text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
});

export default FloatingInput;