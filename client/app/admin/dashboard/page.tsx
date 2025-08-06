'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Briefcase, DollarSign, TrendingUp, CheckCircle, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import { getStoredUser, hasRole } from '@/lib/auth';
import { adminAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalRevenue: number;
  activeJobs: number;
  completedJobs: number;
  pendingVerifications: number;
  disputedPayments: number;
  monthlyGrowth: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ['super_admin'])) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, usersResponse, jobsResponse] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers({ limit: 5, sort: '-createdAt' }),
        adminAPI.getAllJobs(),
      ]);

      setStats(dashboardResponse.data);
      setRecentUsers(usersResponse.data.users || []);
      setRecentJobs(jobsResponse.data.jobs?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWorker = async (workerId: string) => {
    try {
      await adminAPI.verifyWorker(workerId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to verify worker:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor and manage the entire Belimuno Jobs platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Total Jobs</p>
                <p className="text-2xl font-bold text-green-900">{stats?.totalJobs || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Total Revenue</p>
                <p className="text-2xl font-bold text-yellow-900">ETB {stats?.totalRevenue?.toLocaleString() || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Monthly Growth</p>
                <p className="text-2xl font-bold text-purple-900">+{stats?.monthlyGrowth || 0}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.activeJobs || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.completedJobs || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.pendingVerifications || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                  {user.role === 'worker' && !user.profile?.verified && (
                    <Button
                      size="sm"
                      onClick={() => handleVerifyWorker(user._id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/jobs')}>
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{job.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      job.status === 'open' ? 'bg-green-100 text-green-800' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      job.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">ETB {job.budget?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center"
              onClick={() => router.push('/admin/users')}
            >
              <Users className="h-6 w-6 mb-2" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center"
              onClick={() => router.push('/admin/jobs')}
            >
              <Briefcase className="h-6 w-6 mb-2" />
              Manage Jobs
            </Button>
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center"
              onClick={() => router.push('/admin/payments')}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              Payment Disputes
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;