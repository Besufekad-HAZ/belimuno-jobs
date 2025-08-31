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
} from "lucide-react";
import Link from "next/link";
import { getStoredUser, hasRole } from "@/lib/auth";
import { clientAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { useTranslations } from "next-intl";

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
      const [dashboardResponse, jobsResponse] = await Promise.all([
        clientAPI.getDashboard(),
        clientAPI.getJobs(),
      ]);

      setStats(dashboardResponse.data.data);

      setJobs(jobsResponse.data.data || []);
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

  const handleRequestRevision = async (jobId: string) => {
    const reason = prompt("Please provide a reason for the revision request:");
    if (!reason) return;

    try {
      await clientAPI.requestRevision(jobId, reason);
      fetchDashboardData(); // Refresh data
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
      alert("Payment proof uploaded. Admin will verify and mark paid.");
    } catch (e) {
      console.error(e);
      alert("Failed to upload proof.");
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
            <h1 className="text-3xl font-bold text-gray-900">
              {t("header.title")}
            </h1>
            <p className="text-gray-600 mt-2">{t("header.subtitle")}</p>
          </div>
          <Button onClick={() => router.push("/client/jobs/new")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("header.postJob")}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <div className="text-center">
              <Briefcase className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-600">
                {t("stats.totalJobs.label")}
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {stats?.totalJobs || 0}
              </p>
            </div>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <div className="text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-600">
                {t("stats.activeJobs.label")}
              </p>
              <p className="text-2xl font-bold text-yellow-900">
                {stats?.activeJobs.length || 0}
              </p>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-600">
                {t("stats.completedJobs.label")}
              </p>
              <p className="text-2xl font-bold text-green-900">
                {stats?.completedJobs || 0}
              </p>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="text-center">
              <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-600">
                {t("stats.totalSpent.label")}
              </p>
              <p className="text-xl font-bold text-purple-900">
                ETB {stats?.totalSpent?.toLocaleString() || 0}
              </p>
            </div>
          </Card>

          <Card className="bg-indigo-50 border-indigo-200">
            <div className="text-center">
              <Star className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-indigo-600">
                {t("stats.rating.label")}
              </p>
              <p className="text-2xl font-bold text-indigo-900">
                {stats?.averageRating?.toFixed(1) || "N/A"}
              </p>
            </div>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <div className="text-center">
              <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-600">
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("sections.jobs.title")}
            </h3>
          </div>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
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
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedJob(job)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t("sections.jobs.actions.viewDetails")}
                    </Button>
                    <Link
                      href={`/client/jobs/${job._id}/applications`}
                      className="inline-block"
                    >
                      <Button size="sm" variant="outline">
                        {t("sections.jobs.actions.applications")}
                      </Button>
                    </Link>
                    {job.status === "awaiting_completion" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRequestRevision(job._id)}
                        >
                          {t("sections.jobs.actions.requestRevision")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handlePaymentAndRating(job)}
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          {t("sections.jobs.actions.payAndRate")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Applications for open jobs */}
                {job.status === "open" &&
                  job.recentApplications &&
                  job.recentApplications.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-3">
                        {t("sections.recentApplications.title")} (
                        {job.applicationCount || job.recentApplications.length})
                      </h5>
                      <div className="space-y-3">
                        {job.recentApplications
                          .slice(0, 3)
                          .map((application: ApplicationPreview) => (
                            <div
                              key={application._id}
                              className="flex items-center justify-between p-3 bg-white rounded border"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {application.worker.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {application.proposal}
                                </p>
                                <p className="text-sm font-semibold text-green-600">
                                  ETB{" "}
                                  {application.proposedBudget?.toLocaleString()}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRejectApplication(
                                      job._id,
                                      application._id,
                                    )
                                  }
                                >
                                  {t(
                                    "sections.recentApplications.actions.reject",
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleAcceptApplication(
                                      job._id,
                                      application._id,
                                    )
                                  }
                                >
                                  {t(
                                    "sections.recentApplications.actions.accept",
                                  )}
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

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{selectedJob.title}</h3>
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
                        <p className="text-gray-500">
                          {t("modals.payment.summary.fields.jobTitle")}
                        </p>
                        <p className="font-medium">{selectedJob.title}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">
                          {t("modals.payment.summary.fields.worker")}
                        </p>
                        <p className="font-medium">{selectedWorker.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">
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
                        <p className="text-gray-500">
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
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
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
      </div>
    </div>
  );
};

export default ClientDashboard;
