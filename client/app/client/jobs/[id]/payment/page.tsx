"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Image from "next/image";
import {
  ArrowLeft,
  ImageIcon,
  MessageCircle,
  UploadCloud,
  X,
} from "lucide-react";

type Payment = {
  _id: string;
  job?: { _id: string; title?: string } | string;
  amount: number;
  currency?: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded";
  paymentMethod?: string;
  proof?: {
    imageData?: string;
    filename?: string;
    uploadedAt?: string;
    note?: string;
  };
};

type Job = {
  _id: string;
  title: string;
  status: string;
  worker?: { name?: string };
};

const ClientJobPaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });

  const pickFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const max = 8 * 1024 * 1024; // 8MB
    if (file.size > max) {
      alert("Image too large. Please select a file under 8MB.");
      return;
    }
    const dataUrl = await readAsDataURL(file);
    setPreview(dataUrl);
    setMeta({ name: file.name, size: file.size });
  };

  const targetPayment = useMemo(() => {
    const jobId = String(id);
    const match = payments.find(
      (p) =>
        (typeof p.job === "string" ? p.job === jobId : p.job?._id === jobId) &&
        ["pending", "processing"].includes(p.status),
    );
    return match || null;
  }, [payments, id]);

  const completedPayment = useMemo(() => {
    const jobId = String(id);
    return (
      payments.find(
        (p) =>
          (typeof p.job === "string"
            ? p.job === jobId
            : p.job?._id === jobId) && p.status === "completed",
      ) || null
    );
  }, [payments, id]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobRes, payRes] = await Promise.all([
        clientAPI.getJob(String(id)),
        clientAPI.getPayments(),
      ]);
      const jobData =
        jobRes.data?.data?.job || jobRes.data?.data || jobRes.data;
      setJob(jobData);
      setPayments(payRes.data?.data || payRes.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load payment info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const uploadProof = async () => {
    if (!targetPayment || !preview) return;
    setSubmitting(true);
    try {
      await clientAPI.uploadPaymentProof(targetPayment._id, {
        imageData: preview,
        note: note.trim() || undefined,
      });
      await load();
      setPreview(null);
      setMeta(null);
      setNote("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/client/jobs/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">Review & Pay</h1>
      </div>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {job?.title || "Job"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Worker: {job?.worker?.name || "—"}
            </p>
            <Badge
              className="mt-2"
              variant={
                job?.status === "submitted"
                  ? "success"
                  : job?.status === "revision_requested"
                    ? "warning"
                    : job?.status === "completed"
                      ? "secondary"
                      : "secondary"
              }
            >
              {job?.status?.replace("_", " ")}
            </Badge>
          </div>
          {targetPayment && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Amount</div>
              <div className="text-2xl font-bold text-gray-900">
                {targetPayment.currency || "ETB"}{" "}
                {targetPayment.amount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Status: {targetPayment.status}
              </div>
            </div>
          )}
        </div>
      </Card>

      {!targetPayment && !completedPayment && (
        <Card className="p-5">
          <p className="text-sm text-gray-700">
            No payment record found for this job yet. If you just accepted,
            please refresh shortly.
          </p>
        </Card>
      )}

      {completedPayment && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">Payment Completed</h3>
          <p className="text-sm text-gray-600 mt-1">
            {completedPayment.currency || "ETB"}{" "}
            {completedPayment.amount.toLocaleString()} •{" "}
            {completedPayment.status}
          </p>
          {completedPayment.proof?.imageData && (
            <div className="mt-3 relative w-full max-w-md aspect-video bg-gray-100 rounded overflow-hidden border">
              <Image
                src={completedPayment.proof.imageData}
                alt="uploaded proof"
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="mt-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/client/jobs/${id}`)}
            >
              Back to Job
            </Button>
            <Button
              className="ml-2"
              variant="outline"
              onClick={() => router.push(`/client/jobs/${id}/applications`)}
            >
              <MessageCircle className="h-4 w-4 mr-1" /> Messages
            </Button>
          </div>
        </Card>
      )}

      {targetPayment && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900">
            Upload Payment Proof (Check)
          </h3>
          {targetPayment.proof?.imageData && !preview && (
            <div className="mt-3 text-xs text-gray-600">
              A proof is already uploaded. You can replace it by uploading a new
              one.
            </div>
          )}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer?.files?.[0];
              void pickFile(f || null);
            }}
            className={`mt-3 rounded-lg border-2 ${dragOver ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-300 bg-gray-50"} p-6 flex flex-col items-center justify-center text-center`}
          >
            <UploadCloud className="h-8 w-8 text-gray-500" />
            <p className="mt-2 text-sm text-gray-700">
              Drag and drop your check image here, or
              <label
                htmlFor="proof-file"
                className="ml-1 inline-flex items-center px-3 py-1.5 rounded bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
              >
                <ImageIcon className="h-4 w-4 mr-1" /> Choose file
              </label>
            </p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 8MB</p>
            <input
              id="proof-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
          </div>

          {(preview || targetPayment.proof?.imageData) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden border">
                <Image
                  src={preview || targetPayment.proof?.imageData || ""}
                  alt="proof preview"
                  fill
                  className="object-cover"
                />
                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setMeta(null);
                    }}
                    className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow"
                    aria-label="Remove selected image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div>
                {meta && (
                  <>
                    <h4 className="text-sm font-medium text-gray-900">
                      Selected file
                    </h4>
                    <p className="text-sm text-gray-700 mt-1 break-all">
                      {meta.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(meta.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </>
                )}
                <textarea
                  rows={3}
                  className="mt-3 w-full border rounded px-3 py-2"
                  placeholder="Optional note for admins"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/client/jobs/${id}`)}
            >
              Back
            </Button>
            <Button onClick={uploadProof} disabled={submitting || !preview}>
              Upload
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClientJobPaymentPage;
