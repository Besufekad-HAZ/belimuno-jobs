"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { jobsAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

const ApplyJobPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const user = getStoredUser();
  const [proposal, setProposal] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== "worker") {
    return (
      <div className="p-8">You must be logged in as a worker to apply.</div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await jobsAPI.apply(id, proposal.trim(), parseFloat(budget));
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
        <Card>
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Apply for Job
          </h1>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposal
              </label>
              <textarea
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                required
              />
            </div>
            <Input
              label="Proposed Budget (ETB)"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" loading={loading}>
                Submit Application
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push(`/jobs/${id}`)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ApplyJobPage;
