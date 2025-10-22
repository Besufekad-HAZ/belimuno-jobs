"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Search,
  Filter,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Trash2,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

export interface Project {
  _id: string;
  title: string;
  description?: string;
  status: "posted" | "assigned" | "in_progress" | "completed" | "cancelled";
  budget: number;
  progress: number;
  deadline: string;
  priority: "low" | "medium" | "high" | "urgent";
  client: {
    _id: string;
    name: string;
    email: string;
    company?: string;
  };
  worker?: {
    _id: string;
    name: string;
    email: string;
    rating?: number;
  };
  company?: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  milestones?: Array<{
    title: string;
    completed: boolean;
    dueDate: string;
  }>;
  totalApplicants?: number;
  applicants?: Applicant[];
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdue: number;
  totalValue: number;
  averageCompletion: number;
  onTimeDelivery: number;
  totalApplicants: number;
}

// Minimal job shape from API we rely on
type JobApi = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  budget?: number;
  deadline?: string;
  client?: {
    _id?: string;
    name?: string;
    email?: string;
    clientProfile?: { company?: string };
  };
  worker?: {
    _id: string;
    name: string;
    email: string;
    workerProfile?: { rating?: number };
  };
  company?: string;
  industry?: string;
  createdAt: string;
  updatedAt?: string;
  startDate?: string;
  tags?: string[];
  applicantsCount?: number;
  applicants?: Applicant[];
};

type StatusFilter =
  | "all"
  | "posted"
  | "assigned"
  | "in_progress"
  | "completed"
  | "overdue";
type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low";

interface Applicant {
  _id: string;
  name: string;
  email: string;
  rating: number;
  appliedAt: string;
}

