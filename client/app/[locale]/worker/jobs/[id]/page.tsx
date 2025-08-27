"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { workerAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { CheckCircle, X, Send, MessageCircle } from "lucide-react";

type JobDetail = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  workerAcceptance?: "pending" | "accepted" | "declined";
  progress?: { percentage?: number };
  client?: { name?: string };
  deadline?: string;
};

const WorkerJobPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await workerAPI.getJob(id);
      setJob(res.data.data || res.data.job || res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const accept = async () => {
    await workerAPI.acceptAssignedJob(String(id));
    await load();
  };

  const decline = async () => {
    await workerAPI.declineAssignedJob(String(id));
    router.push("/worker/dashboard");
  };

  const startWork = async () => {
    await workerAPI.updateJobStatus(String(id), "in_progress", 10);
    await load();
  };

  const submitWork = async () => {
    await workerAPI.updateJobStatus(String(id), "submitted", 100);
    setShowSubmitModal(false);
    await load();
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{job.title}</h1>
        <Badge
          variant={
            job.status === "assigned"
              ? "warning"
              : job.status === "in_progress"
                ? "primary"
                : job.status === "submitted"
                  ? "success"
                  : "secondary"
          }
        >
          {job.status.replace("_", " ")}
        </Badge>
      </div>
      <Card className="p-4">
        <p className="text-gray-700 whitespace-pre-wrap">
          {job.description || "No description."}
        </p>
        <div className="mt-3 text-sm text-gray-500">
          Deadline:{" "}
          {job.deadline ? new Date(job.deadline).toLocaleString() : "—"}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2 items-center">
          {job.status === "assigned" && job.workerAcceptance !== "accepted" && (
            <>
              <Button onClick={accept}>
                <CheckCircle className="h-4 w-4 mr-1" /> Accept Assignment
              </Button>
              <Button variant="outline" onClick={decline}>
                <X className="h-4 w-4 mr-1" /> Decline
              </Button>
            </>
          )}
          {job.status === "assigned" && job.workerAcceptance === "accepted" && (
            <Button onClick={startWork}>
              <Send className="h-4 w-4 mr-1" /> Start Work
            </Button>
          )}
          {job.status === "in_progress" && (
            <>
              <Button onClick={() => setShowSubmitModal(true)}>
                <Send className="h-4 w-4 mr-1" /> Submit Work
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/worker/jobs/${job._id}/messages`)}
              >
                <MessageCircle className="h-4 w-4 mr-1" /> Messages
              </Button>
            </>
          )}
          {job.status === "submitted" && (
            <div className="text-sm text-gray-600">
              Work submitted. Waiting for client review and payment.
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Work"
      >
        <div className="space-y-3">
          <label className="text-sm text-gray-700">
            Update message (optional)
          </label>
          <textarea
            rows={4}
            value={updateMessage}
            onChange={(e) => setUpdateMessage(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Describe what you delivered..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button onClick={submitWork}>Submit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkerJobPage;
