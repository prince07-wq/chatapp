import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ChatPlaceholder() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink dark:bg-ink dark:text-paper">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">
          Authentication complete
        </h1>

        <p className="mt-3 text-grey">
          Signed in as {user?.username || user?.email}
        </p>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="mt-6 rounded-button bg-apple-blue px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </main>
  );
}