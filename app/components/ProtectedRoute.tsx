import { ReactNode } from 'react';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRoles,
  redirectTo
}: ProtectedRouteProps) => {
  const { isAuthorized } = useProtectedRoute({ 
    redirectTo, 
    requiredRoles 
  });

  // Show loading state or nothing while checking auth
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return <>{children}</>;
};