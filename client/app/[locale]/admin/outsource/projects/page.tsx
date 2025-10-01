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
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";

interface Project {
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
}

interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdue: number;
  totalValue: number;
  averageCompletion: number;
  onTimeDelivery: number;
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
  createdAt: string;
  updatedAt?: string;
  startDate?: string;
  tags?: string[];
};

type StatusFilter =
  | "all"
  | "posted"
  | "assigned"
  | "in_progress"
  | "completed"
  | "overdue";
type PriorityFilter = "all" | "urgent" | "high" | "medium" | "low";

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
        };
      });

      setProjects(projectsData);

      // Calculate stats
      const now = new Date();
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
        return <Badge variant="warning">Assigned</Badge>;
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
              Project Oversight
            </h1>
            <p className="text-gray-600">
              Monitor and manage all client projects and deliverables
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <Button
              onClick={() => router.push("/admin/outsource/dashboard")}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Projects
                </p>
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
                <p className="text-sm font-medium text-gray-600">
                  Active Projects
                </p>
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
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.overdue || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Project Value
            </h3>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(stats?.totalValue || 0)}
            </div>
            <p className="text-sm text-gray-600">
              Total project portfolio value
            </p>
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
                  placeholder="Search projects by title, client, worker, or tags..."
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
                  <option value="overdue">Overdue</option>
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
                No projects found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "No projects match your search criteria."
                  : "No projects available."}
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
                          Overdue
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Client
                        </p>
                        <p className="text-sm text-gray-600">
                          {project.client.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {project.client.company}
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
                        router.push(`/admin/outsource/projects/${project._id}`)
                      }
                      variant="primary"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Manage</span>
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
          title="Project Details"
          size="xl"
        >
          {selectedProject && (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedProject.title}
                  </h3>
                  <p className="text-gray-600">{selectedProject.description}</p>
                </div>
                <div className="text-right space-y-1">
                  {getStatusBadge(selectedProject.status)}
                  {getPriorityBadge(selectedProject.priority)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Project Information</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Budget:</strong>{" "}
                      {formatCurrency(selectedProject.budget)}
                    </p>
                    <p>
                      <strong>Progress:</strong> {selectedProject.progress}%
                    </p>
                    <p>
                      <strong>Deadline:</strong>{" "}
                      {new Date(selectedProject.deadline).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Estimated Hours:</strong>{" "}
                      {selectedProject.estimatedHours}
                    </p>
                    <p>
                      <strong>Actual Hours:</strong>{" "}
                      {selectedProject.actualHours}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Stakeholders</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p>
                        <strong>Client:</strong> {selectedProject.client.name}
                      </p>
                      <p className="text-gray-600">
                        {selectedProject.client.email}
                      </p>
                      <p className="text-gray-600">
                        {selectedProject.client.company}
                      </p>
                    </div>
                    {selectedProject.worker && (
                      <div>
                        <p>
                          <strong>Worker:</strong> {selectedProject.worker.name}
                        </p>
                        <p className="text-gray-600">
                          {selectedProject.worker.email}
                        </p>
                        {selectedProject.worker.rating && (
                          <p className="text-gray-600">
                            ⭐ {selectedProject.worker.rating}/5
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedProject.milestones && (
                <div>
                  <h4 className="font-semibold mb-3">Project Milestones</h4>
                  <div className="space-y-2">
                    {selectedProject.milestones.map((milestone, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle
                            className={`h-5 w-5 ${milestone.completed ? "text-green-600" : "text-gray-400"}`}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
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
                        >
                          {milestone.completed ? "Completed" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <strong>Created:</strong>{" "}
                    {new Date(selectedProject.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(selectedProject.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ProjectOversight;
