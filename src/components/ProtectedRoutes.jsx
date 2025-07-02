import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasAccess } from "../../utils/hasAccess";

// checks current role has access to specific page or not
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated,access } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!hasAccess(access,user?.UserTypeId, allowedRoles)) return <Navigate to="/unauthorized" />;

  return children;
};

export default ProtectedRoute;


