import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";

function ChatPlaceholder() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-center text-ink dark:bg-ink dark:text-paper">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Authentication complete
        </h1>

        <p className="mt-3 text-grey">
          The chat interface comes in the next phase.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/chat" element={<ChatPlaceholder />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}