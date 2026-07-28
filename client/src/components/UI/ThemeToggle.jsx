import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.18 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 w-10 items-center justify-center rounded-full text-grey transition-colors duration-200 hover:bg-black/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue dark:hover:bg-white/10 dark:hover:text-paper"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </motion.button>
  );
}