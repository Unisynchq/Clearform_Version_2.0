import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RequireAuth = ({ children }) => {
  const { isAuthenticated, isInitialized } = useSelector((s) => s.auth);
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#e4e4e7] border-t-[#18181b] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo =
      location.pathname + (location.search || '') + (location.hash || '');
    return <Navigate to="/signin" replace state={{ from: returnTo }} />;
  }

  return children;
};

export default RequireAuth;
