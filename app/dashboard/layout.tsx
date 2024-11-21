// app/dashboard/layout.tsx
'use client';

import { ReactNode } from 'react';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/authContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  name: string;
  href: string;
  icon?: string;
  requiredRoles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Profile', href: '/dashboard/profile' },
  { name: 'Settings', href: '/dashboard/settings' },
  { 
    name: 'User Management', 
    href: '/dashboard/admin', 
    requiredRoles: ['admin']
  },
  // Add more sidebar items as needed
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Top Navigation Bar */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-lg font-semibold">Dashboard</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Welcome, {user?.username || user?.email}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area with Sidebar */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 min-h-screen bg-white shadow-sm">
            <nav className="mt-5 px-2">
              {sidebarItems.map((item) => {
                // Check if user has required role for this item
                const hasRequiredRole = !item.requiredRoles || 
                  item.requiredRoles.some(role => user?.roles?.includes(role));

                if (!hasRequiredRole) return null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${pathname === item.href
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}