'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Briefcase, MapPin, TrendingUp, CheckCircle, AlertTriangle, UserCheck, Settings } from 'lucide-react';
import { getStoredUser, hasRole } from '@/lib/auth';
import { areaManagerAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface AreaManagerStats {
  totalWorkers: number;
  verifiedWorkers: number;
  pendingVerifications: number;
  regionalJobs: number;
  completedJobs: number;
  regionalRevenue: number;
  monthlyGrowth: number;
  activeDisputes: number;
}

const AreaManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState<AreaManagerStats | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ['area_manager'])) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, workersResponse, jobsResponse, applicationsResponse] = await Promise.all([
        areaManagerAPI.getDashboard(),
        areaManagerAPI.getWorkers(),
        areaManagerAPI.getJobs(),
        areaManagerAPI.getApplications(),
      ]);

      setStats(dashboardResponse.data);
      setWorkers(workersResponse.data.workers || []);
      setJobs(jobsResponse.data.jobs || []);
      setApplications(applicationsResponse.data.applications || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWorker = async (workerId: string) => {
    try {
      await areaManagerAPI.verifyWorker(workerId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to verify worker:', error);
    }
  };

  const handleEscalateJob = async (jobId: string) => {
    const reason = prompt('Please provide a reason for escalation:');
    if (!reason) return;

    try {
      await areaManagerAPI.escalateJob(jobId, reason);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Failed to escalate job:', error);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Area Manager Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your regional workers and jobs</p>
          </div>
          <Button onClick={() => router.push('/area-manager/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Regional Settings
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Workers</p>
                <p className="text-2xl font-bold text-blue-900">{stats?.totalWorkers || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-green-600">Regional Jobs</p>
                <p className="text-2xl font-bold text-green-900">{stats?.regionalJobs || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MapPin className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">Regional Revenue</p>
                <p className="text-2xl font-bold text-yellow-900">ETB {stats?.regionalRevenue?.toLocaleString() || 0}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Workers</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.verifiedWorkers || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingVerifications || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedJobs || 0}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Disputes</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeDisputes || 0}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regional Workers */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Regional Workers</h3>
              <Button variant="outline" size="sm" onClick={() => router.push('/area-manager/workers')}>
                View All
              </Button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {workers.slice(0, 10).map((worker) => (
                <div key={worker._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{worker.name}</p>
                    <p className="text-sm text-gray-500">{worker.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        worker.profile?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {worker.profile?.verified ? 'Verified' : 'Pending'}
                      </span>
                      {worker.profile?.rating && (
                        <span className="text-xs text-gray-500">
                          ⭐ {worker.profile.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {!worker.profile?.verified && (
                    <Button
                      size="sm"
                      onClick={() => handleVerifyWorker(worker._id)}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Regional Jobs */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Regional Jobs</h3>
              <Button variant="outline" size="sm" onClick={() => router.push('/area-manager/jobs')}>
                View All
              </Button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {jobs.slice(0, 10).map((job) => (
                <div key={job._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    {(job.status === 'disputed' || job.status === 'revision_requested') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEscalateJob(job._id)}
                      >
                        Escalate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.slice(0, 10).map((application) => (
                  <tr key={application._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {application.worker?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.worker?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate max-w-xs">
                        {application.job?.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ETB {application.proposedBudget?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
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
};

export default AreaManagerDashboard;