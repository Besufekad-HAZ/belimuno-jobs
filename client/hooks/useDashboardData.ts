import { useQuery } from "@tanstack/react-query";
import {
  adminAPI,
  clientAPI,
  workerAPI,
  jobsAPI,
  notificationsAPI,
} from "@/lib/api";

// Admin Dashboard Data (Super Admin)
export const useAdminDashboardData = () => {
  return useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const [dashboardResponse, usersResponse, jobsResponse, paymentsResponse] =
        await Promise.all([
          adminAPI.getDashboard({ minimal: true }),
          adminAPI.getUsers({
            limit: 5,
            sort: "-createdAt",
            select: "name email role isVerified isActive createdAt",
          }),
          adminAPI.getAllJobs({
            limit: 6,
            sort: "-createdAt",
            select: "title status budget createdAt",
          }),
          adminAPI.getPayments({
            status: "disputed",
            limit: 20,
            sort: "-createdAt",
            select: "status amount createdAt",
          }),
        ]);

      const users = usersResponse.data.data || [];
      const jobs = jobsResponse.data.data || [];

      // Calculate monthly growth (simplified for example)
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthUsers = users.filter(
        (u: any) => new Date(u.createdAt) >= thisMonth,
      ).length;
      const lastMonthUsers = users.filter((u: any) => {
        const date = new Date(u.createdAt);
        return date >= lastMonth && date < thisMonth;
      }).length;

      const thisMonthJobs = jobs.filter(
        (j: any) => new Date(j.createdAt) >= thisMonth,
      ).length;
      const lastMonthJobs = jobs.filter((j: any) => {
        const date = new Date(j.createdAt);
        return date >= lastMonth && date < thisMonth;
      }).length;

      const userGrowth = lastMonthUsers
        ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
        : 0;
      const jobGrowth = lastMonthJobs
        ? ((thisMonthJobs - lastMonthJobs) / lastMonthJobs) * 100
        : 0;

      const overview =
        dashboardResponse.data?.data?.overview ||
        dashboardResponse.data?.overview ||
        null;

      return {
        stats: overview
          ? {
              totalUsers: overview.totalUsers,
              totalJobs: overview.totalJobs,
              totalRevenue: overview.totalRevenue,
              activeJobs: overview.activeJobs,
              completedJobs: overview.completedJobs,
              pendingVerifications: overview.pendingVerifications,
              disputedPayments: 0, // This will be updated by paymentsResponse
              monthlyGrowth: Math.round((userGrowth + jobGrowth) / 2),
            }
          : null,
        recentUsers: users,
        recentJobs: jobs.slice(0, 5),
        disputes: (
          paymentsResponse.data.data ||
          paymentsResponse.data.payments ||
          []
        ).filter((p: any) => p.status === "disputed"),
      };
    },
    staleTime: 1000 * 60 * 1, // Data considered fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Data garbage collected after 5 minutes of inactivity
  });
};

