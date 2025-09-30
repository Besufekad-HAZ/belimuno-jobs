"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Star,
  Download,
  MessageSquare,
  Award,
  Clock,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI, notificationsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import UniversalChatSystem from "@/components/ui/UniversalChatSystem";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/sonner";
import {
  classifyWorkerCategory,
  DEFAULT_WORKER_CATEGORY,
} from "@/data/workerCategories";

interface Worker {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  workerProfile?: {
    skills: string[];
    experience: string;
    rating: number;
    totalJobs: number;
    completedJobs: number;
    hourlyRate?: number;
    availability: string;
    portfolio?: string[];
    certifications?: string[];
    languages?: string[];
    education?: Array<{
      school: string;
      degree: string;
      field: string;
      startDate: string;
      endDate: string;
    }>;
    workHistory?: Array<{
      company: string;
      title: string;
      startDate: string;
      endDate: string;
      description: string;
    }>;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    dob?: string;
    verified?: boolean;
    address?: {
      street?: string;
      city?: string;
      region?: string;
      country?: string;
    };
    cv?: {
      name: string;
      data: string;
    };
  };
}

type WorkerMeta = {
  category: string;
  experience: string;
};

type WorkerWithMeta = Worker & {
  __meta: WorkerMeta;
};

const NOT_SPECIFIED_EXPERIENCE = "Not specified";

