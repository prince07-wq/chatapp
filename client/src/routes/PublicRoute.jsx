import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import RouteLoader from "./RouteLoader.jsx";

export default function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return children;
}