const ProjectOversight: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeleteJobModal, setShowDeleteJobModal] = useState(false);
  const [selectedJobForDelete, setSelectedJobForDelete] =
    useState<Project | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_outsource"])) {
      router.push("/login");
      return;
    }

    fetchProjects();
  }, [router]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllJobs();
      const jobsData: JobApi[] =
        response.data?.data || response.data?.jobs || response.data || [];
      console.log(jobsData);

      // Transform jobs to projects with enhanced data
      const projectsData: Project[] = jobsData.map((job: JobApi) => {
        const knownStatuses = [
          "posted",
          "assigned",
          "in_progress",
          "completed",
          "cancelled",
        ] as const;
        const status: Project["status"] = (
          knownStatuses as readonly string[]
        ).includes(job.status)
          ? (job.status as Project["status"])
          : "posted";
        const isOverdue =
          new Date(job.deadline || Date.now()) < new Date() &&
          status !== "completed";
        const nonUrgent = ["low", "medium", "high"] as const;
        const computedPriority: Project["priority"] = isOverdue
          ? "urgent"
          : nonUrgent[Math.floor(Math.random() * nonUrgent.length)];

        // Try to get applicants count from job
        let totalApplicants = 0;
        if (typeof job.applicantsCount === "number") {
          totalApplicants = job.applicantsCount;
        } else if (Array.isArray((job as Project).applicants)) {
          totalApplicants = (job as Project).applicants?.length || 0;
        }

        return {
          _id: job._id,
          title: job.title,
          description: job.description,
          status,
          budget: job.budget || Math.floor(Math.random() * 10000) + 1000,
          progress:
            job.status === "completed"
              ? 100
              : job.status === "in_progress"
                ? Math.floor(Math.random() * 80) + 10
                : job.status === "assigned"
                  ? Math.floor(Math.random() * 30)
                  : 0,
          deadline:
            job.deadline ||
            new Date(
              Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          priority: computedPriority,
          client: {
            _id: job.client?._id || "unknown",
            name: job.client?.name || "Unknown Client",
            email: job.client?.email || "unknown@example.com",
            company:
              job.client?.clientProfile?.company ||
              `${job.client?.name || "Unknown"} Corp`,
          },
          worker: job.worker
            ? {
                _id: job.worker._id,
                name: job.worker.name,
                email: job.worker.email,
                rating: job.worker.workerProfile?.rating || 0,
              }
            : undefined,
          company: job.company,
          industry: job.industry,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt || job.createdAt,
          startDate: job.startDate,
          estimatedHours: Math.floor(Math.random() * 100) + 20,
          actualHours:
            job.status === "completed"
              ? Math.floor(Math.random() * 120) + 10
              : job.status === "in_progress"
                ? Math.floor(Math.random() * 60)
                : 0,
          tags:
            job.tags ||
            ["Web Development", "React", "Node.js"].slice(
              0,
              Math.floor(Math.random() * 3) + 1,
            ),
          milestones: [
            {
              title: "Planning & Setup",
              completed: true,
              dueDate: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
            {
              title: "Development Phase",
              completed: job.status === "completed",
              dueDate: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            },
            {
              title: "Testing & Delivery",
              completed: job.status === "completed",
              dueDate:
                job.deadline ||
                new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          totalApplicants, // <-- Added
        };
      });

      setProjects(projectsData);

      // Calculate stats
      const now = new Date();
      const totalApplicants = projectsData.reduce(
        (sum, p) => sum + (p.totalApplicants || 0),
        0,
      );
      const projectStats: ProjectStats = {
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter((p) =>
          ["assigned", "in_progress"].includes(p.status),
        ).length,
        completedProjects: projectsData.filter((p) => p.status === "completed")
          .length,
        overdue: projectsData.filter(
          (p) => new Date(p.deadline) < now && p.status !== "completed",
        ).length,
        totalValue: projectsData.reduce((sum, p) => sum + p.budget, 0),
        averageCompletion:
          projectsData.reduce((sum, p) => sum + p.progress, 0) /
          Math.max(projectsData.length, 1),
        onTimeDelivery: 85, // Mock data
        totalApplicants, // <-- Added
      };

      setStats(projectStats);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = useCallback(() => {
    let filtered = [...projects];

    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.client.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.worker?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        filtered = filtered.filter(
          (project) =>
            new Date(project.deadline) < new Date() &&
            project.status !== "completed",
        );
      } else {
        filtered = filtered.filter(
          (project) => project.status === statusFilter,
        );
      }
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (project) => project.priority === priorityFilter,
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge variant="secondary">Posted</Badge>;
      case "assigned":
        return <Badge variant="primary">Assigned</Badge>;
      case "in_progress":
        return <Badge variant="info">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "cancelled":
        return <Badge variant="danger">Cancelled</Badge>;
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

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-600";
    if (progress >= 70) return "bg-blue-600";
    if (progress >= 40) return "bg-yellow-600";
    return "bg-red-600";
  };

  const isOverdue = (deadline: string, status: string) => {
    return new Date(deadline) < new Date() && status !== "completed";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteJob = (job: Project) => {
    setSelectedJobForDelete(job);
    setShowDeleteJobModal(true);
  };

  const confirmDeleteJob = async () => {
    if (!selectedJobForDelete) return;

    try {
      await adminAPI.deleteJob(selectedJobForDelete._id);
      setShowDeleteJobModal(false);
      setSelectedJobForDelete(null);
      queryClient.invalidateQueries({ queryKey: ["outsourceDashboard"] });
      toast.success("Job deleted successfully");
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete job:", error);
      toast.error("Failed to delete job");
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
            <h1 className="text-3xl font-bold text-gray-900">Job Oversight</h1>
            <p className="text-gray-600">
              Monitor and manage all client jobs and deliverables
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={() => router.push("/admin/outsource/dashboard")}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push("/admin/outsource/jobs/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalProjects || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeProjects || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.completedProjects || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.overdue || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Applicants
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalApplicants || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Job Value
            </h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-sm text-gray-600">Total job portfolio value</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Average Completion
            </h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {Math.round(stats?.averageCompletion || 0)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${stats?.averageCompletion || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              On-Time Delivery
            </h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats?.onTimeDelivery || 0}%
            </div>
            <p className="text-sm text-gray-600">
              Projects delivered on schedule
            </p>
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
                  placeholder="Search jobs by title, client, worker, or tags..."
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
                  <option value="posted">Posted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Expired</option>
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

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <Card className="p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "No jobs match your search criteria."
                  : "No jobs available."}
              </p>
            </Card>
          ) : (
            filteredProjects.map((project) => (
              <Card
                key={project._id}
                className={`p-6 ${isOverdue(project.deadline, project.status) ? "border-l-4 border-red-500 bg-red-50" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      {getStatusBadge(project.status)}
                      {getPriorityBadge(project.priority)}
                      {isOverdue(project.deadline, project.status) && (
                        <Badge variant="danger">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Client
                        </p>
                        <p className="text-sm text-gray-600">
                          {project.company || project.client.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {project.company || project.client.company}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Worker
                        </p>
                        <p className="text-sm text-gray-600">
                          {project.worker?.name || "Not assigned"}
                        </p>
                        {project.worker?.rating && (
                          <p className="text-xs text-gray-500">
                            ⭐ {project.worker.rating}/5
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Budget & Timeline
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(project.budget)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(project.deadline).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Applicants
                        </p>
                        <p className="text-sm text-gray-600">
                          {typeof project.totalApplicants === "number"
                            ? project.totalApplicants
                            : 0}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">
                          Progress
                        </span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {project.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        Created{" "}
                        {formatDistanceToNow(new Date(project.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>
                        Updated{" "}
                        {formatDistanceToNow(new Date(project.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedProject(project);
                        setShowProjectModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Details</span>
                    </Button>

                    <Button
                      onClick={() =>
                        router.push(
                          `/admin/outsource/projects/${project._id}/edit`,
                        )
                      }
                      variant="primary"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Job</span>
                    </Button>

                    <Button
                      onClick={() =>
                        router.push(
                          `/admin/outsource/projects/${project._id}/applicants`,
                        )
                      }
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Users className="h-4 w-4" />
                      <span>Applicants</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteJob(project)}
                      className="w-full sm:w-auto text-red-600 hover:bg-red-50 border-red-600"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="text-xs sm:text-sm">Delete Job</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Project Details Modal */}
        <Modal
          isOpen={showProjectModal}
          onClose={() => {
            setShowProjectModal(false);
            setSelectedProject(null);
          }}
          title=""
          size="xl"
        >
          {selectedProject && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-lg mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">
                      {selectedProject.title}
                    </h3>
                    <p className="text-blue-100 text-lg leading-relaxed">
                      {selectedProject.description}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    {getStatusBadge(selectedProject.status)}
                    {getPriorityBadge(selectedProject.priority)}
                    {isOverdue(
                      selectedProject.deadline,
                      selectedProject.status,
                    ) && (
                      <Badge variant="danger">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Progress
                  </h4>
                  <span className="text-lg font-bold text-blue-600">
                    {selectedProject.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(selectedProject.progress)}`}
                    style={{ width: `${selectedProject.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Job Information Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Briefcase className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Job Information
                    </h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Budget
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(selectedProject.budget)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Deadline
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {new Date(
                          selectedProject.deadline,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Estimated Hours
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedProject.estimatedHours}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Actual Hours
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedProject.actualHours}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-600">
                        Total Applicants
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {typeof selectedProject.totalApplicants === "number"
                          ? selectedProject.totalApplicants
                          : 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stakeholders Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center mb-4">
                    <Users className="h-5 w-5 text-indigo-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Stakeholders
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {/* Client Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-semibold text-sm">
                            C
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {selectedProject.company ||
                              selectedProject.client.name}
                          </p>
                          <p className="text-sm text-gray-600">Client</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 ml-11">
                        {selectedProject.client.email}
                      </p>
                      <p className="text-sm text-gray-600 ml-11">
                        {selectedProject.company ||
                          selectedProject.client.company}
                      </p>
                    </div>

                    {/* Worker Info */}
                    {selectedProject.worker ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 font-semibold text-sm">
                              W
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {selectedProject.worker.name}
                            </p>
                            <p className="text-sm text-gray-600">Worker</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 ml-11">
                          {selectedProject.worker.email}
                        </p>
                        {selectedProject.worker.rating && (
                          <div className="flex items-center ml-11 mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i <
                                    Math.floor(selectedProject.worker.rating!)
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  ⭐
                                </span>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">
                              {selectedProject.worker.rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No worker assigned
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Milestones Section */}
              {selectedProject.milestones && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="text-lg font-semibold text-gray-900">
                      Project Milestones
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {selectedProject.milestones.map((milestone, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                          milestone.completed
                            ? "bg-green-50 border-green-400"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              milestone.completed
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p
                              className={`font-semibold ${
                                milestone.completed
                                  ? "text-green-900"
                                  : "text-gray-900"
                              }`}
                            >
                              {milestone.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              Due:{" "}
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            milestone.completed ? "success" : "secondary"
                          }
                          className="px-3 py-1"
                        >
                          {milestone.completed ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags Section */}
              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Skills & Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Section */}
              <div className="bg-gray-50 rounded-lg p-4 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">
                      <strong>Created:</strong>{" "}
                      {new Date(selectedProject.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-600">
                      <strong>Last Updated:</strong>{" "}
                      {new Date(selectedProject.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Job Confirmation Modal */}
        <Modal
          isOpen={showDeleteJobModal}
          onClose={() => {
            setShowDeleteJobModal(false);
            setSelectedJobForDelete(null);
          }}
          title="Delete Job"
          size="md"
        >
          {selectedJobForDelete && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Are you sure you want to delete this job?
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
                <p className="text-gray-700">{selectedJobForDelete.title}</p>
                <p className="text-sm text-gray-500">
                  Budget: ETB {selectedJobForDelete.budget?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {selectedJobForDelete.status.replace("_", " ")}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteJobModal(false);
                    setSelectedJobForDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteJob}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Job
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ProjectOversight;
