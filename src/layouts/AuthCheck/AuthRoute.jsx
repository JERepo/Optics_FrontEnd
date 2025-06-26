import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AuthRoute({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
}
