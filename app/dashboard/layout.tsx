'use client';

import { ReactNode } from 'react';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { useAuth } from '@/app/context/authContext';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  Users,
  LogOut,
  Moon,
  Sun,
  LucideIcon
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: LucideIcon;
  requiredRoles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard',
    icon: LayoutDashboard
  },
  { 
    name: 'Profile', 
    href: '/dashboard/profile',
    icon: User
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings',
    icon: Settings
  },
  { 
    name: 'User Management', 
    href: '/dashboard/admin', 
    icon: Users,
    requiredRoles: ['admin']
  },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Top Navigation Bar */}
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-xl font-semibold text-gray-900 dark:text-white">
                  Dashboard
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome, {user?.username || user?.email}
                </span>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area with Sidebar */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 min-h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-sm">
            <nav className="mt-5 px-2 space-y-1">
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
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg
                      transition-colors duration-150 ease-in-out
                      ${pathname === item.href
                        ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <item.icon 
                      className={`
                        mr-3 h-5 w-5
                        ${pathname === item.href
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : 'text-gray-500 dark:text-gray-400'
                        }
                      `} 
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-8 py-6">
            {children}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}