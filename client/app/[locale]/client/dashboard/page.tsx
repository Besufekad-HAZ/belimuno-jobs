"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  Users,
  Star,
  Eye,
  CreditCard,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { getStoredUser, hasRole } from "@/lib/auth";
import { clientAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import BackToDashboard from "@/components/ui/BackToDashboard";
import { toast } from "@/components/ui/sonner";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";

interface ClientStats {
  totalJobs: number;
  activeJobs: object[];
  completedJobs: number;
  totalSpent: number;
  averageRating: number;
  pendingApplications: number;
  totalApplications: number;
}

const ClientDashboard: React.FC = () => {
  const [stats, setStats] = useState<ClientStats | null>(null);
  interface ApplicationPreview {
    _id: string;
    proposal: string;
    proposedBudget: number;
    status: string;
    appliedAt: string;
    worker: { name: string };
  }
  interface EnrichedJob {
    _id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    status: string;
    applicationCount?: number;
    recentApplications?: ApplicationPreview[];
    assignedWorker?: { name: string; _id?: string };
    category?: string;
    requirements?: string[];
    acceptedApplication?: { proposedBudget?: number };
    payment?: { paymentStatus?: string };
  }
  const [jobs, setJobs] = useState<EnrichedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<EnrichedJob | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<{
    name: string;
    _id?: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedJobForDispute, setSelectedJobForDispute] =
    useState<EnrichedJob | null>(null);
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

  const t = useTranslations("ClientDashboard");
  const [pendingProof, setPendingProof] = useState<{
    dataUrl: string;
    name?: string;
    type?: string;
  } | null>(null);
  const [recentPaymentId, setRecentPaymentId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["client"])) {
      router.push("/login");
      return;
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardResponse, jobsResponse, disputesResponse] =
        await Promise.all([
          clientAPI.getDashboard(),
          clientAPI.getJobs(),
          clientAPI.getDisputes(),
        ]);

      setStats(dashboardResponse.data.data);
      setJobs(jobsResponse.data.data || []);
      setDisputes(disputesResponse.data.data || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptApplication = async (
    jobId: string,
    applicationId: string,
  ) => {
    try {
      await clientAPI.acceptApplication(jobId, applicationId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to accept application:", error);
    }
  };

  const handleRejectApplication = async (
    jobId: string,
    applicationId: string,
  ) => {
    try {
      await clientAPI.rejectApplication(jobId, applicationId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Failed to reject application:", error);
    }
  };

  // Removed unused handleCompleteJob (handled via payment/rating flow)

  const handleUpdateJobStatus = async (
    jobId: string,
    status: string,
    message?: string,
  ) => {
    try {
      await clientAPI.updateJobStatus(jobId, status);

      // If this was a revision request, also send the revision reason
      if (status === "revision_requested" && message) {
        await clientAPI.requestRevision(jobId, message);
      }

      fetchDashboardData(); // Refresh data
      toast.success(`Job status updated to ${status.replace("_", " ")}`);
    } catch (error) {
      console.error("Failed to update job status:", error);
      toast.error("Failed to update job status");
    }
  };

  const handleRequestRevision = async (jobId: string) => {
    const reason = prompt("Please provide a reason for the revision request:");
    if (!reason) return;

    try {
      await handleUpdateJobStatus(jobId, "revision_requested", reason);
    } catch (error) {
      console.error("Failed to request revision:", error);
    }
  };

  const handlePaymentAndRating = (job: EnrichedJob) => {
    setSelectedJob(job);
    setSelectedWorker(job.assignedWorker || null);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    try {
      // Mock Chapa payment integration
      if (!selectedJob || !selectedWorker) return;
      const paymentData = {
        amount:
          selectedJob.acceptedApplication?.proposedBudget || selectedJob.budget,
        currency: "ETB",
        jobId: selectedJob._id,
        workerId: selectedWorker._id,
      };

      // In real implementation, this would integrate with Chapa API
      console.log("Processing payment with Chapa:", paymentData);

      // Defer completion until rating step (simulate escrow release)

      setShowPaymentModal(false);
      setShowRatingModal(true);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to process payment:", error);
    }
  };

  const submitRating = async () => {
    try {
      if (!selectedJob) return;
      const res = await clientAPI.completeJobWithRating(
        selectedJob._id,
        rating,
        review,
      );

      // If a payment was created for manual check, allow uploading proof now
      const paymentId: string | undefined = res.data?.data?.paymentId;
      if (paymentId) {
        setRecentPaymentId(paymentId);
        setShowRatingModal(false);
        setShowProofModal(true);
        return;
      }

      setShowRatingModal(false);
      setRating(5);
      setReview("");
      setSelectedJob(null);
      setSelectedWorker(null);

      fetchDashboardData();
    } catch (error) {
      console.error("Failed to submit rating:", error);
    }
  };

  const onPickProof = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () =>
      setPendingProof({
        dataUrl: String(r.result),
        name: f.name,
        type: f.type,
      });
    r.readAsDataURL(f);
  };

  const uploadProof = async () => {
    if (!recentPaymentId || !pendingProof) {
      setShowProofModal(false);
      return;
    }
    try {
      await clientAPI.uploadPaymentProof(recentPaymentId, {
        imageData: pendingProof.dataUrl,
        filename: pendingProof.name,
        mimeType: pendingProof.type,
        note: `Check proof for job ${selectedJob?.title || ""}`,
      });
      setPendingProof(null);
      setRecentPaymentId(null);
      setShowProofModal(false);
      setSelectedJob(null);
      setSelectedWorker(null);
      fetchDashboardData();
      toast.success("Payment proof uploaded. Admin will verify and mark paid.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload proof.");
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <BackToDashboard
              currentRole="client"
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
          <div className="flex flex-col sm:flex-row gap-2">
            <BackToDashboard
              currentRole="client"
              variant="button"
              className="w-full sm:w-auto"
            />
            <Button
              onClick={() => router.push("/client/jobs/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("header.postJob")}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-blue-600">
                {t("stats.totalJobs.label")}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">
                {stats?.totalJobs || 0}
              </p>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-yellow-600">
                {t("stats.activeJobs.label")}
              </p>
              <p className="text-2xl font-bold text-yellow-900">
                {stats?.activeJobs.length || 0}
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
                {stats?.completedJobs || 0}
              </p>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="text-center">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-purple-600">
                {t("stats.totalSpent.label")}
              </p>
              <p className="text-sm sm:text-xl font-bold text-purple-900">
                ETB {stats?.totalSpent?.toLocaleString() || 0}
              </p>
            </div>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <div className="text-center">
              <Star className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-indigo-600">
                {t("stats.rating.label")}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-900">
                {stats?.averageRating?.toFixed(1) || "N/A"}
              </p>
            </div>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <div className="text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-xs sm:text-sm font-medium text-orange-600">
                {t("stats.applications.label")}
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {stats?.totalApplications || 0}
              </p>
            </div>
          </Card>
        </div>

        {/* Jobs List */}
        <Card>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {t("sections.jobs.title")}
            </h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                      {job.title}
                    </h4>
                    {/* Payment Proof Modal */}
                    <Modal
                      isOpen={showProofModal}
                      onClose={() => setShowProofModal(false)}
                      title="Upload Payment Check Proof"
                    >
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Upload a photo/scan of the payment check. This helps
                          admins verify and mark your payment as completed.
                        </p>
                        <label className="flex items-center gap-2 border rounded px-3 py-2 cursor-pointer hover:bg-gray-50 w-fit">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => onPickProof(e.target.files)}
                          />
                          Choose image…
                        </label>
                        {pendingProof && (
                          <div className="mt-2">
                            <Image
                              src={pendingProof.dataUrl}
                              alt="Check preview"
                              width={220}
                              height={140}
                              className="rounded border"
                            />
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowProofModal(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={uploadProof}
                            disabled={!pendingProof}
                          >
                            Upload Proof
                          </Button>
                        </div>
                      </div>
                    </Modal>
                    <p className="text-sm text-gray-600 mt-1">
                      {job.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        job.status === "open"
                          ? "bg-green-100 text-green-800"
                          : job.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : job.status === "completed"
                              ? "bg-gray-100 text-gray-800"
                              : job.status === "awaiting_completion"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ETB {job.budget?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>
                      {t("sections.jobs.due")}:{" "}
                      {new Date(job.deadline).toLocaleDateString()}
                    </span>
                    <span>
                      {t("sections.jobs.applications")}:{" "}
                      {job.applicationCount ??
                        job.recentApplications?.length ??
                        0}
                    </span>
                    {job.assignedWorker && (
                      <span>
                        {t("sections.jobs.worker")}: {job.assignedWorker.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedJob(job)}
                      className="w-full sm:w-auto"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="text-xs sm:text-sm">
                        {t("sections.jobs.actions.viewDetails")}
                      </span>
                    </Button>
                    <Link
                      href={`/client/jobs/${job._id}/applications`}
                      className="inline-block w-full sm:w-auto"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <span className="text-xs sm:text-sm">
                          {t("sections.jobs.actions.applications")}
                        </span>
                      </Button>
                    </Link>

                    {/* Status-based action buttons */}
                    {/* Client can cancel while job is posted (before assignment) */}
                    {job.status === "posted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateJobStatus(job._id, "cancelled")
                        }
                        className="text-red-600 hover:bg-red-50"
                      >
                        {t("sections.jobs.actions.cancelJob")}
                      </Button>
                    )}

                    {/* Client can cancel after assignment but before work starts */}
                    {job.status === "assigned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleUpdateJobStatus(job._id, "cancelled")
                        }
                        className="text-red-600 hover:bg-red-50"
                      >
                        {t("sections.jobs.actions.cancelAssignment")}
                      </Button>
                    )}

                    {/* Client can request revisions after submission */}
                    {job.status === "submitted" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestRevision(job._id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {t("sections.jobs.actions.requestRevision")}
                      </Button>
                    )}

                    {/* Client approves work and marks as complete */}
                    {job.status === "submitted" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateJobStatus(job._id, "completed")
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {t("sections.jobs.actions.approveWork")}
                      </Button>
                    )}

                    {/* Payment and rating happens after completion */}
                    {job.status === "completed" &&
                      job.payment?.paymentStatus !== "paid" && (
                        <Button
                          size="sm"
                          onClick={() => handlePaymentAndRating(job)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          {t("sections.jobs.actions.payAndRate")}
                        </Button>
                      )}

                    {/* Client can dispute during active phases */}
                    {(job.status === "assigned" ||
                      job.status === "in_progress" ||
                      job.status === "submitted" ||
                      job.status === "revision_requested") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedJobForDispute(job);
                          setShowDisputeModal(true);
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {t("sections.jobs.actions.raiseDispute")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Applications for open jobs */}
                {job.status === "open" &&
                  job.recentApplications &&
                  job.recentApplications.length > 0 && (
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                        {t("sections.recentApplications.title")} (
                        {job.applicationCount || job.recentApplications.length})
                      </h5>
                      <div className="space-y-2 sm:space-y-3">
                        {job.recentApplications
                          .slice(0, 3)
                          .map((application: ApplicationPreview) => (
                            <div
                              key={application._id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-white rounded border gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm sm:text-base">
                                  {application.worker.name}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                                  {application.proposal}
                                </p>
                                <p className="text-xs sm:text-sm font-semibold text-green-600">
                                  ETB{" "}
                                  {application.proposedBudget?.toLocaleString()}
                                </p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRejectApplication(
                                      job._id,
                                      application._id,
                                    )
                                  }
                                  className="w-full sm:w-auto"
                                >
                                  <span className="text-xs sm:text-sm">
                                    {t(
                                      "sections.recentApplications.actions.reject",
                                    )}
                                  </span>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleAcceptApplication(
                                      job._id,
                                      application._id,
                                    )
                                  }
                                  className="w-full sm:w-auto"
                                >
                                  <span className="text-xs sm:text-sm">
                                    {t(
                                      "sections.recentApplications.actions.accept",
                                    )}
                                  </span>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        </Card>

        {/* Active Disputes */}
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Disputes
            </h3>
          </div>
          <div className="space-y-4">
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
                  <div className="flex items-center justify-between text-xs text-gray-600">
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
              <p className="text-center text-gray-600 py-4">
                No active disputes
              </p>
            )}
          </div>
        </Card>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedJob.title}
                </h3>
                <Button variant="ghost" onClick={() => setSelectedJob(null)}>
                  ×
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {t("modals.jobDetails.fields.description")}
                  </h4>
                  <p className="text-gray-600">{selectedJob.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("modals.jobDetails.fields.budget")}
                    </h4>
                    <p className="text-gray-600">
                      ETB {selectedJob.budget?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("modals.jobDetails.fields.deadline")}
                    </h4>
                    <p className="text-gray-600">
                      {new Date(selectedJob.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("modals.jobDetails.fields.category")}
                    </h4>
                    <p className="text-gray-600">{selectedJob.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("modals.jobDetails.fields.status")}
                    </h4>
                    <p className="text-gray-600 capitalize">
                      {selectedJob.status.replace("_", " ")}
                    </p>
                  </div>
                </div>
                {selectedJob.requirements && (
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {t("modals.jobDetails.fields.requirements")}
                    </h4>
                    <ul className="text-gray-600 list-disc list-inside">
                      {selectedJob.requirements.map(
                        (req: string, index: number) => (
                          <li key={index}>{req}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          title={t("modals.payment.title")}
          size="md"
        >
          <div className="space-y-6">
            {selectedJob && selectedWorker && (
              <>
                {/* Job Summary */}
                <Card className="bg-gray-50">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">
                      {t("modals.payment.summary.title")}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">
                          {t("modals.payment.summary.fields.jobTitle")}
                        </p>
                        <p className="font-medium">{selectedJob.title}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {t("modals.payment.summary.fields.worker")}
                        </p>
                        <p className="font-medium">{selectedWorker.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {t("modals.payment.summary.fields.amount")}
                        </p>
                        <p className="font-semibold text-green-600">
                          ETB{" "}
                          {(
                            selectedJob.acceptedApplication?.proposedBudget ||
                            selectedJob.budget
                          )?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          {t("modals.payment.summary.fields.status")}
                        </p>
                        <Badge variant="success">
                          {t("modals.payment.summary.fields.readyForPayment")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Chapa Payment Integration */}
                <Card className="bg-blue-50 border-blue-200">
                  <div className="text-center">
                    <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h4 className="font-medium text-gray-900 mb-2">
                      {t("modals.payment.chapa.title")}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {t("modals.payment.chapa.description")}
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {t("modals.payment.chapa.security.encrypted")}
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {t("modals.payment.chapa.security.bankGrade")}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Payment Actions */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    {t("modals.payment.actions.cancel")}
                  </Button>
                  <Button onClick={processPayment} className="flex-1">
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("modals.payment.actions.process")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Rating Modal */}
        <Modal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          title={t("modals.rating.title")}
          size="md"
        >
          <div className="space-y-6">
            {selectedWorker && (
              <>
                {/* Worker Info */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">
                    {selectedWorker.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {t("modals.rating.subtitle")}
                  </p>
                </div>

                {/* Rating Stars */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {t("modals.rating.rating.label")}
                  </p>
                  <div className="flex justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 ${star <= rating ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
                      >
                        <Star className="h-8 w-8 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {rating} {t("modals.rating.rating.outOf")}
                  </p>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("modals.rating.review.label")}
                  </label>
                  <textarea
                    rows={4}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("modals.rating.review.placeholder")}
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRatingModal(false);
                      setRating(5);
                      setReview("");
                    }}
                  >
                    {t("modals.rating.actions.skip")}
                  </Button>
                  <Button onClick={submitRating} className="flex-1">
                    <Star className="h-4 w-4 mr-2" />
                    {t("modals.rating.actions.submit")}
                  </Button>
                </div>
              </>
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
                      await clientAPI.createDispute({
                        ...disputeData,
                        job: selectedJobForDispute._id,
                      });
                      setShowDisputeModal(false);
                      setSelectedJobForDispute(null);
                      setDisputeData({
                        title: "",
                        description: "",
                        type: "payment",
                        priority: "medium",
                        evidence: [],
                      });
                      fetchDashboardData(); // Refresh the dashboard data
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
      </div>
    </div>
  );
};

export default ClientDashboard;
