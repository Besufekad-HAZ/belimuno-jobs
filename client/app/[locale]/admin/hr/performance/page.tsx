"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI, notificationsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/sonner";

interface PerformanceReview {
  _id: string;
  worker: {
    _id: string;
    name: string;
    email: string;
    workerProfile?: {
      rating: number;
      completedJobs: number;
      totalJobs: number;
      skills: string[];
    };
  };
  reviewer: {
    _id: string;
    name: string;
    role: string;
  };
  period: {
    startDate: string;
    endDate: string;
    type: "monthly" | "quarterly" | "annual";
  };
  metrics: {
    jobCompletion: number; // percentage
    qualityRating: number; // 1-5
    clientSatisfaction: number; // 1-5
    timeManagement: number; // 1-5
    communication: number; // 1-5
    technicalSkills: number; // 1-5
    reliability: number; // 1-5
  };
  overallRating: number; // 1-5
  strengths: string[];
  areasForImprovement: string[];
  goals: {
    description: string;
    deadline: string;
    status: "pending" | "in_progress" | "completed";
  }[];
  comments: string;
  status: "draft" | "pending_approval" | "completed" | "acknowledged";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface WorkerStats {
  _id: string;
  name: string;
  averageRating: number;
  jobsCompleted: number;
  totalEarnings: number;
  clientFeedbackCount: number;
  lastReviewDate?: string;
  nextReviewDue: string;
  performanceTrend: "improving" | "stable" | "declining";
}

const PerformanceReviews: React.FC = () => {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [workerStats, setWorkerStats] = useState<WorkerStats[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<PerformanceReview[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "pending_approval" | "completed"
  >("all");
  const [periodFilter, setPeriodFilter] = useState<
    "all" | "monthly" | "quarterly" | "annual"
  >("all");
  const [selectedReview, setSelectedReview] =
    useState<PerformanceReview | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReview, setNewReview] = useState({
    workerId: "",
    periodType: "quarterly" as "monthly" | "quarterly" | "annual",
    startDate: "",
    endDate: "",
    metrics: {
      jobCompletion: 0,
      qualityRating: 0,
      clientSatisfaction: 0,
      timeManagement: 0,
      communication: 0,
      technicalSkills: 0,
      reliability: 0,
    },
    strengths: [""],
    areasForImprovement: [""],
    goals: [{ description: "", deadline: "", status: "pending" as const }],
    comments: "",
  });
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_hr"])) {
      router.push("/login");
      return;
    }

    fetchReviews();
    fetchWorkerStats();
  }, [router]);

  const filterReviews = useCallback(() => {
    let filtered = [...reviews];

    if (searchQuery) {
      filtered = filtered.filter(
        (review) =>
          review.worker.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          review.worker.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((review) => review.status === statusFilter);
    }

    if (periodFilter !== "all") {
      filtered = filtered.filter(
        (review) => review.period.type === periodFilter,
      );
    }

    setFilteredReviews(filtered);
  }, [reviews, searchQuery, statusFilter, periodFilter]);

  useEffect(() => {
    filterReviews();
  }, [filterReviews]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockReviews: PerformanceReview[] = [
        {
          _id: "1",
          worker: {
            _id: "w1",
            name: "John Smith",
            email: "john.smith@email.com",
            workerProfile: {
              rating: 4.2,
              completedJobs: 15,
              totalJobs: 18,
              skills: ["React", "Node.js", "MongoDB"],
            },
          },
          reviewer: {
            _id: "hr1",
            name: "Sarah Wilson",
            role: "HR Manager",
          },
          period: {
            startDate: "2024-01-01",
            endDate: "2024-03-31",
            type: "quarterly",
          },
          metrics: {
            jobCompletion: 95,
            qualityRating: 4,
            clientSatisfaction: 4.2,
            timeManagement: 4.5,
            communication: 4.0,
            technicalSkills: 4.3,
            reliability: 4.8,
          },
          overallRating: 4.3,
          strengths: [
            "Excellent technical skills",
            "Great time management",
            "Reliable and consistent delivery",
          ],
          areasForImprovement: [
            "Client communication could be more proactive",
            "Documentation needs improvement",
          ],
          goals: [
            {
              description:
                "Improve client communication by providing weekly updates",
              deadline: "2024-06-30",
              status: "in_progress",
            },
            {
              description: "Complete advanced React certification",
              deadline: "2024-08-30",
              status: "pending",
            },
          ],
          comments:
            "John has shown consistent performance and technical excellence. Focus on soft skills development will enhance his overall effectiveness.",
          status: "completed",
          createdAt: "2024-04-01T00:00:00Z",
          updatedAt: "2024-04-05T00:00:00Z",
          completedAt: "2024-04-05T00:00:00Z",
        },
        {
          _id: "2",
          worker: {
            _id: "w2",
            name: "Maria Garcia",
            email: "maria.garcia@email.com",
            workerProfile: {
              rating: 4.8,
              completedJobs: 28,
              totalJobs: 30,
              skills: ["UI/UX Design", "Figma", "Adobe Creative Suite"],
            },
          },
          reviewer: {
            _id: "hr1",
            name: "Sarah Wilson",
            role: "HR Manager",
          },
          period: {
            startDate: "2024-01-01",
            endDate: "2024-03-31",
            type: "quarterly",
          },
          metrics: {
            jobCompletion: 98,
            qualityRating: 4.8,
            clientSatisfaction: 4.9,
            timeManagement: 4.5,
            communication: 4.7,
            technicalSkills: 4.9,
            reliability: 4.8,
          },
          overallRating: 4.8,
          strengths: [
            "Outstanding design skills",
            "Excellent client relationships",
            "Innovative problem solving",
          ],
          areasForImprovement: [
            "Could benefit from project management training",
          ],
          goals: [
            {
              description: "Lead a design mentorship program for new workers",
              deadline: "2024-07-31",
              status: "in_progress",
            },
          ],
          comments:
            "Maria is one of our top performers. Her design skills and client relationships are exceptional.",
          status: "completed",
          createdAt: "2024-04-01T00:00:00Z",
          updatedAt: "2024-04-03T00:00:00Z",
          completedAt: "2024-04-03T00:00:00Z",
        },
      ];

      setReviews(mockReviews);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerStats = async () => {
    try {
      const response = await adminAPI.getUsers({ role: "worker", limit: 100 });
      const workers = response.data.data || [];

      // Mock worker stats
      const mockStats: WorkerStats[] = workers.map(
        (worker: {
          _id: string;
          name: string;
          workerProfile?: { rating?: number; completedJobs?: number };
        }) => ({
          _id: worker._id,
          name: worker.name,
          averageRating: worker.workerProfile?.rating || 0,
          jobsCompleted: worker.workerProfile?.completedJobs || 0,
          totalEarnings: Math.floor(Math.random() * 10000) + 2000,
          clientFeedbackCount: Math.floor(Math.random() * 20) + 5,
          lastReviewDate:
            Math.random() > 0.5
              ? new Date(
                  Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
                ).toISOString()
              : undefined,
          nextReviewDue: new Date(
            Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          performanceTrend: (["improving", "stable", "declining"] as const)[
            Math.floor(Math.random() * 3)
          ] as WorkerStats["performanceTrend"],
        }),
      );

      setWorkerStats(mockStats);
    } catch (error) {
      console.error("Failed to fetch worker stats:", error);
    }
  };

  // filterReviews memoized above

  const calculateOverallRating = (metrics: typeof newReview.metrics) => {
    const values = Object.values(metrics);
    const validValues = values.filter((v) => v > 0);
    return validValues.length > 0
      ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length
      : 0;
  };

  const handleCreateReview = async () => {
    try {
      const overallRating = calculateOverallRating(newReview.metrics);

      // In real implementation, call API to create review
      const workerData = workerStats.find((w) => w._id === newReview.workerId);
      const workerObj = workerData
        ? {
            _id: workerData._id,
            name: workerData.name,
            email: "",
            workerProfile: {
              rating: workerData.averageRating,
              completedJobs: workerData.jobsCompleted,
              totalJobs: 0,
              skills: [],
            },
          }
        : {
            _id: newReview.workerId,
            name: "Unknown",
            email: "",
            workerProfile: {
              rating: 0,
              completedJobs: 0,
              totalJobs: 0,
              skills: [],
            },
          };

      const createdReview: PerformanceReview = {
        _id: Date.now().toString(),
        worker: workerObj,
        reviewer: {
          _id: "current_hr",
          name: "Current HR Admin",
          role: "HR Admin",
        },
        period: {
          startDate: newReview.startDate,
          endDate: newReview.endDate,
          type: newReview.periodType,
        },
        metrics: newReview.metrics,
        overallRating,
        strengths: newReview.strengths.filter((s) => s.trim()),
        areasForImprovement: newReview.areasForImprovement.filter((a) =>
          a.trim(),
        ),
        goals: newReview.goals.filter((g) => g.description.trim()),
        comments: newReview.comments,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setReviews((prev) => [createdReview, ...prev]);

      // Send notification to worker
      await notificationsAPI.create({
        recipients: [newReview.workerId],
        title: "Performance Review Created",
        message:
          "A new performance review has been created for you. Please review when ready.",
        type: "general",
        priority: "medium",
      });

      setShowCreateModal(false);
      // Reset form
      setNewReview({
        workerId: "",
        periodType: "quarterly",
        startDate: "",
        endDate: "",
        metrics: {
          jobCompletion: 0,
          qualityRating: 0,
          clientSatisfaction: 0,
          timeManagement: 0,
          communication: 0,
          technicalSkills: 0,
          reliability: 0,
        },
        strengths: [""],
        areasForImprovement: [""],
        goals: [{ description: "", deadline: "", status: "pending" }],
        comments: "",
      });

      toast.success("Performance review created successfully");
    } catch (error) {
      console.error("Failed to create review:", error);
      toast.error("Failed to create review. Please try again.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "pending_approval":
        return <Badge variant="warning">Pending Approval</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "acknowledged":
        return <Badge variant="info">Acknowledged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ));
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
              Performance Reviews
            </h1>
            <p className="text-gray-600">
              Manage worker performance evaluations and development goals
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-0">
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex-1 sm:flex-none min-w-[140px] flex items-center gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Review</span>
              <span className="sm:hidden">Create</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/hr/dashboard")}
              variant="outline"
              className="flex-1 sm:flex-none min-w-[120px]"
              size="sm"
            >
              <span className="hidden sm:inline">Back to Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviews.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviews.filter((r) => r.status === "completed").length}
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
                    reviews.filter(
                      (r) =>
                        r.status === "draft" || r.status === "pending_approval",
                    ).length
                  }
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reviews.length > 0
                    ? (
                        reviews.reduce((sum, r) => sum + r.overallRating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Worker Performance Overview */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Worker Performance Overview
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {workerStats.slice(0, 6).map((worker) => (
              <div key={worker._id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{worker.name}</h3>
                  {getTrendIcon(worker.performanceTrend)}
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-1">
                    {getRatingStars(worker.averageRating)}
                    <span className="text-gray-600 ml-1">
                      ({worker.averageRating.toFixed(1)})
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {worker.jobsCompleted} jobs completed
                  </p>
                  <p className="text-gray-600">
                    ${worker.totalEarnings.toLocaleString()} earned
                  </p>
                  {worker.lastReviewDate ? (
                    <p className="text-gray-600">
                      Last review:{" "}
                      {formatDistanceToNow(new Date(worker.lastReviewDate), {
                        addSuffix: true,
                      })}
                    </p>
                  ) : (
                    <p className="text-orange-600">No reviews yet</p>
                  )}
                </div>
                <Button
                  onClick={() => {
                    setNewReview((prev) => ({ ...prev, workerId: worker._id }));
                    setShowCreateModal(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                >
                  Create Review
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews by worker name..."
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
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "all"
                        | "draft"
                        | "pending_approval"
                        | "completed",
                    )
                  }
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Period:</span>
                <select
                  value={periodFilter}
                  onChange={(e) =>
                    setPeriodFilter(
                      e.target.value as
                        | "all"
                        | "monthly"
                        | "quarterly"
                        | "annual",
                    )
                  }
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card className="p-12 text-center">
              <Award className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No reviews found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "No reviews match your search criteria."
                  : "No performance reviews available."}
              </p>
            </Card>
          ) : (
            filteredReviews.map((review) => (
              <Card key={review._id} className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate flex-1 min-w-0">
                        {review.worker.name}
                      </h3>
                      {getStatusBadge(review.status)}
                      <Badge variant="info" size="sm">
                        {review.period.type}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {getRatingStars(review.overallRating)}
                        <span className="text-xs sm:text-sm font-medium text-gray-600 ml-1">
                          ({review.overallRating.toFixed(1)})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">
                          Review Period
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          {new Date(
                            review.period.startDate,
                          ).toLocaleDateString()}{" "}
                          -{" "}
                          {new Date(review.period.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">
                          Reviewer
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          {review.reviewer.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">
                          Key Metrics
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          Quality: {review.metrics.qualityRating}/5, Completion:{" "}
                          {review.metrics.jobCompletion}%
                        </p>
                      </div>
                    </div>

                    {review.strengths.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">
                          Strengths:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {review.strengths.slice(0, 3).map((strength, idx) => (
                            <Badge key={idx} variant="success" size="sm">
                              {strength}
                            </Badge>
                          ))}
                          {review.strengths.length > 3 && (
                            <Badge variant="secondary" size="sm">
                              +{review.strengths.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-500">
                      <span>
                        Created{" "}
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {review.completedAt && (
                        <span>
                          Completed{" "}
                          {formatDistanceToNow(new Date(review.completedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-2 lg:gap-2 lg:ml-4 flex-shrink-0 w-full lg:w-auto">
                    <Button
                      onClick={() => {
                        setSelectedReview(review);
                        setShowReviewModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>

                    {review.status === "draft" && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 lg:flex-none flex items-center justify-center gap-2"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Edit</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Review Details Modal */}
        <Modal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReview(null);
          }}
          title="Performance Review Details"
          size="xl"
        >
          {selectedReview && (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedReview.worker.name}
                  </h3>
                  <p className="text-gray-600">{selectedReview.worker.email}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedReview.status)}
                  <div className="flex items-center space-x-1 mt-1">
                    {getRatingStars(selectedReview.overallRating)}
                    <span className="text-sm font-medium text-gray-600 ml-1">
                      ({selectedReview.overallRating.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(selectedReview.metrics).map(
                    ([key, value]) => (
                      <div key={key} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {key === "jobCompletion" ? (
                            <>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">
                                {value}%
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex space-x-1">
                                {getRatingStars(value)}
                              </div>
                              <span className="text-sm font-medium">
                                ({value}/5)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {selectedReview.strengths.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Strengths</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedReview.strengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReview.areasForImprovement.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Areas for Improvement</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedReview.areasForImprovement.map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedReview.goals.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Development Goals</h4>
                  <div className="space-y-3">
                    {selectedReview.goals.map((goal, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">
                            {goal.description}
                          </p>
                          <Badge
                            variant={
                              goal.status === "completed"
                                ? "success"
                                : goal.status === "in_progress"
                                  ? "info"
                                  : "secondary"
                            }
                            size="sm"
                          >
                            {goal.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Deadline:{" "}
                          {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReview.comments && (
                <div>
                  <h4 className="font-semibold mb-2">Comments</h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {selectedReview.comments}
                  </p>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Reviewer:</strong> {selectedReview.reviewer.name}
                  </div>
                  <div>
                    <strong>Review Period:</strong> {selectedReview.period.type}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedReview.createdAt).toLocaleDateString()}
                  </div>
                  {selectedReview.completedAt && (
                    <div>
                      <strong>Completed:</strong>{" "}
                      {new Date(
                        selectedReview.completedAt,
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Create Review Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewReview({
              workerId: "",
              periodType: "quarterly",
              startDate: "",
              endDate: "",
              metrics: {
                jobCompletion: 0,
                qualityRating: 0,
                clientSatisfaction: 0,
                timeManagement: 0,
                communication: 0,
                technicalSkills: 0,
                reliability: 0,
              },
              strengths: [""],
              areasForImprovement: [""],
              goals: [{ description: "", deadline: "", status: "pending" }],
              comments: "",
            });
          }}
          title="Create Performance Review"
          size="xl"
        >
          <div className="space-y-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Worker
                </label>
                <select
                  value={newReview.workerId}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      workerId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a worker</option>
                  {workerStats.map((worker) => (
                    <option key={worker._id} value={worker._id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Period
                </label>
                <select
                  value={newReview.periodType}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      periodType: e.target.value as
                        | "monthly"
                        | "quarterly"
                        | "annual",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newReview.startDate}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newReview.endDate}
                  onChange={(e) =>
                    setNewReview((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">
                Performance Metrics (1-5 scale)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(newReview.metrics).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}{" "}
                      {key === "jobCompletion" ? "(%)" : ""}
                    </label>
                    <input
                      type="number"
                      min={key === "jobCompletion" ? 0 : 1}
                      max={key === "jobCompletion" ? 100 : 5}
                      step={key === "jobCompletion" ? 1 : 0.1}
                      value={value}
                      onChange={(e) =>
                        setNewReview((prev) => ({
                          ...prev,
                          metrics: {
                            ...prev.metrics,
                            [key]: parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strengths
              </label>
              {newReview.strengths.map((strength, idx) => (
                <div key={idx} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={strength}
                    onChange={(e) => {
                      const newStrengths = [...newReview.strengths];
                      newStrengths[idx] = e.target.value;
                      setNewReview((prev) => ({
                        ...prev,
                        strengths: newStrengths,
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a strength..."
                  />
                  {idx === newReview.strengths.length - 1 && (
                    <Button
                      onClick={() =>
                        setNewReview((prev) => ({
                          ...prev,
                          strengths: [...prev.strengths, ""],
                        }))
                      }
                      variant="outline"
                      size="sm"
                    >
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Areas for Improvement
              </label>
              {newReview.areasForImprovement.map((area, idx) => (
                <div key={idx} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => {
                      const newAreas = [...newReview.areasForImprovement];
                      newAreas[idx] = e.target.value;
                      setNewReview((prev) => ({
                        ...prev,
                        areasForImprovement: newAreas,
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter an area for improvement..."
                  />
                  {idx === newReview.areasForImprovement.length - 1 && (
                    <Button
                      onClick={() =>
                        setNewReview((prev) => ({
                          ...prev,
                          areasForImprovement: [
                            ...prev.areasForImprovement,
                            "",
                          ],
                        }))
                      }
                      variant="outline"
                      size="sm"
                    >
                      Add
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Development Goals
              </label>
              {newReview.goals.map((goal, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 p-3 rounded-md mb-3"
                >
                  <input
                    type="text"
                    value={goal.description}
                    onChange={(e) => {
                      const newGoals = [...newReview.goals];
                      newGoals[idx].description = e.target.value;
                      setNewReview((prev) => ({ ...prev, goals: newGoals }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Goal description..."
                  />
                  <input
                    type="date"
                    value={goal.deadline}
                    onChange={(e) => {
                      const newGoals = [...newReview.goals];
                      newGoals[idx].deadline = e.target.value;
                      setNewReview((prev) => ({ ...prev, goals: newGoals }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  {idx === newReview.goals.length - 1 && (
                    <Button
                      onClick={() =>
                        setNewReview((prev) => ({
                          ...prev,
                          goals: [
                            ...prev.goals,
                            {
                              description: "",
                              deadline: "",
                              status: "pending",
                            },
                          ],
                        }))
                      }
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Add Goal
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                value={newReview.comments}
                onChange={(e) =>
                  setNewReview((prev) => ({
                    ...prev,
                    comments: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Additional comments and observations..."
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 pt-4">
              <Button
                onClick={handleCreateReview}
                variant="primary"
                disabled={
                  !newReview.workerId ||
                  !newReview.startDate ||
                  !newReview.endDate
                }
                className="flex-1 sm:flex-none min-w-[120px]"
                size="sm"
              >
                Create Review
              </Button>
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1 sm:flex-none min-w-[120px]"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default PerformanceReviews;
