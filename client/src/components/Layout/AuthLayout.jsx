import { motion } from "framer-motion";
import Logo from "../UI/Logo";
import ThemeToggle from "../UI/ThemeToggle";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex min-h-screen items-center justify-center px-5 py-24">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-[430px]"
        >
          {children}
        </motion.section>
      </main>
    </div>
  );
}