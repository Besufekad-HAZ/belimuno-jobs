"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Briefcase,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  Eye,
  Send,
  Bell,
  Wallet,
  TrendingUp,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Smile,
  FileText,
  X,
  AlertTriangle,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { workerAPI, jobsAPI, notificationsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";

interface WorkerStats {
  totalApplications: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  pendingApplications: number;
  name?: string;
  pendingApplicationsList?: {
    _id: string;
    job?: { title?: string };
    appliedAt: string;
  }[];
}

interface RealNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  priority: "low" | "medium" | "high" | "urgent";
  actionButton?: {
    text: string;
    url: string;
    action: string;
  };
  sender?: {
    _id: string;
    name: string;
    profile?: {
      avatar?: string;
    };
  };
  relatedJob?: {
    _id: string;
    title: string;
  };
  relatedUser?: {
    _id: string;
    name: string;
  };
}

const WorkerDashboard: React.FC = () => {
  const [stats, setStats] = useState<WorkerStats | null>(null);
  interface SimpleJob {
    _id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    category?: string;
    region?: { name?: string };
    status?: string;
    progress?: number;
    acceptedApplication?: { proposedBudget?: number };
    applicationCount?: number;
    review?: { workerReview?: { rating?: number } };
  }
  interface EarningsData {
    recentPayments?: { jobTitle?: string; amount?: number; date?: string }[];
  }
  const [availableJobs, setAvailableJobs] = useState<SimpleJob[]>([]);
  const [myJobs, setMyJobs] = useState<SimpleJob[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SimpleJob | null>(null);
  const [applicationData, setApplicationData] = useState<{
    proposal: string;
    proposedBudget: string;
    estimatedDuration?: string;
  }>({ proposal: "", proposedBudget: "" });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState<RealNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [chatJobId, setChatJobId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    {
      _id?: string;
      content: string;
      sender?: { name?: string; role?: string };
      sentAt: string;
    }[]
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  type PendingAttachment = {
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  };
  const [chatAttachments, setChatAttachments] = useState<PendingAttachment[]>(
    [],
  );
  const [showEmoji, setShowEmoji] = useState(false);
  const chatInputRef = React.useRef<HTMLInputElement>(null);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateJobId, setRateJobId] = useState<string | null>(null);
  const [clientRating, setClientRating] = useState(5);
  const [clientReview, setClientReview] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedJobForDispute, setSelectedJobForDispute] =
    useState<SimpleJob | null>(null);
  const [disputeData, setDisputeData] = useState({
    title: "",
    description: "",
    type: "payment" as
      | "payment"
      | "quality"
      | "communication"
      | "deadline"
      | "scope"
      | "other",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    evidence: [] as Array<{
      type: "image" | "document" | "message";
      url: string;
      description?: string;
    }>,
  });
  const [disputes, setDisputes] = useState<
    Array<{
      _id: string;
      title: string;
      description: string;
      status: string;
      priority: string;
      type: string;
      job?: {
        title: string;
        budget: number;
      };
      createdAt: string;
      updatedAt: string;
      resolution?: string;
    }>
  >([]);
  const router = useRouter();
  const PROPOSAL_MAX = 1200;
  const t = useTranslations("WorkerDashboard");

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["worker"])) {
      router.push("/login");
      return;
    }

    fetchDashboardData();
    fetchNotifications();
  }, [router]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        dashboardResponse,
        jobsResponse,
        myJobsResponse,
        applicationsResponse,
        earningsResponse,
        disputesResponse,
      ] = await Promise.all([
        workerAPI.getDashboard(),
        jobsAPI.getAll({ status: "open", limit: 10 }),
        workerAPI.getJobs(),
        workerAPI.getApplications(),
        workerAPI.getEarnings(),
        workerAPI.getDisputes(),
      ]);

      setStats(dashboardResponse.data.data || dashboardResponse.data); // support either wrapped or direct
      setAvailableJobs(jobsResponse.data.data || []);
      setMyJobs(myJobsResponse.data.data || []);
      const apps: { job?: { _id: string } }[] =
        applicationsResponse.data.data || [];
      setAppliedJobIds(
        new Set(apps.map((a) => a.job?._id).filter(Boolean) as string[]),
      );
      setEarnings(earningsResponse.data);
      console.log("disputes", disputesResponse.data.data);
      setDisputes(disputesResponse.data.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      const fetchedNotifications = response.data?.data || [];
      setNotifications(fetchedNotifications);
      setUnreadCount(
        fetchedNotifications.filter((n: RealNotification) => !n.isRead).length,
      );
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_posted":
        return <Briefcase className="h-4 w-4" />;
      case "job_application":
        return <FileText className="h-4 w-4" />;
      case "job_assigned":
        return <CheckCircle className="h-4 w-4" />;
      case "job_completed":
        return <CheckCircle className="h-4 w-4" />;
      case "payment_received":
      case "payment_processed":
        return <DollarSign className="h-4 w-4" />;
      case "review_received":
        return <Star className="h-4 w-4" />;
      case "profile_verified":
        return <CheckCircle className="h-4 w-4" />;
      case "system_announcement":
        return <Bell className="h-4 w-4" />;
      case "deadline_reminder":
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationBadgeVariant = (type: string) => {
    switch (type) {
      case "payment_received":
      case "payment_processed":
        return "success";
      case "job_assigned":
      case "profile_verified":
        return "primary";
      case "job_completed":
        return "success";
      case "system_announcement":
        return "warning";
      case "deadline_reminder":
        return "danger";
      default:
        return "secondary";
    }
  };

  const handleApplyToJob = async (jobId: string) => {
    try {
      await jobsAPI.apply(
        jobId,
        applicationData.proposal,
        parseFloat(applicationData.proposedBudget),
      );
      setSelectedJob(null);
      setApplicationData({ proposal: "", proposedBudget: "" });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to apply to job:", error);
    }
  };

  const handleUpdateJobStatus = async (
    jobId: string,
    status: string,
    progress?: number,
  ) => {
    try {
      await workerAPI.updateJobStatus(jobId, status, progress);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to update job status:", error);
    }
  };

  const openChat = async (jobId: string) => {
    try {
      setChatJobId(jobId);
      const res = await workerAPI.getJobMessages(jobId);
      setChatMessages(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const sendChat = async () => {
    if (!chatJobId || (!newMessage.trim() && chatAttachments.length === 0))
      return;
    setSending(true);
    try {
      const res = await workerAPI.sendJobMessage(
        chatJobId,
        newMessage.trim(),
        chatAttachments.map((a) => a.dataUrl),
      );
      setChatMessages((prev) => [...prev, res.data.data]);
      setNewMessage("");
      setChatAttachments([]);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Poll chat while modal open
  useEffect(() => {
    if (!chatJobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await workerAPI.getJobMessages(chatJobId);
        setChatMessages(res.data.data || []);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [chatJobId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el =
      chatScrollRef.current || document.getElementById("worker-chat-scroll");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatMessages, chatAttachments]);

  const acceptAssignment = async (jobId: string) => {
    await workerAPI.acceptAssignedJob(jobId);
    fetchDashboardData();
  };
  const declineAssignment = async (jobId: string) => {
    await workerAPI.declineAssignedJob(jobId);
    fetchDashboardData();
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t("header.title")}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                {t("header.subtitle")}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNotificationsModal(true)}
                className="relative w-full sm:w-auto"
                size="sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">
                  {t("buttons.notifications")}
                </span>
                <span className="sm:hidden">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWalletModal(true)}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Wallet className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("buttons.wallet")}</span>
                <span className="sm:hidden">Wallet</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-blue-600">
                {t("stats.activeJobs.label")}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">
                {stats?.activeJobs ?? 0}
              </p>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="text-center">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-green-600">
                {t("stats.completedJobs.label")}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-green-900">
                {stats?.completedJobs ?? 0}
              </p>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-yellow-600">
                {t("stats.earnings.label")}
              </p>
              <p className="text-sm sm:text-xl font-bold text-yellow-900">
                ETB {(stats?.totalEarnings || 0).toLocaleString()}
              </p>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="text-center">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-purple-600">
                {t("stats.rating.label")}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-purple-900">
                {stats?.averageRating !== undefined
                  ? stats.averageRating.toFixed(1)
                  : "N/A"}
              </p>
            </div>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <div className="text-center">
              <Send className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-indigo-600">
                {t("stats.applications.label")}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-900">
                {stats?.totalApplications ?? 0}
              </p>
            </div>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <div className="text-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-orange-600">
                {t("stats.pending.label")}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-orange-900">
                {stats?.pendingApplications ?? 0}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Available Jobs */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("sections.availableJobs.title")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/jobs")}
                className="w-full sm:w-auto"
              >
                {t("buttons.viewAll")}
              </Button>
            </div>
            <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
              {availableJobs.map((job) => (
                <div key={job._id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                      {job.title}
                    </h4>
                    <div className="text-left sm:text-right">
                      <span className="text-sm font-semibold text-green-600 block">
                        ETB {job.budget?.toLocaleString()}
                      </span>
                      {job.applicationCount !== undefined && (
                        <span className="text-[10px] sm:text-[11px] text-gray-500">
                          {job.applicationCount}{" "}
                          {t("sections.availableJobs.applications")}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                    {job.description}
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500">
                      <span>
                        {t("sections.availableJobs.due")}:{" "}
                        {new Date(job.deadline).toLocaleDateString()}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="sm:hidden block">{job.category}</span>
                      <span className="hidden sm:inline">{job.category}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJob(job)}
                        className="w-full sm:w-auto"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="text-xs sm:text-sm">
                          {appliedJobIds.has(job._id)
                            ? t("sections.availableJobs.details")
                            : t("sections.availableJobs.view")}
                        </span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedJob(job)}
                        disabled={appliedJobIds.has(job._id)}
                        className="w-full sm:w-auto"
                      >
                        <span className="text-xs sm:text-sm">
                          {appliedJobIds.has(job._id)
                            ? t("sections.availableJobs.applied")
                            : t("sections.availableJobs.apply")}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* My Active Jobs */}
          <Card>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t("sections.activeJobs.title")}
              </h3>
            </div>
            <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
              {/* Pending Applications Snapshot */}
              <Card className="mt-4 sm:mt-8">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  {t("sections.activeJobs.pendingApplications.title")}
                </h3>
                {stats?.pendingApplicationsList?.length ? (
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                    {stats.pendingApplicationsList.map((app) => (
                      <div
                        key={app._id}
                        className="p-2 sm:p-3 bg-gray-50 rounded border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-1">
                            {app.job?.title || "Job"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t(
                              "sections.activeJobs.pendingApplications.applied",
                            )}{" "}
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 self-start sm:self-auto">
                          {t("sections.activeJobs.pendingApplications.status")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t("sections.activeJobs.pendingApplications.empty")}
                  </p>
                )}
              </Card>
              {myJobs
                .filter(
                  (job) =>
                    job.status &&
                    [
                      "assigned",
                      "in_progress",
                      "revision_requested",
                      "completed",
                      "disputed",
                    ].includes(job.status),
                )
                .map((job) => (
                  <div
                    key={job._id}
                    className="p-3 sm:p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                        {job.title}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full self-start sm:self-auto ${
                          job.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : job.status === "assigned"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {job.status ? job.status.replace("_", " ") : ""}
                      </span>
                    </div>
                    <div className="mb-3">
                      <ProgressBar
                        progress={job.progress || 0}
                        size="md"
                        color={
                          (job.progress || 0) >= 100
                            ? "green"
                            : (job.progress || 0) >= 50
                              ? "blue"
                              : "yellow"
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-3">
                      <span className="text-xs sm:text-sm text-gray-600">
                        ETB{" "}
                        {job.acceptedApplication?.proposedBudget?.toLocaleString()}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {job.status === "assigned" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => declineAssignment(job._id)}
                              className="flex-1 sm:flex-none"
                            >
                              <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs sm:text-sm">
                                {t("sections.activeJobs.actions.decline")}
                              </span>
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => acceptAssignment(job._id)}
                              className="flex-1 sm:flex-none"
                            >
                              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs sm:text-sm">
                                {t("sections.activeJobs.actions.accept")}
                              </span>
                            </Button>
                          </>
                        )}
                        {job.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleUpdateJobStatus(job._id, "completed")
                            }
                            className="w-full sm:w-auto"
                          >
                            <span className="text-xs sm:text-sm">
                              {t("sections.activeJobs.actions.markComplete")}
                            </span>
                          </Button>
                        )}
                        {job.status === "revision_requested" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateJobStatus(job._id, "in_progress")
                            }
                            className="w-full sm:w-auto"
                          >
                            <span className="text-xs sm:text-sm">
                              {t("sections.activeJobs.actions.resubmit")}
                            </span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openChat(job._id)}
                          className="flex-1 sm:flex-none"
                        >
                          <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        {(job.status === "in_progress" ||
                          job.status === "submitted" ||
                          job.status === "revision_requested" ||
                          job.status === "completed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedJobForDispute(job);
                              setShowDisputeModal(true);
                            }}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Raise Dispute
                          </Button>
                        )}
                        {job.status === "completed" &&
                          !job.review?.workerReview?.rating && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setRateJobId(job._id);
                                setShowRateModal(true);
                              }}
                              className="flex-1 sm:flex-none"
                            >
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs sm:text-sm">
                                Rate Client
                              </span>
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* Active Disputes */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Disputes
              </h3>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {disputes
                .filter((d) => d.status !== "resolved" && d.status !== "closed")
                .map((dispute) => (
                  <div key={dispute._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {dispute.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {dispute.job?.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            dispute.priority === "urgent"
                              ? "danger"
                              : dispute.priority === "high"
                                ? "warning"
                                : "info"
                          }
                        >
                          {dispute.priority}
                        </Badge>
                        <Badge
                          variant={
                            dispute.status === "open"
                              ? "danger"
                              : dispute.status === "investigating"
                                ? "warning"
                                : "success"
                          }
                        >
                          {dispute.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {dispute.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Created{" "}
                        {formatDistanceToNow(new Date(dispute.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>Type: {dispute.type}</span>
                    </div>
                  </div>
                ))}
              {disputes.filter(
                (d) => d.status !== "resolved" && d.status !== "closed",
              ).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No active disputes
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Enhanced Application Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedJob(null)}
            />
            <div className="relative w-full max-w-lg animate-[fadeIn_0.25s_ease] max-h-[90vh] overflow-y-auto">
              <Card className="p-0 overflow-hidden shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide opacity-80 mb-1">
                      Apply to Job
                    </p>
                    <h3 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 pr-4">
                      {selectedJob.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="text-white/70 hover:text-white transition-colors flex-shrink-0 ml-2"
                    aria-label="Close application form"
                  >
                    ×
                  </button>
                </div>

                {/* Job Quick Summary */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Budget</p>
                    <p className="font-medium text-gray-900">
                      ETB {selectedJob.budget?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deadline</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedJob.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Region</p>
                    <p className="font-medium text-gray-900">
                      {selectedJob.region?.name || "—"}
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyToJob(selectedJob._id);
                  }}
                  className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 space-y-4 sm:space-y-5"
                >
                  {/* Proposal */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Proposal
                      </label>
                      <span
                        className={`text-xs ${applicationData.proposal.length > PROPOSAL_MAX ? "text-red-500" : "text-gray-400"}`}
                      >
                        {applicationData.proposal.length}/{PROPOSAL_MAX}
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={PROPOSAL_MAX}
                      required
                      value={applicationData.proposal}
                      onChange={(e) =>
                        setApplicationData({
                          ...applicationData,
                          proposal: e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Explain your approach, relevant experience, deliverables and timeline..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      A clear, concise proposal improves acceptance chances.
                    </p>
                  </div>

                  {/* Budget & Duration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proposed Budget (ETB)
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={applicationData.proposedBudget}
                        onChange={(e) =>
                          setApplicationData({
                            ...applicationData,
                            proposedBudget: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. 4500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Client budget: ETB{" "}
                        {selectedJob.budget?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Duration
                      </label>
                      <input
                        type="text"
                        value={applicationData.estimatedDuration || ""}
                        onChange={(e) =>
                          setApplicationData({
                            ...applicationData,
                            estimatedDuration: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. 5 days"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Optional – helps the client assess timeline.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between pt-2 gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedJob(null);
                        setApplicationData({
                          proposal: "",
                          proposedBudget: "",
                        });
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !applicationData.proposal ||
                        !applicationData.proposedBudget
                      }
                      className="w-full sm:min-w-[160px]"
                    >
                      Submit Application
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        )}

        {/* Wallet Modal */}
        <Modal
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
          title={t("modals.wallet.title")}
          size="md"
        >
          <div className="space-y-6">
            {/* Wallet Balance */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ETB {stats?.totalEarnings?.toLocaleString() || "0"}
                </h3>
                <p className="text-green-600 font-medium">
                  {t("modals.wallet.balance.label")}
                </p>
              </div>
            </Card>

            {/* Recent Earnings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {t("modals.wallet.recentEarnings.title")}
              </h4>
              <div className="space-y-3">
                {earnings?.recentPayments?.slice(0, 5).map(
                  (
                    payment: {
                      jobTitle?: string;
                      amount?: number;
                      date?: string;
                    },
                    index: number,
                  ) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.jobTitle ||
                            t("modals.wallet.recentEarnings.jobPayment")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.date ||
                            t("modals.wallet.recentEarnings.recently")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +ETB {payment.amount?.toLocaleString() || "1,000"}
                        </p>
                        <Badge variant="success" size="sm">
                          {t("modals.wallet.recentEarnings.status")}
                        </Badge>
                      </div>
                    </div>
                  ),
                ) ||
                  [
                    // Mock data for demo
                    {
                      jobTitle: "Website Development",
                      amount: 5000,
                      date: "2 days ago",
                    },
                    {
                      jobTitle: "Logo Design",
                      amount: 1500,
                      date: "1 week ago",
                    },
                    {
                      jobTitle: "Data Entry",
                      amount: 800,
                      date: "2 weeks ago",
                    },
                  ].map((payment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {payment.jobTitle}
                        </p>
                        <p className="text-sm text-gray-500">{payment.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +ETB {payment.amount.toLocaleString()}
                        </p>
                        <Badge variant="success" size="sm">
                          {t("modals.wallet.recentEarnings.status")}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Withdrawal Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                className="w-full"
                onClick={() => alert(t("modals.wallet.withdrawalFeature"))}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {t("buttons.withdrawFunds")}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Rate Client Modal */}
        <Modal
          isOpen={showRateModal}
          onClose={() => setShowRateModal(false)}
          title={t("modals.rating.title")}
          size="md"
        >
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900">
                {t("modals.rating.subtitle")}
              </h4>
              <p className="text-sm text-gray-500">
                {t("modals.rating.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setClientRating(star)}
                    className={`p-1 ${star <= clientRating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400`}
                  >
                    <Star className="h-8 w-8 fill-current" />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {clientRating} {t("modals.rating.outOf")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("modals.rating.feedback.label")}
              </label>
              <textarea
                rows={4}
                value={clientReview}
                onChange={(e) => setClientReview(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t("modals.rating.feedback.placeholder")}
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRateModal(false);
                  setClientRating(5);
                  setClientReview("");
                }}
              >
                {t("buttons.cancel")}
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  if (!rateJobId) return;
                  try {
                    await workerAPI.reviewClient(rateJobId, {
                      rating: clientRating,
                      comment: clientReview,
                    });
                    setShowRateModal(false);
                    setClientRating(5);
                    setClientReview("");
                    setRateJobId(null);
                    fetchDashboardData();
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                {t("buttons.submit")}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Notifications Modal */}
        <Modal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          title={t("modals.notifications.title")}
          size="md"
        >
          <div className="space-y-4">
            {notifications.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <Card
                    key={notification._id}
                    className={`p-4 ${!notification.isRead ? "bg-blue-50 border-blue-200" : ""}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getNotificationIcon(notification.type)}
                          <Badge
                            variant={getNotificationBadgeVariant(
                              notification.type,
                            )}
                            size="sm"
                          >
                            {notification.title}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-gray-900 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(
                            new Date(notification.createdAt),
                            { addSuffix: true },
                          )}
                        </p>
                        {notification.actionButton && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                notification.actionButton?.url,
                                "_blank",
                              )
                            }
                            className="mt-2"
                          >
                            {notification.actionButton.text}
                          </Button>
                        )}
                      </div>
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-gray-500 hover:text-gray-700"
                        aria-label="Mark as read"
                      >
                        ✓
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("modals.notifications.empty.title")}
                </h3>
                <p className="text-gray-600">
                  {t("modals.notifications.empty.message")}
                </p>
              </div>
            )}

            {unreadCount > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleMarkAllAsRead}
                >
                  {t("buttons.markAllRead")}
                </Button>
              </div>
            )}
          </div>
        </Modal>

        {/* Dispute Modal */}
        <Modal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedJobForDispute(null);
            setDisputeData({
              title: "",
              description: "",
              type: "payment",
              priority: "medium",
              evidence: [],
            });
          }}
          title="Raise a Dispute"
          size="lg"
        >
          {selectedJobForDispute && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                <p className="text-gray-700">{selectedJobForDispute.title}</p>
                <p className="text-sm text-gray-500">
                  Budget: ETB {selectedJobForDispute.budget?.toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dispute Title
                  </label>
                  <input
                    type="text"
                    value={disputeData.title}
                    onChange={(e) =>
                      setDisputeData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief title describing the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={disputeData.description}
                    onChange={(e) =>
                      setDisputeData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description of the issue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={disputeData.type}
                      onChange={(e) =>
                        setDisputeData((prev) => ({
                          ...prev,
                          type: e.target.value as typeof disputeData.type,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="payment">Payment Issue</option>
                      <option value="quality">Quality Issue</option>
                      <option value="communication">Communication Issue</option>
                      <option value="deadline">Deadline Issue</option>
                      <option value="scope">Scope Issue</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={disputeData.priority}
                      onChange={(e) =>
                        setDisputeData((prev) => ({
                          ...prev,
                          priority: e.target
                            .value as typeof disputeData.priority,
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evidence
                  </label>
                  <div className="space-y-2">
                    {disputeData.evidence.map((evidence, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {evidence.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {evidence.type}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDisputeData((prev) => ({
                              ...prev,
                              evidence: prev.evidence.filter(
                                (_, i) => i !== index,
                              ),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Here you would typically open a file picker or evidence upload modal
                        // For now, we'll just add a dummy evidence item
                        setDisputeData((prev) => ({
                          ...prev,
                          evidence: [
                            ...prev.evidence,
                            {
                              type: "document",
                              url: "https://example.com/evidence.pdf",
                              description: "Supporting document",
                            },
                          ],
                        }));
                      }}
                    >
                      Add Evidence
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setSelectedJobForDispute(null);
                    setDisputeData({
                      title: "",
                      description: "",
                      type: "payment",
                      priority: "medium",
                      evidence: [],
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await workerAPI.createDispute({
                        ...disputeData,
                        job: selectedJobForDispute._id,
                      });
                      setShowDisputeModal(false);
                      setSelectedJobForDispute(null);
                      setDisputeData({
                        title: disputeData.title,
                        description: disputeData.description,
                        type: disputeData.type,
                        priority: disputeData.priority,
                        evidence: disputeData.evidence,
                      });
                      fetchDashboardData(); // Refresh the dashboard data
                      alert("Dispute created successfully");
                    } catch (error) {
                      console.error("Failed to create dispute:", error);
                      alert("Failed to create dispute. Please try again.");
                    }
                  }}
                  disabled={!disputeData.title || !disputeData.description}
                >
                  Submit Dispute
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Chat Modal */}
        <Modal
          isOpen={!!chatJobId}
          onClose={() => setChatJobId(null)}
          title={t("modals.chat.title")}
          size="xl"
          scrollContent={false}
        >
          <div className="flex flex-col h-[70vh] w-full max-w-[900px]">
            <div className="flex items-center justify-between mb-3 px-2">
              <div className="text-sm text-gray-500">
                {t("modals.chat.guidance")}
              </div>
            </div>
            <div
              ref={chatScrollRef}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={async (e) => {
                e.preventDefault();
                const files = e.dataTransfer?.files;
                if (!files) return;
                const list = Array.from(files).slice(
                  0,
                  5 - chatAttachments.length,
                );
                const reads = await Promise.all(
                  list.map(
                    (f) =>
                      new Promise<PendingAttachment>((res) => {
                        const r = new FileReader();
                        r.onload = () =>
                          res({
                            name: f.name,
                            type: f.type,
                            size: f.size,
                            dataUrl: String(r.result),
                          });
                        r.readAsDataURL(f);
                      }),
                  ),
                );
                setChatAttachments((prev) => [...prev, ...reads]);
              }}
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-3 bg-gradient-to-b from-blue-50/40 to-white rounded-lg border px-4 py-3"
              id="worker-chat-scroll"
            >
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm max-w-md ${m.sender?.role === "worker" ? "bg-blue-50 ml-auto border border-blue-200" : "bg-gray-100 border border-gray-200"}`}
                >
                  <p className="font-medium mb-1 text-blue-700">
                    {m.sender?.name || "You"}
                  </p>
                  <p className="whitespace-pre-wrap text-gray-800">
                    {m.content}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-400">
                    {new Date(m.sentAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="text-xs text-gray-400">
                  {t("modals.chat.empty")}
                </div>
              )}
            </div>
            {chatAttachments.length > 0 && (
              <div className="mt-2 border rounded bg-white p-2">
                <div className="text-xs text-gray-500 mb-2">
                  {t("modals.chat.attachments.title")} ({chatAttachments.length}
                  /5)
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {chatAttachments.map((a, idx) => (
                    <div key={idx} className="relative group">
                      {a.type.startsWith("image") ? (
                        <Image
                          src={a.dataUrl}
                          alt={a.name}
                          width={80}
                          height={80}
                          className="h-20 w-full object-cover rounded"
                          style={{ objectFit: "cover", borderRadius: "0.5rem" }}
                          unoptimized
                        />
                      ) : (
                        <div className="h-20 rounded border bg-gray-50 flex items-center justify-center text-xs text-gray-600">
                          <FileText className="h-4 w-4 mr-1" />
                          {a.name.slice(0, 10)}
                        </div>
                      )}
                      <button
                        className="absolute -top-2 -right-2 bg-white border rounded-full p-0.5 shadow hidden group-hover:block"
                        onClick={() =>
                          setChatAttachments((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3 flex gap-2 items-center border-t pt-3 bg-white">
              <label className="inline-flex items-center gap-1 px-2 py-1 border rounded cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
                <Paperclip className="h-4 w-4" />
                {t("modals.chat.attachments.button")}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []).slice(
                      0,
                      5 - chatAttachments.length,
                    );
                    const reads = await Promise.all(
                      files.map(
                        (f) =>
                          new Promise<PendingAttachment>((res) => {
                            const r = new FileReader();
                            r.onload = () =>
                              res({
                                name: f.name,
                                type: f.type,
                                size: f.size,
                                dataUrl: String(r.result),
                              });
                            r.readAsDataURL(f);
                          }),
                      ),
                    );
                    setChatAttachments((prev) => [...prev, ...reads]);
                  }}
                />
              </label>
              <div className="flex-1 flex items-center gap-2">
                <input
                  ref={chatInputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    const files: File[] = [];
                    for (let i = 0; i < items.length; i++) {
                      const it = items[i];
                      if (it.kind === "file") {
                        const f = it.getAsFile();
                        if (f) files.push(f);
                      }
                    }
                    if (files.length > 0) {
                      const dt = new DataTransfer();
                      files.forEach((f) => dt.items.add(f));
                      (async () => {
                        const list = Array.from(dt.files).slice(
                          0,
                          5 - chatAttachments.length,
                        );
                        const reads = await Promise.all(
                          list.map(
                            (f) =>
                              new Promise<PendingAttachment>((res) => {
                                const r = new FileReader();
                                r.onload = () =>
                                  res({
                                    name: f.name,
                                    type: f.type,
                                    size: f.size,
                                    dataUrl: String(r.result),
                                  });
                                r.readAsDataURL(f);
                              }),
                          ),
                        );
                        setChatAttachments((prev) => [...prev, ...reads]);
                      })();
                    }
                  }}
                  placeholder={t("modals.chat.attachments.placeholder")}
                  className="flex-1 border rounded-full px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="relative">
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowEmoji((v) => !v)}
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  {showEmoji && (
                    <div className="absolute bottom-12 right-0 w-64 max-h-56 overflow-y-auto bg-white border rounded-xl shadow-2xl p-2 grid grid-cols-8 sm:grid-cols-10 gap-2 text-xl z-10">
                      {[
                        "😀",
                        "😁",
                        "😂",
                        "🤣",
                        "😊",
                        "😍",
                        "😘",
                        "😇",
                        "🙂",
                        "😉",
                        "😌",
                        "😎",
                        "🤩",
                        "🫶",
                        "👍",
                        "🙏",
                        "👏",
                        "💪",
                        "🎉",
                        "🔥",
                        "✨",
                        "💡",
                        "📌",
                        "📎",
                        "📷",
                        "📝",
                        "🤝",
                        "🤔",
                        "😅",
                        "😴",
                        "😢",
                        "😤",
                      ].map((e) => (
                        <button
                          key={e}
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => {
                            const el = chatInputRef.current;
                            const emoji = e as string;
                            if (!el) {
                              setNewMessage((p) => p + emoji);
                              return;
                            }
                            const s = el.selectionStart || 0;
                            const d = el.selectionEnd || 0;
                            const next =
                              newMessage.slice(0, s) +
                              emoji +
                              newMessage.slice(d);
                            setNewMessage(next);
                            requestAnimationFrame(() => {
                              el.focus();
                              const c = s + emoji.length;
                              el.setSelectionRange(c, c);
                            });
                          }}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button disabled={sending} onClick={sendChat}>
                {t("buttons.send")}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default WorkerDashboard;
