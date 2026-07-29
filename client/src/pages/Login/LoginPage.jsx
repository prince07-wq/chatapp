import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout";
import AppleSpinner from "../../components/UI/AppleSpinner";
import FloatingInput from "../../components/UI/FloatingInput";
import { useAuth } from "../../context/AuthContext.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getApiError(error) {
  return (
    error.response?.data?.error ||
    error.message ||
    "Unable to sign in. Please try again."
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const passwordRef = useRef(null);

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step !== "password") return;

    const timeout = window.setTimeout(() => {
      passwordRef.current?.focus();
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [step]);

  async function handleSubmit(event) {
    event.preventDefault();

    setEmailError("");
    setPasswordError("");
    setRequestError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (step === "email") {
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        setEmailError("Enter a valid email address.");
        return;
      }

      setEmail(normalizedEmail);
      setStep("password");
      return;
    }

    let invalid = false;

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      invalid = true;
    }

    if (!password) {
      setPasswordError("Enter your password.");
      invalid = true;
    }

    if (invalid) return;

    try {
      setLoading(true);

      await login({
        email: normalizedEmail,
        password,
      });

      navigate("/chat", { replace: true });
    } catch (error) {
      setRequestError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-10 text-center sm:mb-12">
        <h1 className="text-[40px] font-semibold tracking-[-0.045em] sm:text-[48px]">
          Sign in
        </h1>

        <p className="mt-3 text-base font-medium text-grey">
          Continue to your conversations.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
  <div
    className={[
      "overflow-hidden rounded-input border",
      "bg-[#F5F5F7] transition-[border-color,box-shadow] duration-200",
      "dark:bg-[#1C1C1E]",
      emailError || passwordError || requestError
        ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.10)]"
        : "border-grey-light focus-within:border-apple-blue focus-within:shadow-[0_0_0_3px_rgba(52,120,246,0.12)] dark:border-white/15",
    ].join(" ")}
  >
    <FloatingInput
      grouped
      label="Email"
      type="email"
      value={email}
      autoFocus
      autoComplete="email"
      disabled={loading}
      error={emailError}
      invalid={Boolean(requestError)}
      onChange={(event) => {
        setEmail(event.target.value);
        setEmailError("");
        setRequestError("");
      }}
    />

    <AnimatePresence initial={false}>
      {step === "password" && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="overflow-hidden border-t border-grey-light dark:border-white/15"
        >
          <FloatingInput
            grouped
            ref={passwordRef}
            label="Password"
            type="password"
            value={password}
            autoComplete="current-password"
            disabled={loading}
            showPasswordToggle
            error={passwordError}
            invalid={Boolean(requestError)}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
              setRequestError("");
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>

  <button type="submit" disabled={loading} className="sr-only">
    {step === "email" ? "Continue" : "Sign in"}
  </button>

  <div className="mt-4 min-h-7 text-center">
    {loading ? (
      <div className="flex justify-center pt-2">
        <AppleSpinner
          size={28}
          className="text-grey dark:text-grey-light"
        />
      </div>
    ) : requestError ? (
      <p className="text-sm font-medium text-red-500">
        {requestError}
      </p>
    ) : (
      <p className="pt-1 text-sm font-medium text-grey">
        {step === "email"
          ? "Press Enter to continue"
          : "Press Enter to sign in"}
      </p>
    )}
  </div>
</form>

      <p className="mt-10 text-center text-sm font-medium text-grey">
        New here?{" "}
        <Link
          to="/register"
          className="text-apple-blue transition-opacity duration-200 hover:opacity-70"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
