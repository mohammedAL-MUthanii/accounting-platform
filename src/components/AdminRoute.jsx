import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../utils/auth";

function AdminRoute({ children }) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;