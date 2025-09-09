"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  Briefcase,
  DollarSign,
  FileText,
  Flag,
  Award,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI, notificationsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";

interface Dispute {
  _id: string;
  title: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  type:
    | "payment"
    | "quality"
    | "communication"
    | "deadline"
    | "scope"
    | "other";
  worker: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    workerProfile?: {
      rating: number;
      completedJobs: number;
    };
  };
  client: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    clientProfile?: {
      company?: string;
      totalProjects?: number;
    };
  };
  job?: {
    _id: string;
    title: string;
    budget: number;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
  hrNotes?: string;
  evidence?: {
    type: "image" | "document" | "message";
    url: string;
    description: string;
  }[];
}

type StatusFilter = "all" | "open" | "investigating" | "resolved";
type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low";
type ResolutionStatus = "investigating" | "resolved" | "closed";

const DisputeResolution: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    status: "resolved" as ResolutionStatus,
    resolution: "",
    hrNotes: "",
  });
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_hr"])) {
      router.push("/login");
      return;
    }

    fetchDisputes();
  }, [router, statusFilter, priorityFilter, searchQuery]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDisputes({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        search: searchQuery || undefined,
        page: 1,
        limit: 20,
      });
      setDisputes(response.data.data);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      alert("Failed to load disputes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolutionData.resolution) return;

    try {
      const response = await adminAPI.updateDispute(selectedDispute._id, {
        status: resolutionData.status,
        resolution: resolutionData.resolution,
        hrNotes: resolutionData.hrNotes,
      });

      // Update local state
      setDisputes((prev) =>
        prev.map((d) =>
          d._id === selectedDispute._id ? response.data.data : d,
        ),
      );

      // Send notifications to involved parties
      await notificationsAPI.create({
        recipients: [selectedDispute.worker._id, selectedDispute.client._id],
        title: `Dispute Update: ${selectedDispute.title}`,
        message: `Your dispute has been updated. Status: ${resolutionData.status}. ${resolutionData.resolution}`,
        type: "dispute_resolved",
        priority: "high",
      });

      setShowResolutionModal(false);
      setResolutionData({ status: "resolved", resolution: "", hrNotes: "" });
      alert("Dispute updated successfully!");
    } catch (error) {
      console.error("Failed to resolve dispute:", error);
      alert("Failed to update dispute. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="danger">Open</Badge>;
      case "investigating":
        return <Badge variant="warning">Investigating</Badge>;
      case "resolved":
        return <Badge variant="success">Resolved</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="danger">Urgent</Badge>;
      case "high":
        return <Badge variant="warning">High</Badge>;
      case "medium":
        return <Badge variant="info">Medium</Badge>;
      case "low":
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case "quality":
        return <Award className="h-5 w-5 text-blue-600" />;
      case "communication":
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case "deadline":
        return <Clock className="h-5 w-5 text-orange-600" />;
      case "scope":
        return <Briefcase className="h-5 w-5 text-teal-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
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
              Dispute Resolution
            </h1>
            <p className="text-gray-600">
              Manage and resolve disputes between workers and clients
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={() => router.push("/admin/hr/dashboard")}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Open Disputes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {disputes.filter((d) => d.status === "open").length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Investigating
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {disputes.filter((d) => d.status === "investigating").length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {disputes.filter((d) => d.status === "resolved").length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Flag className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  High Priority
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    disputes.filter(
                      (d) => d.priority === "high" || d.priority === "urgent",
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search disputes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setPriorityFilter(e.target.value as PriorityFilter)
                  }
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Disputes List */}
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No disputes found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "No disputes match your search criteria."
                  : "No disputes to display."}
              </p>
            </Card>
          ) : (
            disputes.map((dispute) => (
              <Card
                key={dispute._id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-3 rounded-lg bg-gray-100">
                      {getTypeIcon(dispute.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {dispute.title}
                        </h3>
                        {getStatusBadge(dispute.status)}
                        {getPriorityBadge(dispute.priority)}
                        <Badge variant="secondary" size="sm">
                          {dispute.type}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {dispute.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Worker
                          </p>
                          <p className="text-sm text-gray-600">
                            {dispute.worker.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dispute.worker.email}
                          </p>
                          {dispute.worker.workerProfile && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500">
                                ⭐ {dispute.worker.workerProfile.rating}/5
                              </span>
                              <span className="text-xs text-gray-500">
                                {dispute.worker.workerProfile.completedJobs}{" "}
                                jobs
                              </span>
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Client
                          </p>
                          <p className="text-sm text-gray-600">
                            {dispute.client.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dispute.client.email}
                          </p>
                          {dispute.client.clientProfile?.company && (
                            <p className="text-xs text-gray-500">
                              {dispute.client.clientProfile.company}
                            </p>
                          )}
                        </div>

                        <div>
                          {dispute.job && (
                            <>
                              <p className="text-sm font-medium text-gray-700">
                                Related Job
                              </p>
                              <p className="text-sm text-gray-600">
                                {dispute.job.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                Budget: ${dispute.job.budget}
                              </p>
                              <p className="text-xs text-gray-500">
                                Status: {dispute.job.status}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Created{" "}
                          {formatDistanceToNow(new Date(dispute.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {dispute.resolvedAt && (
                          <span>
                            Resolved{" "}
                            {formatDistanceToNow(new Date(dispute.resolvedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setShowDisputeModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>

                    {dispute.status !== "resolved" &&
                      dispute.status !== "closed" && (
                        <Button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setResolutionData({
                              status:
                                dispute.status === "open"
                                  ? "investigating"
                                  : "resolved",
                              resolution: dispute.resolution || "",
                              hrNotes: dispute.hrNotes || "",
                            });
                            setShowResolutionModal(true);
                          }}
                          variant="primary"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          {dispute.status === "open" ? (
                            <>
                              <Clock className="h-4 w-4" />
                              <span>Investigate</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span>Resolve</span>
                            </>
                          )}
                        </Button>
                      )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Dispute Details Modal */}
        <Modal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false);
            setSelectedDispute(null);
          }}
          title="Dispute Details"
          size="xl"
        >
          {selectedDispute && (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="flex items-center space-x-3">
                {getTypeIcon(selectedDispute.type)}
                <h3 className="text-xl font-semibold">
                  {selectedDispute.title}
                </h3>
                {getStatusBadge(selectedDispute.status)}
                {getPriorityBadge(selectedDispute.priority)}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedDispute.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Worker Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>
                      <strong>Name:</strong> {selectedDispute.worker.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedDispute.worker.email}
                    </p>
                    {selectedDispute.worker.phone && (
                      <p>
                        <strong>Phone:</strong> {selectedDispute.worker.phone}
                      </p>
                    )}
                    {selectedDispute.worker.workerProfile && (
                      <>
                        <p>
                          <strong>Rating:</strong>{" "}
                          {selectedDispute.worker.workerProfile.rating}/5 ⭐
                        </p>
                        <p>
                          <strong>Completed Jobs:</strong>{" "}
                          {selectedDispute.worker.workerProfile.completedJobs}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Client Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>
                      <strong>Name:</strong> {selectedDispute.client.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedDispute.client.email}
                    </p>
                    {selectedDispute.client.phone && (
                      <p>
                        <strong>Phone:</strong> {selectedDispute.client.phone}
                      </p>
                    )}
                    {selectedDispute.client.clientProfile?.company && (
                      <p>
                        <strong>Company:</strong>{" "}
                        {selectedDispute.client.clientProfile.company}
                      </p>
                    )}
                    {selectedDispute.client.clientProfile?.totalProjects && (
                      <p>
                        <strong>Total Projects:</strong>{" "}
                        {selectedDispute.client.clientProfile.totalProjects}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedDispute.job && (
                <div>
                  <h4 className="font-semibold mb-3">Related Job</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>
                      <strong>Title:</strong> {selectedDispute.job.title}
                    </p>
                    <p>
                      <strong>Budget:</strong> ${selectedDispute.job.budget}
                    </p>
                    <p>
                      <strong>Status:</strong> {selectedDispute.job.status}
                    </p>
                  </div>
                </div>
              )}

              {selectedDispute.evidence &&
                selectedDispute.evidence.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Evidence</h4>
                    <div className="space-y-2">
                      {selectedDispute.evidence.map((evidence, idx) => (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <FileText className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {evidence.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {evidence.type}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedDispute.hrNotes && (
                <div>
                  <h4 className="font-semibold mb-2">HR Notes</h4>
                  <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    {selectedDispute.hrNotes}
                  </p>
                </div>
              )}

              {selectedDispute.resolution && (
                <div>
                  <h4 className="font-semibold mb-2">Resolution</h4>
                  <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-200">
                    {selectedDispute.resolution}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  Created:{" "}
                  {new Date(selectedDispute.createdAt).toLocaleDateString()}
                </span>
                <span>
                  Updated:{" "}
                  {new Date(selectedDispute.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </Modal>

        {/* Resolution Modal */}
        <Modal
          isOpen={showResolutionModal}
          onClose={() => {
            setShowResolutionModal(false);
            setSelectedDispute(null);
            setResolutionData({
              status: "resolved",
              resolution: "",
              hrNotes: "",
            });
          }}
          title="Update Dispute"
          size="lg"
        >
          {selectedDispute && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Update the status and resolution for:{" "}
                <strong>{selectedDispute.title}</strong>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={resolutionData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setResolutionData((prev) => ({
                      ...prev,
                      status: e.target.value as ResolutionStatus,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Details (will be sent to both parties)
                </label>
                <textarea
                  value={resolutionData.resolution}
                  onChange={(e) =>
                    setResolutionData((prev) => ({
                      ...prev,
                      resolution: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the resolution or current status..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Internal HR Notes (for internal use only)
                </label>
                <textarea
                  value={resolutionData.hrNotes}
                  onChange={(e) =>
                    setResolutionData((prev) => ({
                      ...prev,
                      hrNotes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Internal notes and observations..."
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleResolveDispute}
                  variant="primary"
                  disabled={!resolutionData.resolution}
                >
                  Update Dispute
                </Button>
                <Button
                  onClick={() => {
                    setShowResolutionModal(false);
                    setResolutionData({
                      status: "resolved",
                      resolution: "",
                      hrNotes: "",
                    });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default DisputeResolution;
