import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { hasPermission } from "../../utils/permissionUtils";
import toast from "react-hot-toast";

const PermissionRoute = ({ module, action, children }) => {
  const access = useSelector((state) => state.auth.access);

  if (!hasPermission(access, module, action)) {
    return toast.error("You do not have permission");
  }

  return children;
};

export default PermissionRoute;

{
  /* <Navigate to="/unauthorized" replace />; */
}
