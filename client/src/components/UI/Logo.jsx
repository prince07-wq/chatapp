import { useTheme } from "../../context/ThemeContext";
import lightLogo from "../../assets/logo-light.png";
import darkLogo from "../../assets/logo-dark.png";

export default function Logo({ className = "" }) {
  const { theme } = useTheme();

  return (
    <img
      src={theme === "dark" ? darkLogo : lightLogo}
      alt="Chat application"
      className={`h-9 w-9 object-contain ${className}`}
    />
  );
}