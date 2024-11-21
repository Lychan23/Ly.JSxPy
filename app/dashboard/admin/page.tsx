"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/context/authContext';
import { 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Shield, 
  User,
  SortAsc,
  SortDesc,
  Clock,
  Mail
} from 'lucide-react';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  roles: string[];
  lastActiveAt?: {
    toDate: () => Date;
  };
  createdAt?: {
    toDate: () => Date;
  };
}

type SortField = 'username' | 'email' | 'lastActiveAt';
type SortDirection = 'asc' | 'desc';

const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const auth = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const idToken = await auth.getIdToken();
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const updateUserRole = useCallback(async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const idToken = await auth.getIdToken();

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          userId, 
          role: newRole,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      setSuccess(`Successfully ${newRole === 'admin' ? 'promoted' : 'demoted'} user`);
      await fetchUsers();
      
      const timeoutId = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timeoutId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user role');
      console.error('Error updating user role:', err);
      
      const timeoutId = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [auth, fetchUsers]);

  return {
    users,
    loading,
    error,
    success,
    fetchUsers,
    updateUserRole
  };
};

export default function DashboardAdminPanel() {
  const {
    users,
    loading,
    error,
    success,
    fetchUsers,
    updateUserRole
  } = useUserManagement();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  const auth = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = 
        roleFilter === 'all' ||
        (roleFilter === 'admin' && user.roles.includes('admin')) ||
        (roleFilter === 'user' && !user.roles.includes('admin'));
      
      return matchesSearch && matchesRole;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'username':
          comparison = a.username.localeCompare(b.username);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'lastActiveAt':
          const dateA = a.lastActiveAt?.toDate() || new Date(0);
          const dateB = b.lastActiveAt?.toDate() || new Date(0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [users, searchQuery, sortField, sortDirection, roleFilter]);

  const formatDate = (date?: { toDate: () => Date }) => {
    if (!date?.toDate) return 'Never';
    const formattedDate = date.toDate().toLocaleDateString();
    const formattedTime = date.toDate().toLocaleTimeString();
    return `${formattedDate} ${formattedTime}`;
  };

  const SortIcon = useCallback(({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  }, [sortField, sortDirection]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage user roles and permissions across the platform
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Controls and Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Search Bar */}
          <div className="md:col-span-2">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email or username..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={roleFilter}
                onValueChange={(value: 'all' | 'admin' | 'user') => setRoleFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admins Only</SelectItem>
                  <SelectItem value="user">Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {users.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Admins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {users.filter(user => user.roles.includes('admin')).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer group"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>User</span>
                      <SortIcon field="username" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th 
                    className="px-6 py-3 text-left cursor-pointer group"
                    onClick={() => handleSort('lastActiveAt')}
                  >
                    <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <span>Last Active</span>
                      <SortIcon field="lastActiveAt" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredAndSortedUsers.map(user => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2 cursor-pointer">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {user.username}
                                  </div>
                                  <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{user.email}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {user.roles.includes('admin') ? (
                          <span className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(user.lastActiveAt)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Last active time</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-6 py-4">
                      {user.id !== auth.user?.id && (
                        <button
                          onClick={() => updateUserRole(
                            user.id, 
                            user.roles.includes('admin') ? 'user' : 'admin'
                          )}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            user.roles.includes('admin')
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-200 dark:hover:bg-red-900'
                              : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-200 dark:hover:bg-green-900'
                          }`}
                        >
                          {user.roles.includes('admin') ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}