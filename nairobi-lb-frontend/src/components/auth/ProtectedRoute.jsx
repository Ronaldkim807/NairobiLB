import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute
 * - Allows access only to authenticated users. Renders nested routes via <Outlet />
 */
export function ProtectedRoute({ redirectTo = '/login' }) {
  const { isAuthenticated, loading } = useAuth();

  // Optionally block rendering until we know auth status
  if (loading) {
    // You can replace this with a spinner component if you have one
    return null;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} replace />;
}

ProtectedRoute.propTypes = {
  redirectTo: PropTypes.string,
};

/**
 * ProtectedRoleRoute
 * - Allows access only to authenticated users with roles in allowedRoles.
 * - `allowedRoles` should be an array of allowed role strings.
 * - Redirects to /login if not authenticated, or to redirectPath if user has insufficient role.
 */
export function ProtectedRoleRoute({ allowedRoles = [], redirectPath = '/unauthorized', loginPath = '/login' }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    // Wait until auth state resolved
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />;
  }

  // If allowedRoles is empty, allow any authenticated user
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return <Outlet />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}

ProtectedRoleRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  redirectPath: PropTypes.string,
  loginPath: PropTypes.string,
};
