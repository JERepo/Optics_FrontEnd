// hooks/useHasPermission.js
import { useSelector } from "react-redux";
import { hasPermission } from "../utils/permissionUtils";

const useHasPermission = (module, action) => {
  const access = useSelector((state) => state.auth.user?.access);
  return hasPermission(access, module, action);
};

export default useHasPermission;
