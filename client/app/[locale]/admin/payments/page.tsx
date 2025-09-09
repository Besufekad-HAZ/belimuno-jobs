"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Image from "next/image";
import { adminAPI } from "@/lib/api";
import {
  Banknote,
  CheckCircle2,
  Clock,
  CloudUpload,
  FileText,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";

type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

type PaymentMethod = "manual_check" | "admin_adjustment";
type PaymentType = "job_payment" | "adjustment";

type NamedRef = { _id?: string; name?: string; role?: string };

type PaymentItem = {
  _id: string;
  transactionId: string;
  job?: { _id?: string; title?: string };
  payer?: NamedRef; // server model field
  recipient?: NamedRef; // server model field
  client?: NamedRef; // some deployments may use client/worker
  worker?: NamedRef;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  status: PaymentStatus;
  description?: string;
  breakdown?: {
    grossAmount?: number;
    platformFee?: number;
    processingFee?: number;
    tax?: number;
    netAmount?: number;
  };
  error?: { code?: string; message?: string };
  notes?: string;
  initiatedAt?: string;
  processedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type FilterState = {
  status?: PaymentStatus | "all";
  method?: PaymentMethod | "all";
  type?: PaymentType | "all";
  q?: string;
};

const statusBadge = (s: PaymentStatus) => {
  const base = "text-xs px-2 py-0.5 rounded";
  switch (s) {
    case "pending":
      return `${base} bg-yellow-100 text-yellow-800`;
    case "processing":
      return `${base} bg-blue-100 text-blue-800`;
    case "completed":
      return `${base} bg-green-100 text-green-800`;
    case "refunded":
    case "partially_refunded":
      return `${base} bg-purple-100 text-purple-800`;
    case "failed":
    case "cancelled":
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-gray-100 text-gray-700`;
  }
};

const currency = (n: number, code = "ETB") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
  }).format(n);

const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [filter, setFilter] = useState<FilterState>({ status: "all" });

  // Local-only check proof previews until backend upload is added
  const [checkProofs, setCheckProofs] = useState<Record<string, string>>({});

  // Modals state
  const [activePayment, setActivePayment] = useState<PaymentItem | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [disputeAction, setDisputeAction] = useState<
    "refund" | "release" | "partial"
  >("refund");
  const [resolution, setResolution] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { page, limit };
      if (filter.status && filter.status !== "all")
        params.status = filter.status;
      // method/type filters are client-side for now (API doesn’t support yet)
      const res = await adminAPI.getPayments(params);
      const data = (res.data?.data ?? []) as unknown;
      const list: PaymentItem[] = Array.isArray(data)
        ? (data as unknown[]).map((pUnknown) => {
            const p = pUnknown as {
              _id: string;
              transactionId?: string;
              job?: PaymentItem["job"];
              payer?: NamedRef;
              recipient?: NamedRef;
              client?: NamedRef;
              worker?: NamedRef;
              amount?: number;
              currency?: string;
              paymentMethod: PaymentMethod;
              paymentType: PaymentType;
              status: PaymentStatus;
              description?: string;
              breakdown?: PaymentItem["breakdown"];
              error?: PaymentItem["error"];
              notes?: string;
              initiatedAt?: string;
              processedAt?: string;
              completedAt?: string;
              createdAt?: string;
              updatedAt?: string;
            };
            return {
              _id: p._id,
              transactionId: p.transactionId ?? "—",
              job: p.job,
              payer: p.payer ?? p.client,
              recipient: p.recipient ?? p.worker,
              client: p.client,
              worker: p.worker,
              amount: Number(p.amount ?? p.breakdown?.grossAmount ?? 0),
              currency: p.currency ?? "ETB",
              paymentMethod: p.paymentMethod,
              paymentType: p.paymentType,
              status: p.status,
              description: p.description,
              breakdown: p.breakdown,
              error: p.error,
              notes: p.notes,
              initiatedAt: p.initiatedAt ?? p.createdAt,
              processedAt: p.processedAt,
              completedAt: p.completedAt,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            } as PaymentItem;
          })
        : [];
      setPayments(list);
      setTotal(Number(res.data?.total ?? list.length));
    } catch (e) {
      console.error(e);
      setError("Failed to load payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [filter.status, limit, page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = (filter.q || "").toLowerCase().trim();
    return payments.filter((p) => {
      if (
        filter.method &&
        filter.method !== "all" &&
        p.paymentMethod !== filter.method
      )
        return false;
      if (filter.type && filter.type !== "all" && p.paymentType !== filter.type)
        return false;
      if (!q) return true;
      const hay = [
        p.transactionId,
        p.job?.title,
        p.payer?.name ?? p.client?.name,
        p.recipient?.name ?? p.worker?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [filter.method, filter.q, filter.type, payments]);

  // Summary
  const summary = useMemo(() => {
    const totalAmount = filtered.reduce((s, p) => s + (p.amount || 0), 0);
    const pending = filtered.filter((p) => p.status === "pending").length;
    const completed = filtered.filter((p) => p.status === "completed").length;
    const disputed = filtered.filter((p) =>
      ["failed", "refunded", "partially_refunded"].includes(p.status),
    ).length;
    const avg = filtered.length ? totalAmount / filtered.length : 0;
    return { totalAmount, pending, completed, disputed, avg };
  }, [filtered]);

  const onUploadProof = (p: PaymentItem, file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      setCheckProofs((prev) => ({ ...prev, [p._id]: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const openDispute = (p: PaymentItem) => {
    setActivePayment(p);
    setResolution("");
    setDisputeAction("refund");
    setShowDisputeModal(true);
  };

  const resolveDispute = async () => {
    if (!activePayment) return;
    await adminAPI.handlePaymentDispute(
      activePayment._id,
      disputeAction,
      resolution || "Resolved via admin portal",
    );
    setShowDisputeModal(false);
    setActivePayment(null);
    load();
  };

  const openMarkPaid = (p: PaymentItem) => {
    setActivePayment(p);
    setShowMarkPaidModal(true);
  };

  const markPaid = async () => {
    if (!activePayment) return;
    try {
      await adminAPI.markPaymentPaid(activePayment._id);
      setShowMarkPaidModal(false);
      setActivePayment(null);
      load();
    } catch (e: unknown) {
      console.error(e);
      alert(
        "Failed to mark as paid. Please ensure the payment is valid and try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Banknote className="h-7 w-7 text-emerald-600 mr-2" /> Payments &
            Disputes
          </h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Amount</div>
            <div className="text-2xl font-semibold">
              {currency(summary.totalAmount)}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-semibold">{summary.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-semibold">{summary.completed}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Disputes/Refunds</div>
            <div className="text-2xl font-semibold">{summary.disputed}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex items-center border rounded px-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                value={filter.q || ""}
                onChange={(e) => setFilter({ ...filter, q: e.target.value })}
                placeholder="Search txn, job, client, worker"
                className="w-full px-2 py-2 outline-none bg-transparent"
              />
            </div>

            <select
              value={filter.status || "all"}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: (e.target.value as FilterState["status"]) || "all",
                })
              }
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
              <option value="partially_refunded">Partially Refunded</option>
            </select>

            <select
              value={filter.method || "all"}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  method: (e.target.value as FilterState["method"]) || "all",
                })
              }
              className="px-3 py-2 border rounded"
            >
              <option value="all">Any Method</option>
              <option value="manual_check">Manual Check</option>
              <option value="admin_adjustment">Admin Adjustment</option>
            </select>

            <select
              value={filter.type || "all"}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  type: (e.target.value as FilterState["type"]) || "all",
                })
              }
              className="px-3 py-2 border rounded"
            >
              <option value="all">Any Type</option>
              <option value="job_payment">Job Payment</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
        </Card>

        {/* Table/list */}
        <Card className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">Loading payments...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No payments found.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left px-4 py-2">Transaction</th>
                  <th className="text-left px-4 py-2">Job</th>
                  <th className="text-left px-4 py-2">From → To</th>
                  <th className="text-left px-4 py-2">Amount</th>
                  <th className="text-left px-4 py-2">Method</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-left px-4 py-2">Created</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span
                          className="truncate max-w-[160px]"
                          title={p.transactionId}
                        >
                          {p.transactionId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">{p.job?.title || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {p.paymentType.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800">
                        {(p.payer?.name || p.client?.name || "—") +
                          " → " +
                          (p.recipient?.name || p.worker?.name || "—")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(p.payer?.role || p.client?.role || "client").replace(
                          "_",
                          " ",
                        )}{" "}
                        →{" "}
                        {(
                          p.recipient?.role ||
                          p.worker?.role ||
                          "worker"
                        ).replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {currency(p.amount, p.currency)}
                      </div>
                      {p.breakdown?.platformFee ? (
                        <div className="text-xs text-gray-500">
                          Fee: {currency(p.breakdown.platformFee, p.currency)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {p.paymentMethod.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={statusBadge(p.status)}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {p.paymentMethod === "manual_check" &&
                        p.status !== "completed" ? (
                          <Button
                            variant="outline"
                            onClick={() => openMarkPaid(p)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Paid
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          onClick={() => openDispute(p)}
                        >
                          <ShieldAlert className="h-4 w-4 mr-1" /> Resolve
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Pagination */}
        {!loading && total > limit ? (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Page {page} of {Math.ceil(total / limit)} • {total} total
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <XCircle className="hidden" /> Prev
              </Button>
              <Button
                variant="outline"
                disabled={page >= Math.ceil(total / limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}

        {/* Dispute Modal */}
        <Modal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          title="Resolve Dispute"
        >
          <div className="p-4">
            <div className="flex items-center mb-3">
              <ShieldAlert className="h-5 w-5 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-blue-800">
                Resolve Dispute
              </h2>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Choose an action and provide a short resolution note.
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-gray-700">Action</label>
                <select
                  value={disputeAction}
                  onChange={(e) =>
                    setDisputeAction(e.target.value as typeof disputeAction)
                  }
                  className="mt-1 w-full border rounded px-3 py-2"
                >
                  <option value="refund">Refund to client</option>
                  <option value="release">Release to worker</option>
                  <option value="partial">Partial refund</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Resolution note</label>
                <Input
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="e.g., Quality concerns validated; refund approved"
                />
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Info className="h-4 w-4 mr-1" /> Notifications will be sent to
                both parties.
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={resolveDispute}>Confirm</Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Mark Paid Modal */}
        <Modal
          isOpen={showMarkPaidModal}
          onClose={() => setShowMarkPaidModal(false)}
          title="Mark Payment as Paid"
        >
          <div className="p-4">
            <div className="flex items-center mb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2" />
              <h2 className="text-lg font-semibold text-blue-700">
                Mark Payment as Paid
              </h2>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Upload a photo/scan of the check for internal records (storage
              integration coming soon).
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm text-gray-700">
                  Attach Check Image
                </label>
                <label className="mt-1 flex items-center gap-2 border rounded px-3 py-2 cursor-pointer hover:bg-gray-50">
                  <CloudUpload className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">Choose file…</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      activePayment &&
                      onUploadProof(activePayment, e.target.files?.[0])
                    }
                  />
                </label>
                {activePayment && checkProofs[activePayment._id] ? (
                  <div className="mt-2">
                    <Image
                      src={checkProofs[activePayment._id]}
                      alt="Check Preview"
                      width={160}
                      height={96}
                      className="h-24 w-auto rounded border"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-4 w-4 mr-1" /> This will mark the payment
                completed and update the related job.
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMarkPaidModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={markPaid}>Mark Paid</Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminPaymentsPage;
