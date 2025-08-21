'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, DollarSign, TrendingUp, Users, Building, Target,
  Clock, CheckCircle, AlertCircle, BarChart3, PieChart,
  Calendar, FileText, MessageSquare, Download, Eye
} from 'lucide-react';
import { getStoredUser, hasRole } from '@/lib/auth';
import { adminAPI } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';

interface OutsourceStats {
  totalClients: number;
  activeProjects: number;
  totalRevenue: number;
  monthlyRevenue: number;
  completedJobs: number;
  ongoingJobs: number;
  clientSatisfaction: number;
  projectSuccessRate: number;
}

interface Client {
  _id: string;
  name: string;
  email: string;
  company?: string;
  isActive: boolean;
  createdAt: string;
  clientProfile?: {
    companySize: string;
    industry: string;
    totalSpent: number;
    projectsCompleted: number;
  };
}

interface Project {
  _id: string;
  title: string;
  status: string;
  budget: number;
  progress: number;
  deadline: string;
  client: {
    _id: string;
    name: string;
    company?: string;
  };
  worker?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  projects: number;
}

const OutsourceAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<OutsourceStats | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ['admin_outsource'])) {
      router.push('/login');
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersResponse, jobsResponse, dashboardResponse] = await Promise.all([
        adminAPI.getUsers({ role: 'client', limit: 100 }),
        adminAPI.getAllJobs(),
        adminAPI.getDashboard(),
      ]);

      // Handle different API response structures
      const clientsData = usersResponse.data?.data || usersResponse.data?.users || usersResponse.data || [];
      const jobsData = jobsResponse.data?.data || jobsResponse.data?.jobs || jobsResponse.data || [];

      setClients(clientsData);

      // Transform jobs to projects with mock data
      const projectsData: Project[] = jobsData.slice(0, 20).map((job: any) => ({
        _id: job._id,
        title: job.title,
        status: job.status,
        budget: job.budget || Math.floor(Math.random() * 5000) + 1000,
        progress: job.status === 'completed' ? 100 : job.status === 'in_progress' ? Math.floor(Math.random() * 80) + 20 : 0,
        deadline: job.deadline || new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        client: job.client || { _id: 'unknown', name: 'Unknown Client' },
        worker: job.worker,
        createdAt: job.createdAt,
      }));
      setProjects(projectsData);

      // Calculate outsourcing-specific stats
      const totalRevenue = projectsData.reduce((sum, p) => sum + (p.status === 'completed' ? p.budget : 0), 0);
      const monthlyRevenue = projectsData
        .filter(p => {
          const projectDate = new Date(p.createdAt);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return projectDate >= thisMonth && p.status === 'completed';
        })
        .reduce((sum, p) => sum + p.budget, 0);

      const outsourceStats: OutsourceStats = {
        totalClients: clientsData.length,
        activeProjects: projectsData.filter(p => ['posted', 'assigned', 'in_progress'].includes(p.status)).length,
        totalRevenue,
        monthlyRevenue,
        completedJobs: projectsData.filter(p => p.status === 'completed').length,
        ongoingJobs: projectsData.filter(p => p.status === 'in_progress').length,
        clientSatisfaction: 4.2, // Mock data
        projectSuccessRate: 87, // Mock data
      };

      setStats(outsourceStats);

      // Mock revenue data for charts
      const mockRevenueData: RevenueData[] = [
        { month: 'Jan', revenue: 12500, projects: 15 },
        { month: 'Feb', revenue: 18200, projects: 22 },
        { month: 'Mar', revenue: 15800, projects: 19 },
        { month: 'Apr', revenue: 22100, projects: 28 },
        { month: 'May', revenue: 19600, projects: 24 },
        { month: 'Jun', revenue: 25300, projects: 31 },
      ];
      setRevenueData(mockRevenueData);

    } catch (error) {
      console.error('Failed to fetch outsource dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="green">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="blue">In Progress</Badge>;
      case 'assigned':
        return <Badge variant="orange">Assigned</Badge>;
      case 'posted':
        return <Badge variant="gray">Posted</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 25) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Outsourcing Admin Dashboard</h1>
            <p className="text-gray-600">Manage projects, clients, and business operations</p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={() => router.push('/admin/outsource/projects')}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <Briefcase className="h-4 w-4" />
              <span>Manage Projects</span>
            </Button>
            <Button
              onClick={() => router.push('/admin/outsource/clients')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Building className="h-4 w-4" />
              <span>Client Management</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeProjects || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Satisfaction</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-green-600">{stats?.clientSatisfaction || 0}/5</span>
                  <span className="text-sm text-gray-600">⭐⭐⭐⭐⭐</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{width: `${((stats?.clientSatisfaction || 0) / 5) * 100}%`}}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Success Rate</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold text-blue-600">{stats?.projectSuccessRate || 0}%</span>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{width: `${stats?.projectSuccessRate || 0}%`}}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Growth</h2>
            <div className="space-y-2">
              {revenueData.slice(-3).map((data, idx) => (
                <div key={data.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{data.month}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(data.revenue)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Projects */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
              <Button
                onClick={() => router.push('/admin/outsource/projects')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <div key={project._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate max-w-48">{project.title}</h3>
                      {getProjectStatusBadge(project.status)}
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectModal(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Client: {project.client.name}</span>
                    <span>{formatCurrency(project.budget)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${getProgressColor(project.progress)}`} style={{width: `${project.progress}%`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Clients */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Top Clients</h2>
              <Button
                onClick={() => router.push('/admin/outsource/clients')}
                variant="outline"
                size="sm"
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {clients.slice(0, 5).map((client) => (
                <div key={client._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Building className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.email}</p>
                      {client.clientProfile?.industry && (
                        <Badge variant="blue" size="sm">{client.clientProfile.industry}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(client.clientProfile?.totalSpent || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {client.clientProfile?.projectsCompleted || 0} projects
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Business Actions and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Business Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Operations</h2>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/admin/outsource/clients')}
                variant="outline"
                className="w-full justify-start"
              >
                <Building className="h-4 w-4 mr-2" />
                Client Management
              </Button>
              <Button
                onClick={() => router.push('/admin/outsource/projects')}
                variant="outline"
                className="w-full justify-start"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Project Oversight
              </Button>
              <Button
                onClick={() => router.push('/admin/outsource/analytics')}
                variant="outline"
                className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Business Analytics
              </Button>
              <Button
                onClick={() => router.push('/admin/outsource/reports')}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Financial Reports
              </Button>
            </div>
          </Card>

          {/* Key Metrics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Project Value</span>
                <span className="font-semibold text-gray-900">{formatCurrency((stats?.totalRevenue || 0) / Math.max((stats?.completedJobs || 1), 1))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Client Retention</span>
                <span className="font-semibold text-gray-900">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Project Completion Rate</span>
                <span className="font-semibold text-gray-900">{stats?.projectSuccessRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Project Duration</span>
                <span className="font-semibold text-gray-900">2.5 weeks</span>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Project "E-commerce Platform" completed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">New client "TechCorp Inc" onboarded</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Payment of $2,500 processed</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Weekly report generated</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Project Details Modal */}
        <Modal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
          title="Project Details"
          size="lg"
        >
          {selectedProject && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedProject.title}</h3>
                {getProjectStatusBadge(selectedProject.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="font-medium">{selectedProject.client.name}</p>
                  {selectedProject.client.company && (
                    <p className="text-sm text-gray-600">{selectedProject.client.company}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget</p>
                  <p className="font-medium">{formatCurrency(selectedProject.budget)}</p>
                </div>
                {selectedProject.worker && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assigned Worker</p>
                    <p className="font-medium">{selectedProject.worker.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-600">Deadline</p>
                  <p className="font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-600">Progress</span>
                  <span className="font-medium">{selectedProject.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className={`h-3 rounded-full ${getProgressColor(selectedProject.progress)}`} style={{width: `${selectedProject.progress}%`}}></div>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="primary">View Details</Button>
                <Button variant="outline">Contact Client</Button>
                <Button variant="outline">Generate Report</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default OutsourceAdminDashboard;
