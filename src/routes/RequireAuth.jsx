import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RequireAuth = ({ children }) => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default RequireAuth;
