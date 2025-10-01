"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { ArrowLeft, Clock, DollarSign, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Applicant {
  worker: {
    _id: string;
    name: string;
    email: string;
    workerProfile?: {
      rating?: number;
      skills?: string[];
      completedJobs?: number;
    };
  };
  appliedAt: string;
  proposal: string;
  proposedBudget: number;
  status:
    | "pending"
    | "reviewed"
    | "shortlisted"
    | "accepted"
    | "rejected"
    | "withdrawn";
}

const ApplicantsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getJob(params.id as string);
        console.log("response", response);
        const jobData = response.data?.data || response.data;
        console.log("jobData", jobData);

        setJobData(jobData);

        if (jobData?.applicants) {
          setApplicants(jobData.applicants);
          console.log("applicants", applicants);
        }
      } catch (err) {
        console.error("Failed to fetch applicants:", err);
        setError("Failed to load applicants. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchApplicants();
    }
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge variant="success">Accepted</Badge>;
      case "rejected":
        return <Badge variant="danger">Rejected</Badge>;
      case "shortlisted":
        return <Badge variant="info">Shortlisted</Badge>;
      case "reviewed":
        return <Badge variant="secondary">Reviewed</Badge>;
      case "withdrawn":
        return <Badge variant="danger">Withdrawn</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const isJobOverdue = () => {
    if (!jobData?.deadline) return false;
    const deadline = new Date(jobData.deadline);
    const now = new Date();
    return deadline < now && jobData.status !== "completed";
  };

  const canShortlist = () => {
    return jobData?.status === "posted";
  };

  const getShortlistRestrictionMessage = () => {
    if (!canShortlist()) {
      return "You can only shortlist candidates for posted jobs.";
    }
    if (isJobOverdue()) {
      return "The job is expired. You cannot shortlist candidates for expired jobs.";
    }
    return "";
  };

  const handleShortlist = async (applicantId: string) => {
    try {
      await adminAPI.shortlistApplication(applicantId);
      // Refresh the applicants list
      const response = await adminAPI.getJob(params.id as string);
      const jobData = response.data?.data || response.data;
      if (jobData?.applicants) {
        setApplicants(jobData.applicants);
      }
    } catch (err) {
      console.error("Failed to shortlist applicant:", err);
      setError("Failed to shortlist applicant. Please try again later.");
    }
  };

  const handleUnshortlist = async (applicantId: string) => {
    try {
      await adminAPI.unshortlistApplication(applicantId);
      // Refresh the applicants list
      const response = await adminAPI.getJob(params.id as string);
      const jobData = response.data?.data || response.data;
      if (jobData?.applicants) {
        setApplicants(jobData.applicants);
      }
    } catch (err) {
      console.error("Failed to remove applicant from shortlist:", err);
      setError(
        "Failed to remove applicant from shortlist. Please try again later.",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Applicants</h1>
            {jobData?.title && (
              <p className="text-lg text-gray-600 mt-1">{jobData.title}</p>
            )}
          </div>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Jobs</span>
          </Button>
        </div>

        {/* Applicants List */}
        <div className="space-y-4">
          {applicants.length === 0 ? (
            <Card className="p-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No applicants yet
              </h3>
              <p className="text-gray-600">
                There are currently no applicants for this job.
              </p>
            </Card>
          ) : (
            applicants.map((applicant) => (
              <Card key={applicant.worker._id} className="p-6">
                <div className="flex flex-col space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {applicant.worker.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {applicant.worker.email}
                      </p>
                    </div>
                    {getStatusBadge(applicant.status)}
                  </div>

                  {/* Worker Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Proposed Budget
                        </p>
                        <p className="text-sm text-gray-600">
                          ${applicant.proposedBudget}
                        </p>
                      </div>
                    </div>
                    {typeof applicant.worker.workerProfile?.rating ===
                      "number" && (
                      <div className="flex items-center space-x-2">
                        <span
                          className="text-yellow-400 text-lg"
                          role="img"
                          aria-label="star"
                        >
                          ★
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Rating
                          </p>
                          <p className="text-sm text-gray-600">
                            {applicant.worker.workerProfile.rating}/5
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Applied
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(applicant.appliedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Proposal */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Proposal
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {applicant.proposal}
                    </p>
                  </div>

                  {/* Skills */}
                  {applicant.worker.workerProfile?.skills && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {applicant.worker.workerProfile.skills.map(
                          (skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3 pt-4 border-t">
                    {applicant.status === "pending" && (
                      <>
                        <div className="relative group">
                          <Button
                            variant="primary"
                            onClick={() =>
                              handleShortlist(applicant.worker._id)
                            }
                            disabled={!canShortlist() || isJobOverdue()}
                            className={
                              !canShortlist() || isJobOverdue()
                                ? "cursor-not-allowed"
                                : ""
                            }
                          >
                            Shortlist Candidate
                          </Button>
                          {(!canShortlist() || isJobOverdue()) && (
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              {getShortlistRestrictionMessage()}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // TODO: Implement reject applicant
                            console.log(
                              "Reject applicant:",
                              applicant.worker._id,
                            );
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {applicant.status === "shortlisted" && (
                      <Button
                        variant="warning"
                        onClick={() => handleUnshortlist(applicant.worker._id)}
                      >
                        Remove from Shortlist
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantsPage;
