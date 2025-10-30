"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  RefreshCcw,
  UploadCloud,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FilePenLine,
  BarChart3,
  MessageSquarePlus,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import BackToDashboard from "@/components/ui/BackToDashboard";
import { useTranslations } from "next-intl";
import { useAdminDashboardData } from "@/hooks/useDashboardData";
import { queryClient } from "@/lib/queryClient";
import WithDashboardLoading from "@/components/hoc/WithDashboardLoading";
import { toast } from "@/components/ui/sonner";

interface OrgStructureDoc {
  id?: string;
  filename?: string;
  url?: string;
  size?: number;
  contentType?: string;
  version?: number;
  updatedAt?: string;
  createdAt?: string;
}

const formatBytes = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes) || bytes <= 0) {
    return undefined;
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const formatted =
    value < 10 && unitIndex > 0 ? value.toFixed(1) : value.toFixed(0);
  return `${formatted} ${units[unitIndex]}`;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return undefined;
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
};

const AdminDashboard: React.FC = () => {
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [reportType, setReportType] = useState("revenue");
  const router = useRouter();
  const t = useTranslations("AdminDashboard");

  // Use React Query hook for data fetching with caching
  const { data, isLoading } = useAdminDashboardData();

  const stats = data?.stats || null;
  const recentUsers = data?.recentUsers || [];
  const recentJobs = data?.recentJobs || [];
  const disputes = data?.disputes || [];
  const loading = isLoading;
  const [orgDoc, setOrgDoc] = useState<OrgStructureDoc | null>(null);
  const [orgDocLoading, setOrgDocLoading] = useState(false);
  const [orgDocRefreshing, setOrgDocRefreshing] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const [showOrgPdf, setShowOrgPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadOrgStructure = useCallback(
    async (options?: { silent?: boolean; suppressToast?: boolean }) => {
      const silent = options?.silent ?? false;
      const suppressToast = options?.suppressToast ?? false;
      if (!silent) {
        setOrgDocLoading(true);
      }

      try {
        const response = await adminAPI.getOrgStructureDocument();
        setOrgDoc(response.data?.data || null);
      } catch (error) {
        const status = (
          error as {
            response?: { status?: number; data?: { message?: string } };
          }
        )?.response?.status;
        if (status === 404) {
          setOrgDoc(null);
        } else {
          console.error("Failed to load organizational structure PDF", error);
          if (!suppressToast) {
            const message =
              (error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ||
              "Failed to load organizational structure PDF.";
            toast.error(message);
          }
        }
      } finally {
        if (!silent) {
          setOrgDocLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadOrgStructure({ suppressToast: true });
  }, [loadOrgStructure]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedPdf(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Please select a PDF file.");
      event.target.value = "";
      setSelectedPdf(null);
      return;
    }

    setSelectedPdf(file);
  };

  const handleUploadPdf = async () => {
    if (!selectedPdf) {
      toast.error("Choose a PDF to upload.");
      return;
    }

    setUploadingPdf(true);
    try {
      await adminAPI.uploadOrgStructurePdf(selectedPdf);
      toast.success("Organizational structure PDF uploaded successfully.");
      setSelectedPdf(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await loadOrgStructure({ silent: true });
    } catch (error) {
      console.error("Failed to upload organizational structure PDF", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to upload PDF.";
      toast.error(message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleDeletePdf = async () => {
    if (!orgDoc) {
      toast.error("No PDF to delete.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete the current organizational structure PDF?",
    );
    if (!confirmed) {
      return;
    }

    setDeletingPdf(true);
    try {
      await adminAPI.deleteOrgStructurePdf();
      toast.success("Organizational structure PDF deleted.");
      setOrgDoc(null);
      setSelectedPdf(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Failed to delete organizational structure PDF", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete PDF.";
      toast.error(message);
    } finally {
      setDeletingPdf(false);
    }
  };

  const handleRefreshPdf = async () => {
    setOrgDocRefreshing(true);
    try {
      await loadOrgStructure({ silent: true });
      toast.success("Organizational structure PDF metadata refreshed.");
    } finally {
      setOrgDocRefreshing(false);
    }
  };

  const toggleOrgPdfSection = () => {
    if (!showOrgPdf) {
      loadOrgStructure({ suppressToast: true });
    }
    setShowOrgPdf((prev) => !prev);
  };

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["super_admin"])) {
      router.push("/login");
      return;
    }
  }, [router]);

  const handleVerifyWorker = async (workerId: string) => {
    try {
      await adminAPI.verifyWorker(workerId);
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] }); // Refresh data
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

      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] }); // Refresh data
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

  const orgDocUpdatedAtLabel = formatDateTime(
    orgDoc?.updatedAt || orgDoc?.createdAt,
  );
  const orgDocSizeLabel = formatBytes(orgDoc?.size);

  return (
    <WithDashboardLoading isLoading={loading}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <BackToDashboard
                  currentRole="admin_hr"
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
                  variant="primary"
                  onClick={() => router.push("/admin/chat")}
                  className="w-full sm:w-auto transition-transform hover:-translate-y-0.5"
                  size="sm"
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Team Chat
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowReportsModal(true)}
                  className="w-full sm:w-auto transition-transform hover:-translate-y-0.5"
                  size="sm"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {t("header.buttons.generateReports")}
                  </span>
                  <span className="sm:hidden">Reports</span>
                </Button>
                {disputes.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full sm:w-auto transition-transform hover:-translate-y-0.5"
                    size="sm"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">
                      {t("header.buttons.resolveDisputes")} ({disputes.length})
                    </span>
                    <span className="sm:hidden">
                      Disputes ({disputes.length})
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-blue-600">
                    {t("stats.totalUsers.label")}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-900">
                    {stats?.totalUsers || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-green-600">
                    {t("stats.totalJobs.label")}
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-green-900">
                    {stats?.totalJobs || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-yellow-600">
                    {t("stats.totalRevenue.label")}
                  </p>
                  <p className="text-sm sm:text-2xl font-bold text-yellow-900">
                    ETB {stats?.totalRevenue?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-purple-600">
                    {t("stats.monthlyGrowth.label")}
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {stats?.monthlyGrowth || 0}%
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Activity Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("activity.activeJobs.label")}
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {stats?.activeJobs || 0}
                  </p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("activity.completedJobs.label")}
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {stats?.completedJobs || 0}
                  </p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("activity.pendingVerifications.label")}
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900">
                    {stats?.pendingVerifications || 0}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Recent Users */}
            <Card>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {t("recentUsers.title")}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/users")}
                >
                  {t("recentUsers.viewAll")}
                </Button>
              </div>
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge
                          variant={
                            user.role === "super_admin"
                              ? "purple"
                              : user.role === "admin_hr" ||
                                  user.role === "admin_outsource"
                                ? "blue"
                                : user.role === "worker"
                                  ? "teal"
                                  : "orange"
                          }
                          size="sm"
                        >
                          {user.role.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={user.isVerified ? "success" : "gray"}
                          size="sm"
                        >
                          {user.isVerified
                            ? t("recentUsers.tags.verified")
                            : t("recentUsers.tags.unverified")}
                        </Badge>
                        <Badge
                          variant={
                            user.isActive === false ? "danger" : "success"
                          }
                          size="sm"
                        >
                          {user.isActive === false
                            ? t("recentUsers.tags.inactive")
                            : t("recentUsers.tags.active")}
                        </Badge>
                      </div>
                    </div>
                    {user.role === "worker" && !user.isVerified && (
                      <Button
                        size="sm"
                        onClick={() => handleVerifyWorker(user._id)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        {t("recentUsers.buttons.verify")}
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
                  {t("recentJobs.title")}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/jobs")}
                >
                  {t("recentJobs.viewAll")}
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
                      {t("recentJobs.fields.amount")}{" "}
                      {job.budget?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t("recentJobs.fields.posted")}{" "}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                {t("quickActions.title")}
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Button
                  variant="outline"
                  className="group relative h-auto overflow-hidden rounded-xl border border-blue-200 bg-white p-0 text-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:!bg-gradient-to-r hover:!from-blue-500 hover:!to-indigo-500 hover:text-white hover:shadow-xl"
                  onClick={() => router.push("/admin/users")}
                >
                  <div className="flex h-full w-full flex-col items-center gap-2 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-white/20 group-hover:text-white">
                      <Users className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-semibold">
                      {t("quickActions.buttons.manageUsers")}
                    </span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="group relative h-auto overflow-hidden rounded-xl border border-blue-200 bg-white p-0 text-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:!bg-gradient-to-r hover:!from-blue-500 hover:!to-indigo-500 hover:text-white hover:shadow-xl"
                  onClick={() => router.push("/admin/jobs")}
                >
                  <div className="flex h-full w-full flex-col items-center gap-2 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-white/20 group-hover:text-white">
                      <Briefcase className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-semibold">
                      {t("quickActions.buttons.manageJobs")}
                    </span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="group relative h-auto overflow-hidden rounded-xl border border-blue-200 bg-white p-0 text-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-transparent hover:!bg-gradient-to-r hover:!from-blue-500 hover:!to-indigo-500 hover:text-white hover:shadow-xl"
                  onClick={() => router.push("/admin/payments")}
                >
                  <div className="flex h-full w-full flex-col items-center gap-2 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-white/20 group-hover:text-white">
                      <DollarSign className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-semibold">
                      {t("quickActions.buttons.paymentDisputes")}
                    </span>
                  </div>
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={toggleOrgPdfSection}
                aria-expanded={showOrgPdf}
                aria-controls="org-structure-manager"
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50"
              >
                <span className="flex items-center gap-2">
                  <FilePenLine className="h-4 w-4" />
                  Edit Organizational Structure PDF
                </span>
                {showOrgPdf ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <div
                id="org-structure-manager"
                className={`overflow-hidden transition-all duration-300 ease-out ${showOrgPdf ? "pointer-events-auto max-h-[1200px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}`}
              >
                <div
                  className={`mt-4 flex flex-col gap-6 rounded-xl bg-slate-50/60 p-4 ring-1 ring-inset ring-blue-100 transition-all duration-300 lg:flex-row lg:items-start lg:justify-between ${showOrgPdf ? "translate-y-0" : "-translate-y-2"}`}
                >
                  <div className="flex-1 space-y-3">
                    <h4 className="text-base font-semibold text-gray-900">
                      Organizational Structure PDF
                    </h4>
                    {orgDocLoading ? (
                      <p className="text-sm text-gray-600">
                        Loading current PDF metadata...
                      </p>
                    ) : orgDoc ? (
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium text-gray-900">
                            Filename:
                          </span>{" "}
                          {orgDoc.filename || "belimuno-org-structure.pdf"}
                        </p>
                        {orgDoc.version ? (
                          <p>
                            <span className="font-medium text-gray-900">
                              Version:
                            </span>{" "}
                            {orgDoc.version}
                          </p>
                        ) : null}
                        {orgDocSizeLabel ? (
                          <p>
                            <span className="font-medium text-gray-900">
                              File size:
                            </span>{" "}
                            {orgDocSizeLabel}
                          </p>
                        ) : null}
                        {orgDocUpdatedAtLabel ? (
                          <p>
                            <span className="font-medium text-gray-900">
                              Last updated:
                            </span>{" "}
                            {orgDocUpdatedAtLabel}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              window.open(
                                orgDoc.url || "/org-structure",
                                "_blank",
                              )
                            }
                            className="text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open PDF
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/org-structure")}
                            className="text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View live page
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No organizational structure PDF is currently published.
                        Upload a PDF to make it available on the public page.
                      </p>
                    )}
                  </div>

                  <div className="w-full max-w-md space-y-3">
                    <div>
                      <label
                        htmlFor="org-structure-pdf"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Upload PDF
                      </label>
                      <input
                        id="org-structure-pdf"
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                      {selectedPdf ? (
                        <p className="mt-2 text-xs text-gray-500">
                          Selected: {selectedPdf.name} (
                          {formatBytes(selectedPdf.size)})
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">
                          Accepts .pdf, up to 20 MB.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleUploadPdf}
                        loading={uploadingPdf}
                        disabled={!selectedPdf || uploadingPdf}
                        className="flex-1"
                      >
                        <UploadCloud className="h-4 w-4" />
                        Upload / Replace
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRefreshPdf}
                        loading={orgDocRefreshing}
                        className="flex-1"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleDeletePdf}
                        loading={deletingPdf}
                        disabled={!orgDoc || deletingPdf}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reports Modal */}
          <Modal
            isOpen={showReportsModal}
            onClose={() => setShowReportsModal(false)}
            title={t("reports.title")}
            size="md"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("reports.fields.type.label")}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="revenue">
                    {t("reports.fields.type.options.revenue")}
                  </option>
                  <option value="completion">
                    {t("reports.fields.type.options.completion")}
                  </option>
                  <option value="users">
                    {t("reports.fields.type.options.users")}
                  </option>
                  <option value="performance">
                    {t("reports.fields.type.options.performance")}
                  </option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  {t("reports.preview.title")}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    • {t("reports.preview.fields.totalUsers")}:{" "}
                    {stats?.totalUsers || 0}
                  </p>
                  <p>
                    • {t("reports.preview.fields.totalJobs")}:{" "}
                    {stats?.totalJobs || 0}
                  </p>
                  <p>
                    • {t("reports.preview.fields.totalRevenue")}: ETB{" "}
                    {stats?.totalRevenue?.toLocaleString() || 0}
                  </p>
                  <p>
                    • {t("reports.preview.fields.monthlyGrowth")}: +
                    {stats?.monthlyGrowth || 0}%
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowReportsModal(false)}
                >
                  {t("reports.buttons.cancel")}
                </Button>
                <Button onClick={generateReport}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("reports.buttons.download")}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Disputes Modal */}
          <Modal
            isOpen={showDisputeModal}
            onClose={() => setShowDisputeModal(false)}
            title={t("disputes.title")}
            size="lg"
          >
            <div className="space-y-4">
              {disputes.length > 0 ? (
                disputes.map((dispute) => (
                  <Card key={dispute._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {t("disputes.fields.paymentId")}:{" "}
                          {dispute._id?.slice(-6) || "Unknown"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {t("disputes.fields.amount")}: ETB{" "}
                          {dispute.amount?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t("disputes.fields.date")}:{" "}
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="danger">
                        {t("disputes.fields.status")}
                      </Badge>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleResolveDispute(dispute._id, "refund")
                        }
                      >
                        {t("disputes.buttons.refundClient")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleResolveDispute(dispute._id, "release")
                        }
                      >
                        {t("disputes.buttons.payWorker")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleResolveDispute(dispute._id, "investigate")
                        }
                      >
                        {t("disputes.buttons.investigate")}
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t("disputes.empty.title")}
                  </h3>
                  <p className="text-gray-600">{t("disputes.empty.message")}</p>
                </div>
              )}
            </div>
          </Modal>
        </div>
      </div>
    </WithDashboardLoading>
  );
};

export default AdminDashboard;