const formatExperienceLabel = (experience?: string | null) => {
  if (!experience) return NOT_SPECIFIED_EXPERIENCE;
  const cleaned = experience.replace(/[_-]/g, " ").trim().toLowerCase();
  if (!cleaned) return NOT_SPECIFIED_EXPERIENCE;
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const WorkerManagement: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerWithMeta[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const statuses = ["all", "verified", "pending", "inactive"] as const;
  type Status = (typeof statuses)[number];
  const statusMeta: Record<
    Status,
    { label: string; icon: LucideIcon; iconClass: string }
  > = {
    all: { label: "All", icon: Users, iconClass: "text-blue-500" },
    verified: {
      label: "Verified",
      icon: CheckCircle,
      iconClass: "text-emerald-500",
    },
    pending: { label: "Pending", icon: Clock, iconClass: "text-amber-500" },
    inactive: { label: "Inactive", icon: XCircle, iconClass: "text-rose-500" },
  };
  const [statusFilter, setStatusFilter] = useState<Status>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithMeta | null>(
    null,
  );
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationAction, setVerificationAction] = useState<
    "verify" | "reject"
  >("verify");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState({
    title: "",
    message: "",
  });
  const router = useRouter();

  const categories = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((worker) => {
      set.add(worker.__meta?.category || DEFAULT_WORKER_CATEGORY);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const experienceOptions = useMemo(() => {
    const set = new Set<string>();
    workers.forEach((worker) => {
      set.add(worker.__meta?.experience || NOT_SPECIFIED_EXPERIENCE);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [workers]);

  const filtersDirty = useMemo(() => {
    return (
      statusFilter !== "all" ||
      categoryFilter !== "all" ||
      experienceFilter !== "all" ||
      Boolean(searchQuery.trim())
    );
  }, [statusFilter, categoryFilter, experienceFilter, searchQuery]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setExperienceFilter("all");
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_hr"])) {
      router.push("/login");
      return;
    }

    fetchWorkers();
  }, [router]);

  const filterWorkers = useCallback(() => {
    let filtered = [...workers];

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      filtered = filtered.filter((worker) => {
        const skillsMatch = worker.workerProfile?.skills?.some((skill) =>
          skill.toLowerCase().includes(query),
        );
        const categoryMatch = worker.__meta?.category
          ?.toLowerCase()
          .includes(query);
        const experienceMatch = worker.__meta?.experience
          ?.toLowerCase()
          .includes(query);

        return (
          worker.name.toLowerCase().includes(query) ||
          worker.email.toLowerCase().includes(query) ||
          skillsMatch ||
          categoryMatch ||
          experienceMatch
        );
      });
    }

    switch (statusFilter) {
      case "verified":
        filtered = filtered.filter((w) => w.isVerified || w.profile?.verified);
        break;
      case "pending":
        filtered = filtered.filter(
          (w) => !w.isVerified && !w.profile?.verified && w.isActive,
        );
        break;
      case "inactive":
        filtered = filtered.filter((w) => !w.isActive);
        break;
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (w) =>
          (w.__meta?.category || DEFAULT_WORKER_CATEGORY) === categoryFilter,
      );
    }

    if (experienceFilter !== "all") {
      filtered = filtered.filter(
        (w) =>
          (w.__meta?.experience || NOT_SPECIFIED_EXPERIENCE) ===
          experienceFilter,
      );
    }

    setFilteredWorkers(filtered);
  }, [workers, searchQuery, statusFilter, categoryFilter, experienceFilter]);

  useEffect(() => {
    filterWorkers();
  }, [filterWorkers]);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ role: "worker", limit: 100 });
      const workersData = (response.data?.data ||
        response.data?.users ||
        response.data ||
        []) as Worker[];

      const normalized: WorkerWithMeta[] = workersData.map((worker) => {
        const category = classifyWorkerCategory(
          worker.workerProfile?.skills || [],
        );
        const experience = formatExperienceLabel(
          worker.workerProfile?.experience,
        );

        return {
          ...worker,
          __meta: {
            category: category || DEFAULT_WORKER_CATEGORY,
            experience,
          },
        };
      });

      setWorkers(normalized);
    } catch (error) {
      console.error("Failed to fetch workers:", error);
    } finally {
      setLoading(false);
    }
  };

  // filterWorkers moved into useCallback above

  const handleWorkerVerification = async (
    workerId: string,
    action: "verify" | "reject",
    reason?: string,
  ) => {
    try {
      if (action === "verify") {
        await adminAPI.verifyWorker(workerId);

        // Send success notification to worker
        await notificationsAPI.create({
          recipients: [workerId],
          title: "Profile Verified! 🎉",
          message:
            "Congratulations! Your worker profile has been verified by our HR team. You can now apply for jobs on our platform.",
          type: "profile_verified",
          priority: "high",
          actionButton: {
            text: "Browse Jobs",
            url: "/jobs",
            action: "browse_jobs",
          },
        });
      } else {
        // For rejection, we'll just send a notification (in real app, you'd have a rejection API)
        await notificationsAPI.create({
          recipients: [workerId],
          title: "Profile Verification Update",
          message: `Your profile verification was not approved. ${reason ? `Reason: ${reason}` : ""} Please update your profile and resubmit for review.`,
          type: "profile_verified",
          priority: "high",
          actionButton: {
            text: "Update Profile",
            url: "/profile/edit",
            action: "update_profile",
          },
        });
      }

      fetchWorkers();
      setShowVerificationModal(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Failed to update worker verification:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedWorker || !messageContent.title || !messageContent.message)
      return;

    try {
      await notificationsAPI.create({
        recipients: [selectedWorker._id],
        title: messageContent.title,
        message: messageContent.message,
        type: "general",
        priority: "medium",
      });

      setShowMessageModal(false);
      setMessageContent({ title: "", message: "" });
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const sendUniversalMessage = async (content: string) => {
    if (!selectedWorker || !content.trim()) return;

    try {
      // Create a notification for the worker
      await notificationsAPI.create({
        recipients: [selectedWorker._id],
        title: "Message from HR Admin",
        message: content,
        type: "general",
        priority: "medium",
      });

      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message. Please try again.");
      throw error;
    }
  };

  const handleToggleWorkerStatus = async (
    workerId: string,
    currentStatus: boolean,
  ) => {
    try {
      if (currentStatus) {
        await adminAPI.deactivateUser(workerId);
      } else {
        await adminAPI.activateUser(workerId);
      }
      fetchWorkers();
    } catch (error) {
      console.error("Failed to toggle worker status:", error);
    }
  };

  const getWorkerStatusBadge = (worker: Worker) => {
    if (!worker.isActive) return <Badge variant="danger">Inactive</Badge>;
    if (!worker.isVerified && !worker.profile?.verified)
      return <Badge variant="warning">Pending Verification</Badge>;
    return <Badge variant="success">Verified</Badge>;
  };

  const calculateWorkerScore = (worker: Worker) => {
    const profile = worker.workerProfile;
    if (!profile) return 0;

    let score = 0;
    if (profile.rating) score += profile.rating * 2;
    if (profile.completedJobs)
      score += Math.min(profile.completedJobs * 0.5, 10);
    if (profile.skills && profile.skills.length > 0)
      score += Math.min(profile.skills.length * 0.3, 5);
    if (profile.certifications && profile.certifications.length > 0)
      score += profile.certifications.length;

    return Math.min(Math.round(score), 10);
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
              Worker Management
            </h1>
            <p className="text-gray-600">
              Manage worker profiles, verifications, and HR operations
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
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Workers
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {workers.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    workers.filter((w) => w.isVerified || w.profile?.verified)
                      .length
                  }
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    workers.filter(
                      (w) =>
                        !w.isVerified && !w.profile?.verified && w.isActive,
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workers.filter((w) => !w.isActive).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6 bg-white/90 border border-blue-100 shadow-lg shadow-blue-50/60 backdrop-blur-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/40">
                  <SlidersHorizontal className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    Candidate Filters
                    <Sparkles className="h-4 w-4 text-blue-500" />
                  </h2>
                  <p className="text-sm text-gray-500">
                    Refine your talent pool by keyword, status, category, and
                    experience.
                  </p>
                </div>
              </div>

              {filtersDirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="border border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-400 shadow-sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset filters
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:items-end">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Keyword Search
                </label>
                <div className="relative group">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-400 transition-colors duration-200 group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    placeholder="Search by name, email, skills, category or experience..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-blue-100 bg-white/90 pl-11 pr-4 py-2.5 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 group-hover:border-blue-200"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-blue-100 bg-white/90 px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-blue-200"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Experience
                </label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full rounded-xl border border-blue-100 bg-white/90 px-3 py-2.5 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 hover:border-blue-200"
                >
                  <option value="all">All experience levels</option>
                  {experienceOptions.map((experience) => (
                    <option key={experience} value={experience}>
                      {experience}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </span>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => {
                  const meta = statusMeta[status];
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-200/70 scale-[1.03] focus:ring-blue-500"
                          : "bg-white/80 border border-blue-100 text-blue-700 hover:bg-blue-50 focus:ring-blue-300"
                      }`}
                    >
                      <meta.icon
                        className={`h-4 w-4 transition-colors duration-200 ${
                          isActive ? "text-white" : meta.iconClass
                        }`}
                      />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {filtersDirty && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-blue-700">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Active filters
                </span>
                {statusFilter !== "all" && (
                  <Badge variant="info" size="sm">
                    Status: {statusMeta[statusFilter].label}
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="info" size="sm">
                    Category: {categoryFilter}
                  </Badge>
                )}
                {experienceFilter !== "all" && (
                  <Badge variant="info" size="sm">
                    Experience: {experienceFilter}
                  </Badge>
                )}
                {searchQuery.trim() && (
                  <Badge variant="info" size="sm">
                    Search: &ldquo;{searchQuery.trim()}&rdquo;
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Workers List */}
        <div className="space-y-4">
          {filteredWorkers.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No workers found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "No workers match your search criteria."
                  : "No workers available."}
              </p>
            </Card>
          ) : (
            filteredWorkers.map((worker) => (
              <Card
                key={worker._id}
                className="p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:border-blue-100/80"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Avatar */}
                    <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      {worker.profile?.avatar ? (
                        <Image
                          src={worker.profile.avatar}
                          alt={worker.name}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-8 w-8 text-gray-600" />
                      )}
                    </div>

                    {/* Worker Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {worker.name}
                        </h3>
                        {getWorkerStatusBadge(worker)}
                        {worker.__meta?.category && (
                          <Badge variant="secondary">
                            {worker.__meta.category}
                          </Badge>
                        )}
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {worker.workerProfile?.rating || 0}/5
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {worker.email}
                          </p>
                          {worker.phone && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-1" />
                              {worker.phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Experience:</strong>{" "}
                            {worker.__meta?.experience ||
                              worker.workerProfile?.experience ||
                              NOT_SPECIFIED_EXPERIENCE}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Jobs:</strong>{" "}
                            {worker.workerProfile?.completedJobs || 0}/
                            {worker.workerProfile?.totalJobs || 0}
                          </p>
                          {worker.workerProfile?.hourlyRate && (
                            <p className="text-sm text-gray-600">
                              <strong>Rate:</strong> $
                              {worker.workerProfile.hourlyRate}/hr
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Joined:</strong>{" "}
                            {formatDistanceToNow(new Date(worker.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Availability:</strong>{" "}
                            {worker.workerProfile?.availability ||
                              "Not specified"}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Award className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600">
                              Score: {calculateWorkerScore(worker)}/10
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      {worker.workerProfile?.skills &&
                        worker.workerProfile.skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Skills:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {worker.workerProfile.skills
                                .slice(0, 6)
                                .map((skill, idx) => (
                                  <Badge key={idx} variant="info" size="sm">
                                    {skill}
                                  </Badge>
                                ))}
                              {worker.workerProfile.skills.length > 6 && (
                                <Badge variant="secondary" size="sm">
                                  +{worker.workerProfile.skills.length - 6} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowWorkerModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>

                    {!worker.isVerified &&
                      !worker.profile?.verified &&
                      worker.isActive && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedWorker(worker);
                              setVerificationAction("verify");
                              setShowVerificationModal(true);
                            }}
                            variant="primary"
                            size="sm"
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Verify</span>
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedWorker(worker);
                              setVerificationAction("reject");
                              setShowVerificationModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-2 text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}

                    <Button
                      onClick={() => {
                        setSelectedWorker(worker);
                        setShowMessageModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Message</span>
                    </Button>

                    <Button
                      onClick={() =>
                        handleToggleWorkerStatus(worker._id, worker.isActive)
                      }
                      variant="outline"
                      size="sm"
                      className={`flex items-center space-x-2 ${
                        worker.isActive ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {worker.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>{worker.isActive ? "Deactivate" : "Activate"}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Worker Details Modal */}
        <Modal
          isOpen={showWorkerModal}
          onClose={() => {
            setShowWorkerModal(false);
            setSelectedWorker(null);
          }}
          title="Worker Details"
          size="xl"
        >
          {selectedWorker && (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Basic Info */}
              <div className="flex items-start space-x-4">
                <div className="h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  {selectedWorker.profile?.avatar ? (
                    <Image
                      src={selectedWorker.profile.avatar}
                      alt={selectedWorker.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <Users className="h-10 w-10 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold">
                    {selectedWorker.name}
                  </h3>
                  <p className="text-gray-600">{selectedWorker.email}</p>
                  {selectedWorker.phone && (
                    <p className="text-gray-600">{selectedWorker.phone}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {getWorkerStatusBadge(selectedWorker)}
                    {selectedWorker.__meta?.category && (
                      <Badge variant="secondary">
                        {selectedWorker.__meta.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              {selectedWorker.profile && (
                <div>
                  <h4 className="font-semibold mb-3">Personal Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    {selectedWorker.profile.firstName && (
                      <p>
                        <strong>First Name:</strong>{" "}
                        {selectedWorker.profile.firstName}
                      </p>
                    )}
                    {selectedWorker.profile.lastName && (
                      <p>
                        <strong>Last Name:</strong>{" "}
                        {selectedWorker.profile.lastName}
                      </p>
                    )}
                    {selectedWorker.profile.dob && (
                      <p>
                        <strong>Date of Birth:</strong>{" "}
                        {new Date(
                          selectedWorker.profile.dob,
                        ).toLocaleDateString()}
                      </p>
                    )}
                    {selectedWorker.profile.address && (
                      <div className="col-span-2">
                        <strong>Address:</strong>
                        <p className="text-sm text-gray-600">
                          {[
                            selectedWorker.profile.address.street,
                            selectedWorker.profile.address.city,
                            selectedWorker.profile.address.region,
                            selectedWorker.profile.address.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                    {selectedWorker.profile.bio && (
                      <div className="col-span-2">
                        <strong>Bio:</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedWorker.profile.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Worker Profile */}
              {selectedWorker.workerProfile && (
                <div>
                  <h4 className="font-semibold mb-3">
                    Professional Information
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <p>
                        <strong>Category:</strong>{" "}
                        {selectedWorker.__meta?.category ||
                          DEFAULT_WORKER_CATEGORY}
                      </p>
                      <p>
                        <strong>Experience:</strong>{" "}
                        {selectedWorker.__meta?.experience ||
                          selectedWorker.workerProfile.experience ||
                          NOT_SPECIFIED_EXPERIENCE}
                      </p>
                      <p>
                        <strong>Hourly Rate:</strong> $
                        {selectedWorker.workerProfile.hourlyRate ?? "Not set"}
                      </p>
                      <p>
                        <strong>Availability:</strong>{" "}
                        {selectedWorker.workerProfile.availability ||
                          "Not specified"}
                      </p>
                      <p>
                        <strong>Rating:</strong>{" "}
                        {selectedWorker.workerProfile.rating ?? 0}/5 ⭐
                      </p>
                      <p>
                        <strong>Total Jobs:</strong>{" "}
                        {selectedWorker.workerProfile.totalJobs ?? 0}
                      </p>
                      <p>
                        <strong>Completed Jobs:</strong>{" "}
                        {selectedWorker.workerProfile.completedJobs ?? 0}
                      </p>
                    </div>

                    {selectedWorker.workerProfile.skills &&
                      selectedWorker.workerProfile.skills.length > 0 && (
                        <div>
                          <strong>Skills:</strong>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedWorker.workerProfile.skills.map(
                              (skill, idx) => (
                                <Badge key={idx} variant="info" size="sm">
                                  {skill}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {selectedWorker.workerProfile.languages &&
                      selectedWorker.workerProfile.languages.length > 0 && (
                        <div>
                          <strong>Languages:</strong>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {selectedWorker.workerProfile.languages.map(
                              (lang, idx) => (
                                <Badge key={idx} variant="success" size="sm">
                                  {lang}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {selectedWorker.workerProfile.certifications &&
                      selectedWorker.workerProfile.certifications.length >
                        0 && (
                        <div>
                          <strong>Certifications:</strong>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {selectedWorker.workerProfile.certifications.map(
                              (cert, idx) => (
                                <li key={idx}>{cert}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Education */}
              {selectedWorker.workerProfile?.education &&
                selectedWorker.workerProfile.education.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Education</h4>
                    <div className="space-y-3">
                      {selectedWorker.workerProfile.education.map(
                        (edu, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium">
                              {edu.degree} in {edu.field}
                            </h5>
                            <p className="text-sm text-gray-600">
                              {edu.school}
                            </p>
                            <p className="text-sm text-gray-600">
                              {edu.startDate} - {edu.endDate}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Work History */}
              {selectedWorker.workerProfile?.workHistory &&
                selectedWorker.workerProfile.workHistory.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Work History</h4>
                    <div className="space-y-3">
                      {selectedWorker.workerProfile.workHistory.map(
                        (work, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium">{work.title}</h5>
                            <p className="text-sm text-gray-600">
                              {work.company}
                            </p>
                            <p className="text-sm text-gray-600">
                              {work.startDate} - {work.endDate}
                            </p>
                            {work.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {work.description}
                              </p>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* CV Download */}
              {selectedWorker.profile?.cv && (
                <div>
                  <h4 className="font-semibold mb-3">Documents</h4>
                  <Button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = selectedWorker.profile!.cv!.data;
                      link.download = selectedWorker.profile!.cv!.name;
                      link.click();
                    }}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download CV ({selectedWorker.profile.cv.name})</span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Verification Modal */}
        <Modal
          isOpen={showVerificationModal}
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedWorker(null);
            setRejectionReason("");
          }}
          title={
            verificationAction === "verify" ? "Verify Worker" : "Reject Worker"
          }
          size="md"
        >
          {selectedWorker && (
            <div className="space-y-4">
              <p className="text-gray-700">
                {verificationAction === "verify"
                  ? `Are you sure you want to verify ${selectedWorker.name}? This will allow them to apply for jobs on the platform.`
                  : `Are you sure you want to reject ${selectedWorker.name}'s verification?`}
              </p>

              {verificationAction === "reject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (will be sent to worker)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={() =>
                    handleWorkerVerification(
                      selectedWorker._id,
                      verificationAction,
                      rejectionReason,
                    )
                  }
                  variant={
                    verificationAction === "verify" ? "primary" : "outline"
                  }
                  className={
                    verificationAction === "reject" ? "text-red-600" : ""
                  }
                >
                  {verificationAction === "verify"
                    ? "Verify Worker"
                    : "Reject Worker"}
                </Button>
                <Button
                  onClick={() => {
                    setShowVerificationModal(false);
                    setRejectionReason("");
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Message Modal */}
        <Modal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedWorker(null);
            setMessageContent({ title: "", message: "" });
          }}
          title="Send Message to Worker"
          size="md"
        >
          {selectedWorker && (
            <div className="space-y-4">
              <p className="text-gray-700">
                Send a message to {selectedWorker.name}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageContent.title}
                  onChange={(e) =>
                    setMessageContent((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Message subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={messageContent.message}
                  onChange={(e) =>
                    setMessageContent((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Your message..."
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSendMessage}
                  variant="primary"
                  disabled={!messageContent.title || !messageContent.message}
                >
                  Send Message
                </Button>
                <Button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageContent({ title: "", message: "" });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Universal Chat System for HR Admin */}
        {selectedWorker && (
          <UniversalChatSystem
            isOpen={showMessageModal}
            onClose={() => {
              setShowMessageModal(false);
              setSelectedWorker(null);
              setMessageContent({ title: "", message: "" });
            }}
            onSendMessage={sendUniversalMessage}
            messages={[]} // No conversation history for admin messages
            currentUserId={getStoredUser()?._id || "admin"}
            recipientName={selectedWorker.name}
            recipientRole="worker"
            mode="compose"
            title={`Send Message to ${selectedWorker.name}`}
            placeholder="Type your message to the worker..."
          />
        )}
      </div>
    </div>
  );
};

export default WorkerManagement;
