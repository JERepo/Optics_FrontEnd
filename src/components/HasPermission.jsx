import { useSelector } from "react-redux";
import { hasPermission } from "../utils/permissionUtils";

const HasPermission = ({ module, action, children, fallback = null }) => {
  const access = useSelector((state) => state.auth?.access);

  if (!hasPermission(access, module, action)) {
    return fallback;
  }

  return <>{children}</>;
};

export default HasPermission;
