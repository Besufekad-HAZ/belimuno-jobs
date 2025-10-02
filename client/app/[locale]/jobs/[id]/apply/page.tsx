"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { jobsAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category?: string;
  region?: { name?: string };
}

const ApplyJobPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const user = getStoredUser();
  const [job, setJob] = useState<Job | null>(null);
  const [applicationData, setApplicationData] = useState<{
    proposal: string;
    proposedBudget: string;
    estimatedDuration?: string;
  }>({ proposal: "", proposedBudget: "" });
  const [loading, setLoading] = useState(false);
  const [jobLoading, setJobLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const PROPOSAL_MAX = 1200;

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobsAPI.getById(id);
        setJob(response.data.data);
      } catch (err) {
        console.error("Failed to fetch job:", err);
        setError("Failed to load job details");
      } finally {
        setJobLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id]);

  if (!user || user.role !== "worker") {
    return (
      <div className="p-8">You must be logged in as a worker to apply.</div>
    );
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Job not found</p>
          <Button onClick={() => router.push("/jobs")}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await jobsAPI.apply(
        id,
        applicationData.proposal.trim(),
        parseFloat(applicationData.proposedBudget),
      );
      router.push(`/jobs/${id}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(msg || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-0 overflow-hidden shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide opacity-80 mb-1">
                  Apply to Job
                </p>
                <h1 className="text-base sm:text-lg font-semibold leading-snug line-clamp-2 pr-4">
                  {job.title}
                </h1>
              </div>
              <button
                onClick={() => router.push(`/jobs/${id}`)}
                className="text-white/70 hover:text-white transition-colors flex-shrink-0 ml-2"
                aria-label="Close application form"
              >
                ×
              </button>
            </div>
          </div>

          {/* Job Quick Summary */}
          <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-gray-500">Budget</p>
              <p className="font-medium text-gray-900">
                ETB {job.budget?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Deadline</p>
              <p className="font-medium text-gray-900">
                {new Date(job.deadline).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium text-gray-900">{job.category || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Region</p>
              <p className="font-medium text-gray-900">
                {job.region?.name || "—"}
              </p>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
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
                  Client budget: ETB {job.budget?.toLocaleString()}
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between pt-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/jobs/${id}`)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={
                  !applicationData.proposal ||
                  !applicationData.proposedBudget ||
                  loading
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
  );
};

export default ApplyJobPage;
