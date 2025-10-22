"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  FileText,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { workerAPI, jobsAPI, notificationsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import BackToDashboard from "@/components/ui/BackToDashboard";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";
import UniversalChatSystem from "@/components/ui/UniversalChatSystem";
import { useWorkerDashboardData } from "@/hooks/useDashboardData";
import { queryClient } from "@/lib/queryClient";
import WithDashboardLoading from "@/components/hoc/WithDashboardLoading";

const WorkerDashboard: React.FC = () => {
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
    location?: string;
    acceptedApplication?: { proposedBudget?: number };
    applicationCount?: number;
    review?: { workerReview?: { rating?: number } };
  }

  // Use React Query hook for data fetching with caching
  const { data, isLoading } = useWorkerDashboardData();

  const stats = data?.stats || null;
  const availableJobs = data?.availableJobs || [];
  const myJobsMemo = useMemo(() => data?.myJobs || [], [data?.myJobs]);
  const appliedJobIds = data?.appliedJobIds || new Set();
  const earnings = data?.earnings || null;
  const [notifications, setNotifications] = useState<
    {
      _id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      readAt?: string;
      createdAt: string;
      priority: "low" | "medium" | "high" | "urgent";
      actionButton?: { text: string; url: string; action: string };
      sender?: { _id: string; name: string; profile?: { avatar?: string } };
      relatedJob?: { _id: string; title: string };
      relatedUser?: { _id: string; name: string };
    }[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const loading = isLoading;

  const [selectedJob, setSelectedJob] = useState<SimpleJob | null>(null);
  const [applicationData, setApplicationData] = useState<{
    proposal: string;
    proposedBudget: string;
    estimatedDuration?: string;
  }>({ proposal: "", proposedBudget: "" });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [chatJobId, setChatJobId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    {
      _id?: string;
      content: string;
      sender?: { name?: string; role?: string };
      sentAt: string;
    }[]
  >([]);
  const [modernChatMessages, setModernChatMessages] = useState<
    Array<{
      id: string;
      senderId: string;
      senderName: string;
      content: string;
      timestamp: string;
      attachments?: Array<{
        id: string;
        name: string;
        url: string;
        type: string;
      }>;
    }>
  >([]);
  const [currentJob, setCurrentJob] = useState<SimpleJob | null>(null);
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
  const [disputes] = useState<
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
  const [jobsForYou, setJobsForYou] = useState<SimpleJob[]>([]);
  const [jobsForYouLoading, setJobsForYouLoading] = useState(false);
  const router = useRouter();
  const PROPOSAL_MAX = 1200;
  const t = useTranslations("WorkerDashboard");

  useEffect(() => {
    const user = getStoredUser();
    console.log("Dashboard - stored user:", user);
    if (!user || !hasRole(user, ["worker"])) {
      console.log("Dashboard - redirecting to login, user role:", user?.role);
      router.push("/login");
      return;
    }

    fetchJobsForYou();
  }, [router]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["workerDashboard"] });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchJobsForYou = async () => {
    try {
      setJobsForYouLoading(true);
      const response = await workerAPI.getJobsForYou({ limit: 5 });
      const payload = response.data;
      const list = (payload.data || []) as unknown as Array<
        Record<string, unknown>
      >;
      setJobsForYou(
        list.map((j) => ({
          _id: String(j._id),
          title: String(j.title || ""),
          description: String(j.description || ""),
          budget: Number(j.budget || 0),
          deadline: String(j.deadline || ""),
          category: String(j.category || ""),
          region: j.region as { name?: string } | undefined,
          status: String(j.status || ""),
          progress: Number(j.progress || 0),
          location: String(j.location || ""),
          acceptedApplication: j.acceptedApplication as
            | {
                proposedBudget?: number;
              }
            | undefined,
          applicationCount: Number(j.applicationCount || 0),
          review: j.review as
            | { workerReview?: { rating?: number } }
            | undefined,
        })),
      );
    } catch (error) {
      console.error("Failed to fetch jobs for you:", error);
      setJobsForYou([]);
    } finally {
      setJobsForYouLoading(false);
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
      queryClient.invalidateQueries({ queryKey: ["workerDashboard"] }); // Refresh data
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
      queryClient.invalidateQueries({ queryKey: ["workerDashboard"] }); // Refresh data
    } catch (error) {
      console.error("Failed to update job status:", error);
    }
  };

  const normalizeChatMessage = useCallback(
    (
      message: {
        _id?: string;
        sender?: { name?: string; role?: string; _id?: string };
        content: string;
        sentAt: string;
        attachments?: string[];
      },
      fallbackIndex: number,
    ) => {
      const attachments = Array.isArray(message.attachments)
        ? message.attachments.map((url, index) => {
            const isImage =
              /^data:image\//.test(url) ||
              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
            const nameFromUrl = decodeURIComponent(url.split("/").pop() || "");
            return {
              id: `${message._id || fallbackIndex}-att-${index}`,
              name: nameFromUrl || `Attachment ${index + 1}`,
              url,
              type: isImage ? "image/*" : "application/octet-stream",
            };
          })
        : [];

      const senderRole = message.sender?.role;
      const userId = getStoredUser()?._id || "worker";
      const senderId =
        message.sender?._id?.toString?.() ||
        (senderRole === "worker" ? userId : "client");
      const senderName =
        message.sender?.name || (senderRole === "worker" ? "You" : "Client");

      return {
        id: message._id || `msg-${fallbackIndex}`,
        senderId,
        senderName,
        content: message.content,
        timestamp: message.sentAt,
        attachments,
      };
    },
    [],
  );

  const fileToDataUrl = useCallback(
    (file: File, onProgress?: (value: number) => void) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") {
            resolve(result);
          } else {
            reject(new Error("Unable to read file"));
          }
        };
        reader.onerror = () =>
          reject(reader.error || new Error("File read failed"));
        reader.onprogress = (event) => {
          if (!onProgress) return;
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        reader.readAsDataURL(file);
      }),
    [],
  );

  const openChat = useCallback(
    async (jobId: string) => {
      try {
        setChatJobId(jobId);

        const job = myJobsMemo.find((j: SimpleJob) => j._id === jobId);
        setCurrentJob(job ?? null);

        const res = await workerAPI.getJobMessages(jobId);
        const messages = (res.data.data || []) as Array<{
          _id?: string;
          sender?: { name?: string; role?: string; _id?: string };
          content: string;
          sentAt: string;
          attachments?: string[];
        }>;

        setChatMessages(messages);

        const convertedMessages = messages.map((message, index) =>
          normalizeChatMessage(message, index),
        );
        convertedMessages.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        setModernChatMessages(convertedMessages);
      } catch (e) {
        console.error(e);
      }
    },
    [myJobsMemo, normalizeChatMessage],
  );

  const sendModernMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (!chatJobId) return;
      const trimmed = content.trim();
      const hasAttachments = Boolean(files && files.length);
      if (!trimmed && !hasAttachments) return;

      const userId = getStoredUser()?._id || "worker";
      const pendingId = `pending-${Date.now()}`;
      const tempAttachmentUrls: string[] = [];
      const optimisticAttachments = (files || []).map((file, index) => {
        const url = URL.createObjectURL(file);
        tempAttachmentUrls.push(url);
        return {
          id: `${pendingId}-att-${index}`,
          name: file.name,
          url,
          type: file.type || "application/octet-stream",
        };
      });

      const optimisticMessage = {
        id: pendingId,
        senderId: userId,
        senderName: "You",
        content: trimmed,
        timestamp: new Date().toISOString(),
        attachments: optimisticAttachments,
        uploadProgress: hasAttachments ? 5 : undefined,
      };

      setModernChatMessages((prev) => [...prev, optimisticMessage]);

      const updateMessageProgress = (value: number) => {
        if (!hasAttachments) return;
        const bounded = Math.max(1, Math.min(99, Math.round(value)));
        setModernChatMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? { ...message, uploadProgress: bounded }
              : message,
          ),
        );
      };

      try {
        let attachmentDataUrls: string[] | undefined;
        if (hasAttachments && files) {
          const total = files.length;
          attachmentDataUrls = [];
          for (let index = 0; index < total; index += 1) {
            const file = files[index];
            const dataUrl = await fileToDataUrl(file, (progress) => {
              const base = index / total;
              const combined = base + (progress / 100) * (1 / total);
              updateMessageProgress(10 + combined * 60);
            });
            attachmentDataUrls.push(dataUrl);
          }
          updateMessageProgress(70);
        }

        const response = await workerAPI.sendJobMessage(
          chatJobId,
          trimmed,
          attachmentDataUrls,
          hasAttachments
            ? {
                onUploadProgress: (event) => {
                  if (!event.total) {
                    updateMessageProgress(90);
                    return;
                  }
                  const ratio = event.loaded / event.total;
                  updateMessageProgress(70 + ratio * 25);
                },
              }
            : undefined,
        );

        const apiMessage = response.data?.data as {
          _id?: string;
          sender?: { name?: string; role?: string; _id?: string };
          content: string;
          sentAt: string;
          attachments?: string[];
        } | null;

        if (apiMessage) {
          if (hasAttachments) {
            updateMessageProgress(100);
          }
          const savedMessage = normalizeChatMessage(apiMessage, 0);
          setModernChatMessages((prev) =>
            prev.map((message) =>
              message.id === pendingId ? savedMessage : message,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        setModernChatMessages((prev) =>
          prev.filter((message) => message.id !== pendingId),
        );
        throw error;
      } finally {
        tempAttachmentUrls.forEach((url) => URL.revokeObjectURL(url));
      }
    },
    [chatJobId, fileToDataUrl, normalizeChatMessage],
  );

  useEffect(() => {
    if (!chatJobId) return;
    const interval = setInterval(() => {
      workerAPI
        .getJobMessages(chatJobId)
        .then((res) => {
          const messages = (res.data.data || []) as Array<{
            _id?: string;
            sender?: { name?: string; role?: string; _id?: string };
            content: string;
            sentAt: string;
            attachments?: string[];
          }>;
          setChatMessages(messages);

          const converted = messages.map((message, index) =>
            normalizeChatMessage(message, index),
          );
          converted.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
          setModernChatMessages((prev) => {
            const pending = prev.filter((message) =>
              message.id.startsWith("pending-"),
            );
            const merged = [...converted, ...pending];
            merged.sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );
            return merged;
          });
        })
        .catch(() => {
          /* ignore polling errors */
        });
    }, 4000);
    return () => clearInterval(interval);
  }, [chatJobId, normalizeChatMessage]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el =
      chatScrollRef.current || document.getElementById("worker-chat-scroll");
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [chatMessages]);

  const acceptAssignment = async (jobId: string) => {
    await workerAPI.acceptAssignedJob(jobId);
    queryClient.invalidateQueries({ queryKey: ["workerDashboard"] });
  };
  const declineAssignment = async (jobId: string) => {
    await workerAPI.declineAssignedJob(jobId);
    queryClient.invalidateQueries({ queryKey: ["workerDashboard"] });
  };

  return (
    <WithDashboardLoading isLoading={loading}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <BackToDashboard
                  currentRole="worker"
                  variant="breadcrumb"
                  className="mb-2"
                />
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
                  <span className="hidden sm:inline">
                    {t("buttons.wallet")}
                  </span>
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

            {/* CV Completion Percentage */}
            <Card className="bg-teal-50 border-teal-200">
              <div className="text-center">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-teal-600 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm font-medium text-teal-600">
                  CV Completion
                </p>
                <p className="text-lg sm:text-2xl font-bold text-teal-900">
                  {(() => {
                    const user = getStoredUser();
                    if (!user?.profile) return "0%";

                    let completedFields = 0;
                    let totalFields = 0;

                    // Personal info fields
                    const personalFields = [
                      user.profile.firstName,
                      user.profile.lastName,
                      user.profile.bio,
                      user.profile.phone,
                      user.profile.address?.city,
                      user.profile.experience,
                      (user.profile.hourlyRate ?? 0) > 0,
                      user.profile.dob,
                      user.profile.gender,
                    ];

                    totalFields += personalFields.length;
                    completedFields += personalFields.filter(Boolean).length;

                    // Worker profile fields
                    if (user.workerProfile) {
                      const workerFields = [
                        (user.workerProfile.education?.length ?? 0) > 0,
                        (user.workerProfile.workHistory?.length ?? 0) > 0,
                      ];
                      totalFields += workerFields.length;
                      completedFields += workerFields.filter(Boolean).length;
                    }

                    const percentage =
                      totalFields > 0
                        ? Math.round((completedFields / totalFields) * 100)
                        : 0;
                    return `${percentage}%`;
                  })()}
                </p>
              </div>
            </Card>
          </div>

          {/* Profile Completion Call-to-Action */}
          {(() => {
            const user = getStoredUser();
            if (!user?.profile) return null;

            let completedFields = 0;
            let totalFields = 0;

            // Personal info fields
            const personalFields = [
              user.profile.firstName,
              user.profile.lastName,
              user.profile.bio,
              user.profile.phone,
              user.profile.address?.city,
              user.profile.experience,
              (user.profile.hourlyRate ?? 0) > 0,
              user.profile.dob,
              user.profile.gender,
            ];

            totalFields += personalFields.length;
            completedFields += personalFields.filter(Boolean).length;

            // Worker profile fields
            if (user.workerProfile) {
              const workerFields = [
                (user.workerProfile.education?.length ?? 0) > 0,
                (user.workerProfile.workHistory?.length ?? 0) > 0,
              ];
              totalFields += workerFields.length;
              completedFields += workerFields.filter(Boolean).length;
            }

            const percentage =
              totalFields > 0
                ? Math.round((completedFields / totalFields) * 100)
                : 0;

            if (percentage < 80) {
              return (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-900">
                          Complete Your Profile to Stand Out
                        </h3>
                        <p className="text-sm text-blue-700">
                          Your profile is {percentage}% complete. Add more
                          information to increase your chances of getting hired.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push("/profile")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Complete Profile
                    </Button>
                  </div>
                  <div className="mt-4">
                    <ProgressBar
                      progress={percentage}
                      className="h-2"
                      showPercentage={false}
                      size="sm"
                    />
                  </div>
                </Card>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-8">
              {/* Jobs for You Section - Only show for workers with matching jobs */}
              {jobsForYou.length > 0 && (
                <Card className="h-fit">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                      {t("jobsForYou.title")}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push("/jobs")}
                      className="w-full sm:w-auto"
                    >
                      {t("jobsForYou.viewAll")}
                    </Button>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {jobsForYouLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      jobsForYou.slice(0, 5).map((job) => (
                        <div
                          key={job._id}
                          className="p-3 sm:p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                              {job.title}
                            </h4>
                            <div className="text-left sm:text-right">
                              <span className="text-sm font-semibold text-green-600 block">
                                ETB {job.budget?.toLocaleString()}
                              </span>
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
                              <span className="sm:hidden block">
                                {job.category}
                              </span>
                              <span className="hidden sm:inline">
                                {job.category}
                              </span>
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
                      ))
                    )}
                  </div>
                </Card>
              )}

              {/* My Active Jobs */}
              <Card className="h-fit">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t("sections.activeJobs.title")}
                  </h3>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  {myJobsMemo
                    .filter(
                      (job: SimpleJob) =>
                        job.status &&
                        [
                          "assigned",
                          "in_progress",
                          "revision_requested",
                          "completed",
                          "disputed",
                        ].includes(job.status),
                    )
                    .map((job: SimpleJob) => (
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

                          {/* Status-based action buttons */}
                          <div className="flex flex-wrap gap-2">
                            {/* Worker can Decline and Accept Assignment if job is assigned */}
                            {job.status === "assigned" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => declineAssignment(job._id)}
                                  className="flex-1 sm:flex-none text-red-600 hover:bg-red-50 border-red-600"
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

                            {/* Worker can Submit Work if job is in progress */}
                            {job.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleUpdateJobStatus(job._id, "submitted")
                                }
                                className="w-full sm:w-auto"
                              >
                                <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="text-xs sm:text-sm">
                                  {t("sections.activeJobs.actions.submitWork")}
                                </span>
                              </Button>
                            )}

                            {/* Worker can Resubmit Work if job is revision requested */}
                            {job.status === "revision_requested" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateJobStatus(job._id, "submitted")
                                }
                                className="w-full sm:w-auto"
                              >
                                <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="text-xs sm:text-sm">
                                  {t(
                                    "sections.activeJobs.actions.resubmitWork",
                                  )}
                                </span>
                              </Button>
                            )}

                            {/* Worker can Raise Dispute if in progress, submitted, or revision requested */}
                            {(job.status === "in_progress" ||
                              job.status === "submitted" ||
                              job.status === "revision_requested") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedJobForDispute(job);
                                  setShowDisputeModal(true);
                                }}
                                className="text-red-600 hover:bg-red-50 "
                              >
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                {t("sections.activeJobs.actions.raiseDispute")}
                              </Button>
                            )}

                            {/* Worker can Rate Client if job is completed */}
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
                                    {t(
                                      "sections.activeJobs.actions.rateClient",
                                    )}
                                  </span>
                                </Button>
                              )}

                            {/* Chat button to view messages*/}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openChat(job._id)}
                              className="flex-1 sm:flex-none"
                              title={t(
                                "sections.activeJobs.actions.viewMessages",
                              )}
                            >
                              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              {/* Available Jobs */}
              <Card className="h-fit">
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
                <div className="space-y-3 sm:space-y-4">
                  {availableJobs.map((job) => (
                    <div
                      key={job._id}
                      className="p-3 sm:p-4 bg-gray-50 rounded-lg"
                    >
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
                          <span className="sm:hidden block">
                            {job.category}
                          </span>
                          <span className="hidden sm:inline">
                            {job.category}
                          </span>
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

              {/* Pending Applications */}
              <Card className="h-fit">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  {t("sections.activeJobs.pendingApplications.title")}
                </h3>
                {stats?.pendingApplicationsList?.length ? (
                  <div className="space-y-2 sm:space-y-3">
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

              {/* Active Disputes */}
              <Card className="h-fit">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Active Disputes
                  </h3>
                </div>
                <div className="space-y-4">
                  {disputes
                    .filter(
                      (d) => d.status !== "resolved" && d.status !== "closed",
                    )
                    .map((dispute) => (
                      <div
                        key={dispute._id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
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
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">
                        {selectedJob.location || "No location specified"}
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
                          <p className="text-sm text-gray-500">
                            {payment.date}
                          </p>
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
                  onClick={() => toast(t("modals.wallet.withdrawalFeature"))}
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
                      queryClient.invalidateQueries({
                        queryKey: ["workerDashboard"],
                      });
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
                  <h4 className="font-medium text-gray-900 mb-2">
                    Job Details
                  </h4>
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
                        <option value="communication">
                          Communication Issue
                        </option>
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
                        queryClient.invalidateQueries({
                          queryKey: ["workerDashboard"],
                        }); // Refresh the dashboard data
                        toast.success("Dispute created successfully");
                      } catch (error) {
                        console.error("Failed to create dispute:", error);
                        toast.error(
                          "Failed to create dispute. Please try again.",
                        );
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

          {/* OLD CHAT MODAL REMOVED - Using UniversalChatSystem instead */}

          {/* Universal Chat System for Worker */}
          {currentJob && (
            <UniversalChatSystem
              isOpen={!!chatJobId}
              onClose={() => {
                setChatJobId(null);
                setCurrentJob(null);
                setModernChatMessages([]);
              }}
              onSendMessage={sendModernMessage}
              messages={modernChatMessages}
              currentUserId={getStoredUser()?._id || "worker"}
              recipientName="Client"
              recipientRole="client"
              mode="chat"
              title={`Job Chat - ${currentJob.title}`}
              placeholder="Type your message to the client..."
            />
          )}
        </div>
      </div>
    </WithDashboardLoading>
  );
};

export default WorkerDashboard;