// HR Admin Dashboard Data
export const useHRDashboardData = () => {
  return useQuery({
    queryKey: ["hrDashboard"],
    queryFn: async () => {
      const [usersResponse, disputesResponse] = await Promise.all([
        adminAPI.getUsers({ role: "worker", limit: 100 }),
        adminAPI.getDisputes(),
      ]);

      const workersData =
        usersResponse.data?.data ||
        usersResponse.data?.users ||
        usersResponse.data ||
        [];
      const disputesData = disputesResponse.data?.data || [];

      const hrStats = {
        totalWorkers: workersData.length,
        verifiedWorkers: workersData.filter((w: any) => w.isVerified).length,
        pendingVerifications: workersData.filter((w: any) => !w.isVerified)
          .length,
        activeWorkers: workersData.filter((w: any) => w.isActive).length,
        workersThisMonth: workersData.filter((w: any) => {
          const createdDate = new Date(w.createdAt);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return createdDate >= thisMonth;
        }).length,
        disputesOpen: disputesData.filter((d: any) => d.status === "open")
          .length,
        disputesResolved: disputesData.filter(
          (d: any) => d.status === "resolved",
        ).length,
        totalDisputes: disputesData.length,
        performanceReviews: 0, // Placeholder
        trainingCompleted: workersData.reduce(
          (total: number, worker: any) =>
            total + (worker.workerProfile?.education?.length || 0),
          0,
        ),
      };

      return {
        stats: hrStats,
        workers: workersData,
        disputes: disputesData,
      };
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
};

// Outsource Admin Dashboard Data
export const useOutsourceDashboardData = () => {
  return useQuery({
    queryKey: ["outsourceDashboard"],
    queryFn: async () => {
      const [usersResponse, jobsResponse] = await Promise.all([
        adminAPI.getUsers({ role: "client", limit: 100 }),
        adminAPI.getAllJobs(),
      ]);

      const clientsData =
        usersResponse.data?.data ||
        usersResponse.data?.users ||
        usersResponse.data ||
        [];
      const jobsData =
        jobsResponse.data?.data ||
        jobsResponse.data?.jobs ||
        jobsResponse.data ||
        [];

      const projectsData = jobsData.slice(0, 20).map((job: any) => ({
        _id: job._id,
        title: job.title,
        status: job.status,
        budget: job.budget || Math.floor(Math.random() * 5000) + 1000,
        progress:
          job.status === "completed"
            ? 100
            : job.status === "in_progress"
              ? Math.floor(Math.random() * 80) + 20
              : 0,
        deadline:
          job.deadline ||
          new Date(
            Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        client: job.client || { _id: "unknown", name: "Unknown Client" },
        worker: job.worker,
        createdAt: job.createdAt,
      }));

      const totalRevenue = projectsData.reduce(
        (sum: number, p: any) =>
          sum + (p.status === "completed" ? p.budget : 0),
        0,
      );
      const monthlyRevenue = projectsData
        .filter((p: any) => {
          const projectDate = new Date(p.createdAt);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return projectDate >= thisMonth && p.status === "completed";
        })
        .reduce((sum: number, p: any) => sum + p.budget, 0);

      const outsourceStats = {
        totalClients: clientsData.length,
        totalRevenue,
        monthlyRevenue,
        activeProjects: projectsData.filter((p: any) =>
          ["posted", "assigned", "in_progress"].includes(p.status),
        ).length,
        completedJobs: projectsData.filter((p: any) => p.status === "completed")
          .length,
        ongoingJobs: projectsData.filter((p: any) => p.status === "in_progress")
          .length,
        clientSatisfaction: Math.round(
          clientsData.reduce(
            (sum: number, client: any) =>
              sum + (client.clientProfile?.rating || 0),
            0,
          ) / Math.max(clientsData.length, 1),
        ),
        projectSuccessRate: Math.round(
          (projectsData.filter((p: any) => p.status === "completed").length /
            Math.max(projectsData.length, 1)) *
            100,
        ),
        averageProjectDuration: Math.round(
          projectsData.reduce(
            (sum: number, project: any) => sum + (project.progress || 0),
            0,
          ) / Math.max(projectsData.length, 1),
        ),
      };

      const mockRevenueData = [
        { month: "Jan", revenue: 12500, projects: 15 },
        { month: "Feb", revenue: 18200, projects: 22 },
        { month: "Mar", revenue: 15800, projects: 19 },
        { month: "Apr", revenue: 22100, projects: 28 },
        { month: "May", revenue: 19600, projects: 24 },
        { month: "Jun", revenue: 25300, projects: 31 },
      ];

      return {
        stats: outsourceStats,
        clients: clientsData,
        projects: projectsData,
        revenueData: mockRevenueData,
      };
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
};

// Client Dashboard Data
export const useClientDashboardData = () => {
  return useQuery({
    queryKey: ["clientDashboard"],
    queryFn: async () => {
      const [dashboardResponse, jobsResponse, disputesResponse] =
        await Promise.all([
          clientAPI.getDashboard(),
          clientAPI.getJobs(),
          clientAPI.getDisputes(),
        ]);

      return {
        stats: dashboardResponse.data.data,
        jobs: jobsResponse.data.data || [],
        disputes: disputesResponse.data.data || [],
      };
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
};

// Worker Dashboard Data
export const useWorkerDashboardData = () => {
  return useQuery({
    queryKey: ["workerDashboard"],
    queryFn: async () => {
      const [
        dashboardResponse,
        jobsResponse,
        myJobsResponse,
        applicationsResponse,
        earningsResponse,
        disputesResponse,
        jobsForYouResponse,
        notificationsResponse,
      ] = await Promise.all([
        workerAPI.getDashboard(),
        jobsAPI.getAll({ status: "open", limit: 10 }),
        workerAPI.getJobs(),
        workerAPI.getApplications(),
        workerAPI.getEarnings(),
        workerAPI.getDisputes(),
        workerAPI.getJobsForYou({ limit: 5 }),
        notificationsAPI.getAll(),
      ]);

      const apps: { job?: { _id: string } }[] =
        applicationsResponse.data.data || [];
      const appliedJobIds = new Set(
        apps.map((a) => a.job?._id).filter(Boolean) as string[],
      );

      const fetchedNotifications = notificationsResponse.data?.data || [];
      const unreadCount = fetchedNotifications.filter(
        (n: any) => !n.isRead,
      ).length;

      const jobsForYouList = (jobsForYouResponse.data.data || []) as Array<any>;

      return {
        stats: dashboardResponse.data.data || dashboardResponse.data,
        availableJobs: jobsResponse.data.data || [],
        myJobs: myJobsResponse.data.data || [],
        appliedJobIds: appliedJobIds,
        earnings: earningsResponse.data,
        disputes: disputesResponse.data.data || [],
        jobsForYou: jobsForYouList.map((j) => ({
          _id: String(j._id),
          title: String(j.title || ""),
          description: String(j.description || ""),
          budget: Number(j.budget || 0),
          deadline: String(j.deadline || ""),
          category: String(j.category || ""),
          region: j.region as { name?: string } | undefined,
          status: String(j.status || ""),
          progress: Number(j.progress || 0),
          acceptedApplication: j.acceptedApplication as
            | {
                proposedBudget?: number;
              }
            | undefined,
          applicationCount: Number(j.applicationCount || 0),
          review: j.review as
            | { workerReview?: { rating?: number } }
            | undefined,
        })),
        notifications: fetchedNotifications,
        unreadCount: unreadCount,
      };
    },
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
};
