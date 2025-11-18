import { Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

export function ProtectedRoute({ children, requiredRole }) {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // Check role-based access using Clerk user metadata
  if (requiredRole) {
    const userRole = user?.publicMetadata?.role || 'viewer';
    if (userRole !== requiredRole && userRole !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
