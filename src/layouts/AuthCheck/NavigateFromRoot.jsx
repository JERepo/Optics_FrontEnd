import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function NavigateFromRoot() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? (
    <Navigate to="/dashboard" />
  ) : (
    <Navigate to="/login" />
  );
}

