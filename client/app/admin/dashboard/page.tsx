"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  Download,
  BarChart3,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

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

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
  profile?: { verified?: boolean };
}
interface RecentJob {
  _id: string;
  title: string;
  status: string;
  budget?: number;
  createdAt: string;
}
interface PaymentDispute {
  _id: string;
  amount?: number;
  status: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [reportType, setReportType] = useState("revenue");
  const [disputes, setDisputes] = useState<PaymentDispute[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["super_admin"])) {
      router.push("/login");
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, usersResponse, jobsResponse, paymentsResponse] =
        await Promise.all([
          adminAPI.getDashboard(),
          adminAPI.getUsers({ limit: 5, sort: "-createdAt" }),
          adminAPI.getAllJobs(),
          adminAPI.getPayments(),
        ]);

      const overview =
        dashboardResponse.data?.data?.overview ||
        dashboardResponse.data?.overview ||
        null;
      setStats(
        overview
          ? {
              totalUsers: overview.totalUsers,
              totalJobs: overview.totalJobs,
              totalRevenue: overview.totalRevenue,
              activeJobs: overview.activeJobs,
              completedJobs: overview.completedJobs,
              pendingVerifications: overview.pendingVerifications,
              disputedPayments: 0,
              monthlyGrowth: 0,
            }
          : null,
      );
      setRecentUsers(usersResponse.data.data || []);
      setRecentJobs(jobsResponse.data.data?.slice(0, 5) || []);
      const payments: PaymentDispute[] = (paymentsResponse.data.data ||
        paymentsResponse.data.payments ||
        []) as PaymentDispute[];
      setDisputes(payments.filter((p) => p.status === "disputed"));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWorker = async (workerId: string) => {
    try {
      await adminAPI.verifyWorker(workerId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to verify worker:", error);
    }
  };

  const handleResolveDispute = async (
    disputeId: string,
    action: "refund" | "release" | "partial" | "investigate",
  ) => {
    try {
      if (action === "investigate") {
        // no-op for now, could open a detail modal
        setShowDisputeModal(false);
        return;
      }
      const resolution =
        action === "refund"
          ? "Refund to client"
          : action === "release"
            ? "Release payment to worker"
            : "Partial refund to client";
      await adminAPI.handlePaymentDispute(disputeId, action, resolution);
      setShowDisputeModal(false);

      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
    }
  };

  const generateReport = async () => {
    try {
      // In a real implementation, this would generate and download a report
      const reportData = {
        type: reportType,
        generatedAt: new Date().toISOString(),
        stats: stats,
        users: recentUsers,
        jobs: recentJobs,
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `belimuno-${reportType}-report-${new Date().toISOString().split("T")[0]}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      setShowReportsModal(false);
    } catch (error) {
      console.error("Failed to generate report:", error);
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Super Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Monitor and manage the entire Belimuno Jobs platform
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReportsModal(true)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
              {disputes.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeModal(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Resolve Disputes ({disputes.length})
                </Button>
              )}
            </div>
          </div>
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
                <p className="text-2xl font-bold text-blue-900">
                  {stats?.totalUsers || 0}
                </p>
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
                <p className="text-2xl font-bold text-green-900">
                  {stats?.totalJobs || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-yellow-900">
                  ETB {stats?.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">
                  Monthly Growth
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  +{stats?.monthlyGrowth || 0}%
                </p>
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
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.activeJobs || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completed Jobs
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.completedJobs || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Verifications
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.pendingVerifications || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Users
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/users")}
              >
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {user.role.replace("_", " ")}
                    </p>
                  </div>
                  {user.role === "worker" && !user.isVerified && (
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
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Jobs
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/jobs")}
              >
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {job.title}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        job.status === "posted"
                          ? "bg-green-100 text-green-800"
                          : job.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : job.status === "completed"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    ETB {job.budget?.toLocaleString()}
                  </p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center"
              onClick={() => router.push("/admin/users")}
            >
              <Users className="h-6 w-6 mb-2" />
              Manage Users
            </Button>
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center"
              onClick={() => router.push("/admin/jobs")}
            >
              <Briefcase className="h-6 w-6 mb-2" />
              Manage Jobs
            </Button>
            <Button
              variant="outline"
              className="p-4 h-auto flex flex-col items-center"
              onClick={() => router.push("/admin/payments")}
            >
              <DollarSign className="h-6 w-6 mb-2" />
              Payment Disputes
            </Button>
          </div>
        </Card>

        {/* Reports Modal */}
        <Modal
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
          title="Generate Reports"
          size="md"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="revenue">Revenue Report</option>
                <option value="completion">Completion Rates</option>
                <option value="users">User Analytics</option>
                <option value="performance">Performance Metrics</option>
              </select>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Total Users: {stats?.totalUsers || 0}</p>
                <p>• Total Jobs: {stats?.totalJobs || 0}</p>
                <p>
                  • Total Revenue: ETB{" "}
                  {stats?.totalRevenue?.toLocaleString() || 0}
                </p>
                <p>• Monthly Growth: +{stats?.monthlyGrowth || 0}%</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReportsModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={generateReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </Modal>

        {/* Disputes Modal */}
        <Modal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          title="Payment Disputes"
          size="lg"
        >
          <div className="space-y-4">
            {disputes.length > 0 ? (
              disputes.map((dispute) => (
                <Card key={dispute._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Payment ID: {dispute._id?.slice(-6) || "Unknown"}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Amount: ETB {dispute.amount?.toLocaleString() || 0}
                      </p>
                      <p className="text-sm text-gray-500">
                        Date: {new Date(dispute.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="danger">Disputed</Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleResolveDispute(dispute._id, "refund")
                      }
                    >
                      Refund Client
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleResolveDispute(dispute._id, "release")
                      }
                    >
                      Pay Worker
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleResolveDispute(dispute._id, "investigate")
                      }
                    >
                      Investigate
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Disputes
                </h3>
                <p className="text-gray-600">
                  All payments are processing smoothly!
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminDashboard;
