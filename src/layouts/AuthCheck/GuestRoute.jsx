import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function GuestRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userAccess = useSelector((state) => state.auth.access);

  const getFirstAccessiblePath = () => {
    if (!userAccess || Object.keys(userAccess).length === 0) {
      return '/dashboard'; 
    }

    // Check if user has access to dashboard
    if (userAccess.Dashboard?.permissions?.view?.path) {
      return userAccess.Dashboard.permissions.view.path;
    }

    // If no dashboard access, get the first available view permission
    for (const module in userAccess) {
      const permissions = userAccess[module]?.permissions;

      // First check for 'view' permission
      if (permissions?.view?.path) {
        return permissions.view.path;
      }

      // If no view permission, get any first available permission
      for (const permission in permissions) {
        if (permissions[permission]?.path) {
          return permissions[permission].path;
        }
      }
    }

    // Ultimate fallback
    return '/dashboard';
  };

  return !isAuthenticated ? children : <Navigate to={getFirstAccessiblePath()} />;
}