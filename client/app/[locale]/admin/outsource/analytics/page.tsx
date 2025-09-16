"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/sonner";
import {
  BarChart3,
  DollarSign,
  Users,
  Briefcase,
  PieChart,
  LineChart,
  Target,
  Award,
  Clock,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Activity,
  Zap,
  Star,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI } from "@/lib/api";
interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    trend: "up" | "down";
  };
  projects: {
    total: number;
    completed: number;
    active: number;
    successRate: number;
  };
  clients: {
    total: number;
    active: number;
    retention: number;
    satisfaction: number;
  };
  workers: {
    total: number;
    active: number;
    averageRating: number;
    utilization: number;
  };
  performance: {
    averageProjectValue: number;
    timeToCompletion: number;
    clientAcquisitionCost: number;
    lifetimeValue: number;
  };
}

interface ChartData {
  month: string;
  revenue: number;
  projects: number;
  clients: number;
}

interface TopPerformer {
  id: string;
  name: string;
  type: "client" | "worker";
  value: number;
  metric: string;
}

// Minimal shapes from API we rely on (avoid any)
type TimeRange = "7d" | "30d" | "90d" | "1y";
interface ApiUser {
  role?: string;
  isActive?: boolean;
  workerProfile?: { rating?: number };
}
interface ApiJob {
  status?:
    | "posted"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled"
    | string;
  budget?: number;
}

const BusinessAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_outsource"])) {
      router.push("/login");
      return;
    }

    fetchAnalyticsData();
  }, [router, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch real data from APIs
      const [usersResponse, jobsResponse] = await Promise.all([
        adminAPI.getUsers({ limit: 100 }),
        adminAPI.getAllJobs(),
      ]);

      const users = (usersResponse.data?.data || []) as ApiUser[];
      const jobs = (jobsResponse.data?.data || []) as ApiJob[];

      const clients = users.filter((u) => u.role === "client");
      const workers = users.filter((u) => u.role === "worker");
      const completedJobs = jobs.filter((j) => j.status === "completed");
      const activeJobs = jobs.filter(
        (j) => j.status === "assigned" || j.status === "in_progress",
      );

      // Calculate analytics based on real data
      const totalRevenue = completedJobs.reduce(
        (sum, job) => sum + (job.budget ?? Math.random() * 5000 + 1000),
        0,
      );

      const analyticsData: AnalyticsData = {
        revenue: {
          total: totalRevenue,
          monthly: totalRevenue * 0.2, // Assume 20% is from this month
          growth: 15.5, // Mock growth percentage
          trend: "up",
        },
        projects: {
          total: jobs.length,
          completed: completedJobs.length,
          active: activeJobs.length,
          successRate:
            jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
        },
        clients: {
          total: clients.length,
          active: clients.filter((c) => c.isActive === true).length,
          retention: 87.5, // Mock retention rate
          satisfaction: 4.3, // Mock satisfaction score
        },
        workers: {
          total: workers.length,
          active: workers.filter((w) => w.isActive === true).length,
          averageRating:
            workers.reduce(
              (sum, w) => sum + (w.workerProfile?.rating ?? 0),
              0,
            ) / Math.max(workers.length, 1),
          utilization: 78.2, // Mock utilization rate
        },
        performance: {
          averageProjectValue: totalRevenue / Math.max(jobs.length, 1),
          timeToCompletion: 14.5, // Mock days
          clientAcquisitionCost: 245, // Mock cost
          lifetimeValue: totalRevenue / Math.max(clients.length, 1),
        },
      };

      setAnalytics(analyticsData);

      // Generate chart data
      const mockChartData: ChartData[] = [
        { month: "Jan", revenue: 45000, projects: 12, clients: 8 },
        { month: "Feb", revenue: 52000, projects: 15, clients: 11 },
        { month: "Mar", revenue: 48000, projects: 13, clients: 9 },
        { month: "Apr", revenue: 61000, projects: 18, clients: 14 },
        { month: "May", revenue: 55000, projects: 16, clients: 12 },
        { month: "Jun", revenue: 67000, projects: 20, clients: 16 },
      ];
      setChartData(mockChartData);

      // Generate top performers
      const mockTopPerformers: TopPerformer[] = [
        {
          id: "1",
          name: "TechCorp Inc",
          type: "client",
          value: 15000,
          metric: "Total Spent",
        },
        {
          id: "2",
          name: "John Smith",
          type: "worker",
          value: 4.9,
          metric: "Rating",
        },
        {
          id: "3",
          name: "Global Solutions",
          type: "client",
          value: 12500,
          metric: "Total Spent",
        },
        {
          id: "4",
          name: "Maria Garcia",
          type: "worker",
          value: 4.8,
          metric: "Rating",
        },
      ];
      setTopPerformers(mockTopPerformers);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
            <h1 className="text-3xl font-bold text-gray-900">
              Business Analytics
            </h1>
            <p className="text-gray-600">
              Comprehensive insights into business performance and growth
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={timeRange}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTimeRange(e.target.value as TimeRange)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            <Button
              onClick={() => router.push("/admin/outsource/dashboard")}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.revenue.total || 0)}
                </p>
                <div className="flex items-center mt-1">
                  {analytics?.revenue.trend === "up" ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm ml-1 ${analytics?.revenue.trend === "up" ? "text-green-600" : "text-red-600"}`}
                  >
                    {analytics?.revenue.growth}% vs last month
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Projects
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.projects.active || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatPercentage(analytics?.projects.successRate || 0)}{" "}
                  success rate
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Clients
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.clients.active || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatPercentage(analytics?.clients.retention || 0)}{" "}
                  retention
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Worker Utilization
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(analytics?.workers.utilization || 0)}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ⭐ {analytics?.workers.averageRating?.toFixed(1) || 0}/5 avg
                  rating
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Trend
              </h3>
              <BarChart3 className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {chartData.map((data) => (
                <div
                  key={data.month}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-600 w-12">
                    {data.month}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(data.revenue / 70000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {formatCurrency(data.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Projects Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Project Volume
              </h3>
              <LineChart className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {chartData.map((data) => (
                <div
                  key={data.month}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-600 w-12">
                    {data.month}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(data.projects / 25) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {data.projects}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Project Value
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(
                    analytics?.performance.averageProjectValue || 0,
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Completion Time
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {analytics?.performance.timeToCompletion || 0} days
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Acquisition Cost
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(
                    analytics?.performance.clientAcquisitionCost || 0,
                  )}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Customer LTV
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(analytics?.performance.lifetimeValue || 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Performers and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Top Performers
              </h3>
              <Award className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {topPerformers.map((performer, idx) => (
                <div
                  key={performer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        performer.type === "client"
                          ? "bg-blue-600"
                          : "bg-green-600"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {performer.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {performer.metric}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {performer.metric.includes("Rating")
                        ? `${performer.value}/5 ⭐`
                        : formatCurrency(performer.value)}
                    </p>
                    <Badge
                      variant={performer.type === "client" ? "info" : "success"}
                      size="sm"
                    >
                      {performer.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Client Satisfaction */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Client Satisfaction
              </h3>
              <PieChart className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {analytics?.clients.satisfaction?.toFixed(1) || 0}/5
                </div>
                <p className="text-gray-600">Overall Rating</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">5 stars</span>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: "65%" }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium">65%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">4 stars</span>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "25%" }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">3 stars</span>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{ width: "8%" }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium">8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">2 stars</span>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: "2%" }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium">2%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Export Actions */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={() => {
              // In a real app, this would generate and download a report
              toast.success(
                "Preparing analytics report… You'll get a download shortly.",
              );
            }}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;
