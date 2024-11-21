// hooks/useProtectedRoute.ts
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/context/authContext';

interface ProtectedRouteConfig {
  redirectTo?: string;
  requiredRoles?: string[];
}

export const useProtectedRoute = ({
  redirectTo = '/auth',
  requiredRoles = []
}: ProtectedRouteConfig = {}) => {
  const { user, loggedIn, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip check if still loading
    if (loading) return;

    // If not logged in, redirect to auth page
    if (!loggedIn) {
      // Store the attempted URL to redirect back after login
      sessionStorage.setItem('redirectAfterAuth', pathname || '/dashboard');
      router.push(redirectTo);
      return;
    }

    // Check for required roles if specified
    if (requiredRoles.length > 0 && user) {
      const hasRequiredRole = requiredRoles.some(role => 
        user.roles?.includes(role)
      );

      if (!hasRequiredRole) {
        router.push('/dashboard'); // Redirect to main dashboard if lacking required role
      }
    }
  }, [loading, loggedIn, user, router, pathname, redirectTo, requiredRoles]);

  return { isAuthorized: loggedIn && !loading };
};

