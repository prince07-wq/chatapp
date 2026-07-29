import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout";
import FloatingInput from "../../components/UI/FloatingInput";
import PrimaryButton from "../../components/UI/PrimaryButton";
import { useAuth } from "../../context/AuthContext.jsx";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getApiError(error) {
  return (
    error.response?.data?.error ||
    error.message ||
    "Unable to create your account."
  );
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setRequestError("");
  }

  function validate() {
    const nextErrors = {};

    if (form.username.trim().length < 3) {
      nextErrors.username = "Username must contain at least 3 characters.";
    }

    if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.password.length < 6) {
      nextErrors.password = "Password must contain at least 6 characters.";
    }

    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setRequestError("");

    if (!validate()) return;

    try {
      setLoading(true);

      await registerUser({
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
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
      <div className="mb-8 text-center sm:mb-10">
        <h1 className="text-[38px] font-semibold tracking-[-0.045em] sm:text-[46px]">
          Create account
        </h1>

        <p className="mt-3 text-base font-medium text-grey">
          Start your conversations.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FloatingInput
          label="Username"
          value={form.username}
          autoFocus
          autoComplete="username"
          disabled={loading}
          error={errors.username}
          onChange={(event) => updateField("username", event.target.value)}
        />

        <FloatingInput
          label="Email"
          type="email"
          value={form.email}
          autoComplete="email"
          disabled={loading}
          error={errors.email}
          onChange={(event) => updateField("email", event.target.value)}
        />

        <FloatingInput
          label="Password"
          type="password"
          value={form.password}
          autoComplete="new-password"
          disabled={loading}
          showPasswordToggle
          error={errors.password}
          onChange={(event) => updateField("password", event.target.value)}
        />

        <FloatingInput
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          autoComplete="new-password"
          disabled={loading}
          showPasswordToggle
          error={errors.confirmPassword}
          onChange={(event) =>
            updateField("confirmPassword", event.target.value)
          }
        />

        {requestError && (
          <p className="text-center text-sm font-medium text-red-500">
            {requestError}
          </p>
        )}

        <PrimaryButton type="submit" loading={loading}>
          Create account
        </PrimaryButton>
      </form>

      <p className="mt-8 text-center text-sm font-medium text-grey">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-apple-blue transition-opacity duration-200 hover:opacity-70"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
