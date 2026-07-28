import { motion } from "framer-motion";
import AppleSpinner from "./AppleSpinner";

export default function PrimaryButton({
  children,
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  const inactive = disabled || loading;

  return (
    <motion.button
      {...props}
      type={type}
      disabled={inactive}
      whileHover={inactive ? undefined : { scale: 1.01 }}
      whileTap={inactive ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={[
        "flex h-14 w-full items-center justify-center rounded-button",
        "bg-apple-blue px-6 text-base font-semibold text-white",
        "transition-[background-color,opacity,box-shadow] duration-200",
        "hover:bg-[#286DE6] hover:shadow-[0_10px_30px_rgba(52,120,246,0.22)]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-apple-blue/20",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
    >
      {loading ? <AppleSpinner size={24} className="text-white" /> : children}
    </motion.button>
  );
}