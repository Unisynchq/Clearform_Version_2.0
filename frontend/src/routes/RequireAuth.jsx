import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RequireAuth = ({ children }) => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    const returnTo =
      location.pathname + (location.search || '');
    return <Navigate to="/signin" replace state={{ from: returnTo }} />;
  }

  return children;
};

export default RequireAuth;
