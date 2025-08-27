"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  Award,
  CheckCircle,
  XCircle,
  Eye,
  Bell,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI, notificationsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

interface HRStats {
  totalWorkers: number;
  verifiedWorkers: number;
  pendingVerifications: number;
  activeWorkers: number;
  workersThisMonth: number;
  disputesOpen: number;
  performanceReviews: number;
}

interface Worker {
  _id: string;
  name: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  workerProfile?: {
    skills: string[];
    experience: string;
    rating: number;
    totalJobs: number;
    completedJobs: number;
  };
  profile?: {
    verified: boolean;
    avatar?: string;
  };
}

interface Dispute {
  _id: string;
  worker: {
    _id: string;
    name: string;
  };
  client: {
    _id: string;
    name: string;
  };
  job?: {
    _id: string;
    title: string;
  };
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

const HRAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<HRStats | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    targetRoles: ["worker"] as string[],
    priority: "medium",
  });
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_hr"])) {
      router.push("/login");
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [usersResponse, dashboardResponse] = await Promise.all([
        adminAPI.getUsers({ role: "worker", limit: 100 }),
        adminAPI.getDashboard(),
      ]);

      // Handle different API response structures
      const workersData =
        usersResponse.data?.data ||
        usersResponse.data?.users ||
        usersResponse.data ||
        [];
      setWorkers(workersData);

      // Calculate HR-specific stats
      const hrStats: HRStats = {
        totalWorkers: workersData.length,
        verifiedWorkers: workersData.filter(
          (w: Worker) => w.isVerified || w.profile?.verified,
        ).length,
        pendingVerifications: workersData.filter(
          (w: Worker) => !w.isVerified && !w.profile?.verified,
        ).length,
        activeWorkers: workersData.filter((w: Worker) => w.isActive).length,
        workersThisMonth: workersData.filter((w: Worker) => {
          const createdDate = new Date(w.createdAt);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return createdDate >= thisMonth;
        }).length,
        disputesOpen: 0, // Will be populated from actual disputes data
        performanceReviews: 0, // Placeholder
      };

      setStats(hrStats);

      // Mock disputes for now - in real implementation, fetch from API
      const mockDisputes: Dispute[] = [
        {
          _id: "1",
          worker: { _id: "w1", name: "John Worker" },
          client: { _id: "c1", name: "ABC Company" },
          job: { _id: "j1", title: "Web Development Project" },
          description:
            "Client is unsatisfied with work quality and requesting refund",
          status: "open",
          priority: "high",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          worker: { _id: "w2", name: "Jane Designer" },
          client: { _id: "c2", name: "XYZ Corp" },
          description:
            "Worker claims project scope was expanded without compensation",
          status: "investigating",
          priority: "medium",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setDisputes(mockDisputes);
      setStats((prev) =>
        prev
          ? {
              ...prev,
              disputesOpen: mockDisputes.filter((d) => d.status === "open")
                .length,
            }
          : null,
      );
    } catch (error) {
      console.error("Failed to fetch HR dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerVerification = async (
    workerId: string,
    action: "verify" | "reject",
  ) => {
    try {
      if (action === "verify") {
        await adminAPI.verifyWorker(workerId);

        // Send notification to worker
        await notificationsAPI.create({
          recipients: [workerId],
          title: "Profile Verified! 🎉",
          message:
            "Congratulations! Your worker profile has been verified. You can now apply for jobs on our platform.",
          type: "profile_verified",
          priority: "high",
          actionButton: {
            text: "View Jobs",
            url: "/jobs",
            action: "view_jobs",
          },
        });
      }

      fetchDashboardData();
      setShowWorkerModal(false);
      setSelectedWorker(null);
    } catch (error) {
      console.error("Failed to update worker verification:", error);
    }
  };

  const handleSendAnnouncement = async () => {
    try {
      await notificationsAPI.sendAnnouncement({
        title: announcement.title,
        message: announcement.message,
        targetRoles: announcement.targetRoles,
        priority: announcement.priority,
      });

      setShowAnnouncementModal(false);
      setAnnouncement({
        title: "",
        message: "",
        targetRoles: ["worker"],
        priority: "medium",
      });

      alert("Announcement sent successfully!");
    } catch (error) {
      console.error("Failed to send announcement:", error);
      alert("Failed to send announcement. Please try again.");
    }
  };

  const getWorkerStatusBadge = (worker: Worker) => {
    if (!worker.isActive) return <Badge variant="danger">Inactive</Badge>;
    if (!worker.isVerified && !worker.profile?.verified)
      return <Badge variant="warning">Pending</Badge>;
    return <Badge variant="success">Verified</Badge>;
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
              HR Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Manage workforce, disputes, and HR operations
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={() => setShowAnnouncementModal(true)}
              variant="primary"
              className="flex items-center space-x-2"
            >
              <Bell className="h-4 w-4" />
              <span>Send Announcement</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/hr/workers")}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>Manage Workers</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Workers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalWorkers || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Verified Workers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.verifiedWorkers || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Pending Verification
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.pendingVerifications || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Open Disputes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.disputesOpen || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pending Worker Verifications */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Pending Verifications
              </h2>
              <Badge variant="warning">
                {
                  workers.filter((w) => !w.isVerified && !w.profile?.verified)
                    .length
                }
              </Badge>
            </div>
            <div className="space-y-3">
              {workers
                .filter((w) => !w.isVerified && !w.profile?.verified)
                .slice(0, 5)
                .map((worker) => (
                  <div
                    key={worker._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {worker.name}
                        </p>
                        <p className="text-sm text-gray-600">{worker.email}</p>
                        <div className="flex space-x-1 mt-1">
                          {worker.workerProfile?.skills
                            ?.slice(0, 2)
                            .map((skill, idx) => (
                              <Badge key={idx} variant="info" size="sm">
                                {skill}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => {
                          setSelectedWorker(worker);
                          setShowWorkerModal(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              {workers.filter((w) => !w.isVerified && !w.profile?.verified)
                .length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No pending verifications
                </p>
              )}
            </div>
          </Card>

          {/* Active Disputes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Active Disputes
              </h2>
              <Badge variant="danger">
                {disputes.filter((d) => d.status === "open").length}
              </Badge>
            </div>
            <div className="space-y-3">
              {disputes.slice(0, 5).map((dispute) => (
                <div key={dispute._id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          dispute.priority === "high"
                            ? "danger"
                            : dispute.priority === "medium"
                              ? "warning"
                              : "info"
                        }
                        size="sm"
                      >
                        {dispute.priority}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {dispute.status}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setShowDisputeModal(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="font-medium text-gray-900 mb-1">
                    {dispute.worker.name} vs {dispute.client.name}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {dispute.description}
                  </p>
                  {dispute.job && (
                    <p className="text-xs text-blue-600 mt-1">
                      Job: {dispute.job.title}
                    </p>
                  )}
                </div>
              ))}
              {disputes.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No active disputes
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity and Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* HR Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              HR Actions
            </h2>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/admin/hr/workers")}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Worker Management
              </Button>
              <Button
                onClick={() => router.push("/admin/hr/disputes")}
                variant="outline"
                className="w-full justify-start"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Dispute Resolution
              </Button>
              <Button
                onClick={() => router.push("/admin/hr/performance")}
                variant="outline"
                className="w-full justify-start"
              >
                <Award className="h-4 w-4 mr-2" />
                Performance Reviews
              </Button>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Performance Metrics
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900">Worker Satisfaction</span>
                  <span className="text-gray-900">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900">Verification Rate</span>
                  <span className="text-gray-900">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: "92%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-900">Dispute Resolution</span>
                  <span className="text-gray-900">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: "78%" }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Metrics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              This Month
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">New Workers</span>
                <span className="font-semibold text-gray-900">
                  {stats?.workersThisMonth || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Verifications</span>
                <span className="font-semibold text-gray-900">
                  {stats?.verifiedWorkers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Disputes Resolved</span>
                <span className="font-semibold text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Training Completed</span>
                <span className="font-semibold text-gray-900">45</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Worker Details Modal */}
        <Modal
          isOpen={showWorkerModal}
          onClose={() => {
            setShowWorkerModal(false);
            setSelectedWorker(null);
          }}
          title="Worker Verification"
          size="lg"
        >
          {selectedWorker && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-700">
                    {selectedWorker.name}
                  </h3>
                  <p className="text-gray-600">{selectedWorker.email}</p>
                  {getWorkerStatusBadge(selectedWorker)}
                </div>
              </div>

              {selectedWorker.workerProfile && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-700">
                    Worker Profile
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-gray-700">
                    <p>
                      <strong>Experience:</strong>{" "}
                      {selectedWorker.workerProfile.experience}
                    </p>
                    <p>
                      <strong>Rating:</strong>{" "}
                      {selectedWorker.workerProfile.rating}/5
                    </p>
                    <p>
                      <strong>Jobs Completed:</strong>{" "}
                      {selectedWorker.workerProfile.completedJobs}/
                      {selectedWorker.workerProfile.totalJobs}
                    </p>
                    <div>
                      <strong>Skills:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedWorker.workerProfile.skills?.map(
                          (skill, idx) => (
                            <Badge key={idx} variant="info" size="sm">
                              {skill}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={() =>
                    handleWorkerVerification(selectedWorker._id, "verify")
                  }
                  variant="primary"
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Verify Worker</span>
                </Button>
                <Button
                  onClick={() =>
                    handleWorkerVerification(selectedWorker._id, "reject")
                  }
                  variant="outline"
                  className="flex items-center space-x-2 text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Dispute Details Modal */}
        <Modal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedDispute(null);
          }}
          title="Dispute Details"
          size="lg"
        >
          {selectedDispute && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    selectedDispute.priority === "high"
                      ? "danger"
                      : selectedDispute.priority === "medium"
                        ? "warning"
                        : "info"
                  }
                >
                  {selectedDispute.priority} Priority
                </Badge>
                <Badge variant="secondary">{selectedDispute.status}</Badge>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-700">
                  Parties Involved
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                  <p>
                    <strong>Worker:</strong> {selectedDispute.worker.name}
                  </p>
                  <p>
                    <strong>Client:</strong> {selectedDispute.client.name}
                  </p>
                  {selectedDispute.job && (
                    <p>
                      <strong>Job:</strong> {selectedDispute.job.title}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-700">Description</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedDispute.description}
                </p>
              </div>

              <div className="flex space-x-3">
                <Button variant="primary">Investigate</Button>
                <Button variant="outline">Contact Parties</Button>
                <Button variant="outline" className="text-green-600">
                  Resolve
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Announcement Modal */}
        <Modal
          isOpen={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          title="Send System Announcement"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={announcement.title}
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Announcement title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={announcement.message}
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Your announcement message..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience
                </label>
                <select
                  value={announcement.targetRoles[0]}
                  onChange={(e) =>
                    setAnnouncement((prev) => ({
                      ...prev,
                      targetRoles: [e.target.value],
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="worker">Workers</option>
                  <option value="client">Clients</option>
                  <option value="both">Both Workers & Clients</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={announcement.priority}
                  onChange={(e) =>
                    setAnnouncement((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleSendAnnouncement}
                variant="primary"
                disabled={!announcement.title || !announcement.message}
              >
                Send Announcement
              </Button>
              <Button
                onClick={() => setShowAnnouncementModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default HRAdminDashboard;
