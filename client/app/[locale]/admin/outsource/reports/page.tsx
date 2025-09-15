"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Search,
  RefreshCw,
  Receipt,
  Wallet,
  Users,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/sonner";

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMargin: number;
  monthlyRecurring: number;
  averageProjectValue: number;
  outstandingInvoices: number;
  collectionRate: number;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  status: "completed" | "pending" | "failed";
  client?: string;
  project?: string;
  invoiceNumber?: string;
}

interface Report {
  id: string;
  name: string;
  type: "revenue" | "expenses" | "profit_loss" | "tax" | "client_analysis";
  period: string;
  generatedAt: string;
  status: "ready" | "generating" | "failed";
  size: string;
}

type DateRange = "7d" | "30d" | "90d" | "1y";
type TypeFilter = "all" | Transaction["type"];
type StatusFilter = "all" | Transaction["status"];

// Minimal API job shape for typing local computations
interface ApiJob {
  status?: string;
  budget?: number;
  title?: string;
  client?: { name?: string } | null;
}

const FinancialReports: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(
    null,
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const router = useRouter();

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch real data from APIs
      const [, jobsResponse] = await Promise.all([
        adminAPI.getUsers({ role: "client", limit: 100 }),
        adminAPI.getAllJobs(),
      ]);

      // Safely extract jobs from API response without using any
      const maybeJobs: unknown = (
        jobsResponse as { data?: { data?: unknown } } | undefined
      )?.data?.data;

      const toApiJob = (u: unknown): ApiJob => {
        const o =
          typeof u === "object" && u !== null
            ? (u as Record<string, unknown>)
            : {};
        const clientRaw =
          typeof o["client"] === "object" && o["client"] !== null
            ? (o["client"] as Record<string, unknown>)
            : undefined;
        return {
          status:
            typeof o["status"] === "string"
              ? (o["status"] as string)
              : undefined,
          budget:
            typeof o["budget"] === "number"
              ? (o["budget"] as number)
              : undefined,
          title:
            typeof o["title"] === "string" ? (o["title"] as string) : undefined,
          client: clientRaw
            ? {
                name:
                  typeof clientRaw["name"] === "string"
                    ? (clientRaw["name"] as string)
                    : undefined,
              }
            : null,
        };
      };

      const jobs: ApiJob[] = Array.isArray(maybeJobs)
        ? (maybeJobs as unknown[]).map(toApiJob)
        : [];
      const completedJobs = jobs.filter(
        (j: ApiJob) => j.status === "completed",
      );

      // Calculate financial metrics
      const totalRevenue = completedJobs.reduce(
        (sum: number, job: ApiJob) =>
          sum + (job.budget ?? Math.random() * 5000 + 1000),
        0,
      );

      const financialMetrics: FinancialData = {
        totalRevenue,
        totalExpenses: totalRevenue * 0.3, // Assume 30% expenses
        netProfit: totalRevenue * 0.7, // 70% profit margin
        grossMargin: 70,
        monthlyRecurring: totalRevenue * 0.15, // 15% recurring
        averageProjectValue: totalRevenue / Math.max(completedJobs.length, 1),
        outstandingInvoices: totalRevenue * 0.05, // 5% outstanding
        collectionRate: 95,
      };

      setFinancialData(financialMetrics);

      // Generate mock transactions
      const statuses: Transaction["status"][] = [
        "completed",
        "pending",
        "failed",
      ];
      const mockTransactions: Transaction[] = [
        ...completedJobs.slice(0, 10).map((job: ApiJob, idx: number) => ({
          id: `income-${idx}`,
          type: "income" as const,
          amount: job.budget ?? Math.random() * 5000 + 1000,
          description: `Payment for project: ${job.title ?? "Untitled Project"}`,
          category: "Project Revenue",
          date: new Date(
            Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          client: job.client?.name || "Unknown Client",
          project: job.title ?? "Unknown Project",
          invoiceNumber: `INV-${String(idx + 1).padStart(4, "0")}`,
        })),
        // Add some expense transactions
        {
          id: "expense-1",
          type: "expense",
          amount: 1200,
          description: "Office rent payment",
          category: "Office Expenses",
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
        },
        {
          id: "expense-2",
          type: "expense",
          amount: 450,
          description: "Software licenses",
          category: "Technology",
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
        },
        {
          id: "expense-3",
          type: "expense",
          amount: 800,
          description: "Marketing campaign",
          category: "Marketing",
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
        },
      ];

      setTransactions(mockTransactions);

      // Generate mock reports
      const mockReports: Report[] = [
        {
          id: "1",
          name: "Monthly Revenue Report",
          type: "revenue",
          period: "December 2024",
          generatedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: "ready",
          size: "2.4 MB",
        },
        {
          id: "2",
          name: "Quarterly P&L Statement",
          type: "profit_loss",
          period: "Q4 2024",
          generatedAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: "ready",
          size: "1.8 MB",
        },
        {
          id: "3",
          name: "Client Analysis Report",
          type: "client_analysis",
          period: "November 2024",
          generatedAt: new Date().toISOString(),
          status: "generating",
          size: "-",
        },
        {
          id: "4",
          name: "Tax Summary Report",
          type: "tax",
          period: "YTD 2024",
          generatedAt: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: "ready",
          size: "3.1 MB",
        },
      ];

      setReports(mockReports);
    } catch (error) {
      console.error("Failed to fetch financial data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterTransactions = useCallback(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(q) ||
          transaction.category.toLowerCase().includes(q) ||
          transaction.client?.toLowerCase().includes(q) ||
          transaction.project?.toLowerCase().includes(q),
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.type === typeFilter,
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter,
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, typeFilter, statusFilter]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_outsource"])) {
      router.push("/login");
      return;
    }

    fetchFinancialData();
  }, [router, dateRange, fetchFinancialData]);

  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      case "generating":
        return <Badge variant="info">Generating</Badge>;
      case "ready":
        return <Badge variant="success">Ready</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "revenue":
        return <DollarSign className="h-5 w-5" />;
      case "profit_loss":
        return <TrendingUp className="h-5 w-5" />;
      case "client_analysis":
        return <Users className="h-5 w-5" />;
      case "tax":
        return <Receipt className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const generateReport = (type: string) => {
    // Mock report generation
    toast(`Generating ${type} report. You will be notified when it's ready.`);
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
              Financial Reports
            </h1>
            <p className="text-gray-600">
              Comprehensive financial analytics and reporting
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setDateRange(e.target.value as DateRange)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            <Button onClick={() => setShowReportModal(true)} variant="primary">
              Generate Report
            </Button>
            <Button
              onClick={() => router.push("/admin/outsource/dashboard")}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData?.totalRevenue || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(financialData?.netProfit || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  {financialData?.grossMargin}% margin
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Monthly Recurring
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(financialData?.monthlyRecurring || 0)}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Collection Rate
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {financialData?.collectionRate || 0}%
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(financialData?.outstandingInvoices || 0)}{" "}
                  outstanding
                </p>
              </div>
              <Wallet className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Reports and Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Available Reports */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Available Reports
              </h3>
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-600">
                      {getReportTypeIcon(report.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.name}</p>
                      <p className="text-sm text-gray-600">
                        {report.period} • {report.size}
                      </p>
                      <p className="text-xs text-gray-500">
                        Generated{" "}
                        {formatDistanceToNow(new Date(report.generatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(report.status)}
                    {report.status === "ready" && (
                      <Button
                        onClick={() =>
                          toast.success(`Downloading ${report.name}...`)
                        }
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Key Financial Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Project Value</span>
                <span className="font-semibold">
                  {formatCurrency(financialData?.averageProjectValue || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Expenses</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(financialData?.totalExpenses || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Operating Margin</span>
                <span className="font-semibold">
                  {financialData?.grossMargin || 0}%
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Cash Flow</span>
                  <span className="font-bold text-green-600">
                    +
                    {formatCurrency(
                      (financialData?.totalRevenue || 0) -
                        (financialData?.totalExpenses || 0),
                    )}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            <div className="flex space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTypeFilter(e.target.value as TypeFilter)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice(0, 10).map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        {transaction.client && (
                          <p className="text-sm text-gray-600">
                            {transaction.client}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {transaction.category}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionModal(true);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Transaction Details Modal */}
        <Modal
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false);
            setSelectedTransaction(null);
          }}
          title="Transaction Details"
          size="md"
        >
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Transaction ID
                  </label>
                  <p className="text-gray-900">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <Badge
                    variant={
                      selectedTransaction.type === "income"
                        ? "success"
                        : "danger"
                    }
                  >
                    {selectedTransaction.type}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <p
                    className={`font-semibold ${
                      selectedTransaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedTransaction.type === "income" ? "+" : "-"}
                    {formatCurrency(selectedTransaction.amount)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  {getStatusBadge(selectedTransaction.status)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <p className="text-gray-900">
                  {selectedTransaction.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <p className="text-gray-900">{selectedTransaction.category}</p>
              </div>

              {selectedTransaction.client && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client
                  </label>
                  <p className="text-gray-900">{selectedTransaction.client}</p>
                </div>
              )}

              {selectedTransaction.project && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <p className="text-gray-900">{selectedTransaction.project}</p>
                </div>
              )}

              {selectedTransaction.invoiceNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Invoice Number
                  </label>
                  <p className="text-gray-900">
                    {selectedTransaction.invoiceNumber}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <p className="text-gray-900">
                  {new Date(selectedTransaction.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </Modal>

        {/* Generate Report Modal */}
        <Modal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          title="Generate Financial Report"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Select the type of report you want to generate:
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  generateReport("Revenue Report");
                  setShowReportModal(false);
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Revenue Report
              </Button>

              <Button
                onClick={() => {
                  generateReport("P&L Statement");
                  setShowReportModal(false);
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Profit & Loss Statement
              </Button>

              <Button
                onClick={() => {
                  generateReport("Client Analysis");
                  setShowReportModal(false);
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Client Analysis Report
              </Button>

              <Button
                onClick={() => {
                  generateReport("Tax Summary");
                  setShowReportModal(false);
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Tax Summary Report
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default FinancialReports;
