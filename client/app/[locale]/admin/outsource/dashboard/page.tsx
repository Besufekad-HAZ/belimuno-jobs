"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  Building,
  CheckCircle,
  BarChart3,
  FileText,
  Eye,
  Users,
  Plus,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import BackToDashboard from "@/components/ui/BackToDashboard";
import { useTranslations } from "next-intl";
import { useOutsourceDashboardData } from "@/hooks/useDashboardData";
import WithDashboardLoading from "@/components/hoc/WithDashboardLoading";

const OutsourceAdminDashboard: React.FC = () => {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<{
    _id: string;
    title: string;
    status: string;
    budget: number;
    progress: number;
    deadline: string;
    client: { _id: string; name: string; company?: string };
    worker?: { _id: string; name: string };
    company?: string;
    industry?: string;
    createdAt: string;
  } | null>(null);
  const router = useRouter();
  const t = useTranslations("OutsourceAdminDashboard");

  // Use React Query hook for data fetching with caching
  const { data, isLoading } = useOutsourceDashboardData();

  const stats = data?.stats || null;
  const clients = data?.clients || [];
  const projects = data?.projects || [];
  const revenueData = data?.revenueData || [];
  const loading = isLoading;

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_outsource"])) {
      router.push("/login");
      return;
    }
  }, [router]);

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">{t("jobs.status.completed")}</Badge>;
      case "in_progress":
        return <Badge variant="primary">{t("jobs.status.inProgress")}</Badge>;
      case "assigned":
        return <Badge variant="warning">{t("jobs.status.assigned")}</Badge>;
      case "posted":
        return <Badge variant="secondary">{t("jobs.status.posted")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-600";
    if (progress >= 50) return "bg-blue-600";
    if (progress >= 25) return "bg-orange-600";
    return "bg-red-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <WithDashboardLoading isLoading={loading}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <BackToDashboard
                currentRole="admin_outsource"
                variant="breadcrumb"
                className="mb-2"
              />
              <h1 className="text-3xl font-bold text-gray-900">
                {t("header.title")}
              </h1>
              <p className="text-gray-600">{t("header.subtitle")}</p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <Button
                onClick={() => router.push("/admin/outsource/jobs/new")}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("header.buttons.postJob")}
              </Button>
              <Button
                onClick={() => router.push("/admin/outsource/projects")}
                variant="primary"
                className="flex items-center space-x-2"
              >
                <Briefcase className="h-4 w-4" />
                <span>{t("header.buttons.manageJobs")}</span>
              </Button>
              <Button
                onClick={() => router.push("/admin/outsource/clients")}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Building className="h-4 w-4" />
                <span>{t("header.buttons.clientManagement")}</span>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("stats.totalClients.label")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalClients || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("stats.activeJobs.label")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activeProjects || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("stats.totalRevenue.label")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {t("stats.monthlyRevenue.label")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.monthlyRevenue || 0)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("metrics.clientSatisfaction.title")}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-green-600">
                      {stats?.clientSatisfaction || 0}/5
                    </span>
                    <span className="text-sm text-gray-600">⭐⭐⭐⭐⭐</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full"
                      style={{
                        width: `${((stats?.clientSatisfaction || 0) / 5) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("metrics.jobSuccess.title")}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-blue-600">
                      {stats?.projectSuccessRate || 0}%
                    </span>
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${stats?.projectSuccessRate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("metrics.revenueGrowth.title")}
              </h2>
              <div className="space-y-2">
                {revenueData.slice(-3).map((data) => (
                  <div
                    key={data.month}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-600">{data.month}</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(data.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Recent Projects */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("jobs.title")}
                </h2>
                <Button
                  onClick={() => router.push("/admin/outsource/projects")}
                  variant="outline"
                  size="sm"
                >
                  {t("jobs.viewAll")}
                </Button>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div key={project._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 truncate max-w-48">
                          {project.title}
                        </h3>
                        {getProjectStatusBadge(project.status)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedProject(project);
                            setShowProjectModal(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() =>
                            router.push(
                              `/admin/outsource/projects/${project._id}/applicants`,
                            )
                          }
                          variant="primary"
                          size="sm"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>
                        {t("jobs.details.client")}:{" "}
                        {project.company || project.client?.name}
                      </span>
                      <span>{formatCurrency(project.budget)}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {t("jobs.details.progress")}
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
                ))}
              </div>
            </Card>

            {/* Top Clients */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("clients.title")}
                </h2>
                <Button
                  onClick={() => router.push("/admin/outsource/clients")}
                  variant="outline"
                  size="sm"
                >
                  {t("clients.viewAll")}
                </Button>
              </div>
              <div className="space-y-3">
                {clients.slice(0, 5).map((client) => (
                  <div
                    key={client._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {client.name}
                        </p>
                        <p className="text-sm text-gray-600">{client.email}</p>
                        {client.clientProfile?.industry && (
                          <Badge variant="primary" size="sm">
                            {client.clientProfile.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(
                          client.clientProfile?.totalAmountSpent || 0,
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {client.clientProfile?.totalJobsPosted || 0}{" "}
                        {t("clients.metrics.jobs")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Business Actions and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Business Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("operations.title")}
              </h2>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/admin/outsource/clients")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Building className="h-4 w-4 mr-2" />
                  {t("operations.buttons.clientManagement")}
                </Button>
                <Button
                  onClick={() => router.push("/admin/outsource/projects")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  {t("operations.buttons.jobOversight")}
                </Button>
                <Button
                  onClick={() => router.push("/admin/outsource/analytics")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t("operations.buttons.businessAnalytics")}
                </Button>
                <Button
                  onClick={() => router.push("/admin/outsource/reports")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {t("operations.buttons.financialReports")}
                </Button>
              </div>
            </Card>

            {/* Key Metrics */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("keyMetrics.title")}
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {t("keyMetrics.metrics.avgJobValue")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(
                      (stats?.totalRevenue || 0) /
                        Math.max(stats?.completedJobs || 1, 1),
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {t("keyMetrics.metrics.clientRetention")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      (clients.filter((c) => c.isActive).length /
                        Math.max(clients.length, 1)) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {t("keyMetrics.metrics.jobCompletionRate")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      (projects.filter((p) => p.status === "completed").length /
                        Math.max(projects.length, 1)) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {t("keyMetrics.metrics.avgJobDuration")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      projects
                        .filter((p) => p.status === "completed")
                        .reduce((sum, p) => {
                          const start = new Date(p.createdAt);
                          const end = new Date(p.deadline);
                          const weeks = Math.ceil(
                            (end.getTime() - start.getTime()) /
                              (7 * 24 * 60 * 60 * 1000),
                          );
                          return sum + weeks;
                        }, 0) /
                        Math.max(
                          projects.filter((p) => p.status === "completed")
                            .length,
                          1,
                        ),
                    )}{" "}
                    weeks
                  </span>
                </div>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t("recentActivity.title")}
              </h2>
              <div className="space-y-3">
                {/* Completed Projects */}
                {projects
                  .filter((p) => p.status === "completed")
                  .slice(0, 1)
                  .map((project) => (
                    <div
                      key={project._id}
                      className="flex items-center space-x-3"
                    >
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Job &quot;{project.title}&quot; completed
                      </span>
                    </div>
                  ))}

                {/* Recently Added Clients */}
                {clients
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .slice(0, 1)
                  .map((client) => (
                    <div
                      key={client._id}
                      className="flex items-center space-x-3"
                    >
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        New client &quot;{client.company || client.name}&quot;
                        onboarded
                      </span>
                    </div>
                  ))}

                {/* Latest Payments */}
                {projects
                  .filter((p) => p.status === "completed")
                  .slice(0, 1)
                  .map((project) => (
                    <div
                      key={`payment-${project._id}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Payment of {formatCurrency(project.budget)} processed
                        for &quot;{project.title}&quot;
                      </span>
                    </div>
                  ))}

                {/* In Progress Projects */}
                {projects
                  .filter((p) => p.status === "in_progress")
                  .slice(0, 1)
                  .map((project) => (
                    <div
                      key={`progress-${project._id}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">
                        Job &quot;{project.title}&quot; is {project.progress}%
                        complete
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Project Details Modal */}
          <Modal
            isOpen={showProjectModal}
            onClose={() => {
              setShowProjectModal(false);
              setSelectedProject(null);
            }}
            title={t("jobs.details.title")}
            size="lg"
          >
            {selectedProject && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    {selectedProject.title}
                  </h3>
                  {getProjectStatusBadge(selectedProject.status)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("jobs.details.client")}
                    </p>
                    <p className="font-medium">
                      {selectedProject.company || selectedProject.client.name}
                    </p>
                    {selectedProject.client.company && (
                      <p className="text-sm text-gray-600">
                        {selectedProject.client.company}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("jobs.details.budget")}
                    </p>
                    <p className="font-medium">
                      {formatCurrency(selectedProject.budget)}
                    </p>
                  </div>
                  {selectedProject.worker && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {t("jobs.details.assignedWorker")}
                      </p>
                      <p className="font-medium">
                        {selectedProject.worker.name}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {t("jobs.details.deadline")}
                    </p>
                    <p className="font-medium">
                      {new Date(selectedProject.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-600">
                      {t("jobs.details.progress")}
                    </span>
                    <span className="font-medium">
                      {selectedProject.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getProgressColor(selectedProject.progress)}`}
                      style={{ width: `${selectedProject.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    onClick={() =>
                      router.push(
                        `/admin/outsource/projects/${selectedProject._id}/applicants`,
                      )
                    }
                    variant="primary"
                  >
                    {t("jobs.details.buttons.applicants")}
                  </Button>
                  <Button variant="outline">
                    {t("jobs.details.buttons.contactClient")}
                  </Button>
                  <Button variant="outline">
                    {t("jobs.details.buttons.generateReport")}
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </WithDashboardLoading>
  );
};

export default OutsourceAdminDashboard;
