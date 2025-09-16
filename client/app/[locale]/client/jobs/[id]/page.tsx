"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useParams, useRouter } from "next/navigation";
import { clientAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Image from "next/image";
import {
  MessageCircle,
  CheckCircle,
  Undo2,
  Star,
  UploadCloud,
  ImageIcon,
  X,
} from "lucide-react";

type ProgressUpdate = {
  message?: string;
  updatedAt?: string;
  attachments?: string[];
  updatedBy?: { name?: string } | string;
};

type Job = {
  _id: string;
  title: string;
  description?: string;
  status: string;
  deadline?: string;
  worker?: { _id: string; name?: string } | null;
  progress?: { percentage?: number; updates?: ProgressUpdate[] };
  messages?: Array<{
    _id?: string;
    content?: string;
    attachments?: string[];
    sender?: { name?: string; role?: string };
    sentAt?: string;
  }>;
  review?: {
    clientReview?: { rating?: number; comment?: string };
  };
};

const ClientJobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Complete/Review modal
  const [showComplete, setShowComplete] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  // Revision modal
  const [showRevision, setShowRevision] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  // Payment proof modal
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [proofMeta, setProofMeta] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await clientAPI.getJob(String(id));
      const data = res.data?.data;
      const j: Job | undefined =
        data?.job || res.data?.job || res.data?.data || res.data;
      if (!j) throw new Error("Job not found");
      setJob(j);
    } catch (e: unknown) {
      console.error(e);
      const hasMessage = (val: unknown): val is { message: string } => {
        if (typeof val !== "object" || val === null) return false;
        const rec = val as Record<string, unknown>;
        return typeof rec.message === "string";
      };
      const msg = hasMessage(e) ? e.message : "Failed to load job";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canReview = useMemo(() => job?.status === "submitted", [job?.status]);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await clientAPI.completeJobWithRating(
        String(id),
        rating,
        review.trim(),
      );
      const { paymentId } = res.data?.data || {};
      setPendingPaymentId(paymentId || null);
      setShowComplete(false);
      if (paymentId) {
        setShowProof(true);
      }
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    setSubmitting(true);
    try {
      await clientAPI.requestRevision(String(id), revisionReason.trim());
      setShowRevision(false);
      setRevisionReason("");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const readAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });

  const pickProofFile = async (file: File | null) => {
    if (!file) return;
    // Basic validation: image type and size <= 8MB
    if (!file.type.startsWith("image/")) return;
    const max = 8 * 1024 * 1024;
    if (file.size > max) {
      toast.error("Image too large. Please select a file under 8MB.");
      return;
    }
    const dataUrl = await readAsDataURL(file);
    setProofPreview(dataUrl);
    setProofMeta({ name: file.name, size: file.size });
  };

  const onPickProof = async (file: File | null) => {
    await pickProofFile(file);
  };

  const uploadProof = async () => {
    if (!pendingPaymentId || !proofPreview) {
      setShowProof(false);
      return;
    }
    setSubmitting(true);
    try {
      await clientAPI.uploadPaymentProof(pendingPaymentId, {
        imageData: proofPreview,
        note: proofNote.trim() || undefined,
      });
      setShowProof(false);
      setPendingPaymentId(null);
      setProofPreview(null);
      setProofMeta(null);
      setProofNote("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;
  if (error || !job)
    return <div className="p-6">{error || "Job not found"}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500 p-[1px]">
        <div className="rounded-[11px] bg-gray-900/70 backdrop-blur p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {job.title}
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Assigned worker:{" "}
                <span className="font-medium">{job.worker?.name || "—"}</span>
              </p>
            </div>
            <Badge
              variant={
                job.status === "submitted"
                  ? "success"
                  : job.status === "in_progress"
                    ? "primary"
                    : job.status === "revision_requested"
                      ? "warning"
                      : job.status === "completed"
                        ? "secondary"
                        : "secondary"
              }
            >
              {job.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
        <p className="text-gray-700 whitespace-pre-wrap">
          {job.description || "No description."}
        </p>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/client/jobs/${job._id}/applications`)}
          >
            <MessageCircle className="h-4 w-4 mr-1" /> Messages
          </Button>
          {canReview && (
            <>
              <Button onClick={() => setShowComplete(true)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Accept & Complete
              </Button>
              <Button variant="outline" onClick={() => setShowRevision(true)}>
                <Undo2 className="h-4 w-4 mr-1" /> Request Revision
              </Button>
            </>
          )}
          {job.status === "completed" && (
            <div className="text-sm text-gray-600">
              Job completed. Thank you!
            </div>
          )}
          {job.status === "revision_requested" && (
            <div className="text-sm text-gray-600">
              Revision requested. Waiting on worker.
            </div>
          )}
        </div>
      </Card>

      {/* Progress updates */}
      {job.progress?.updates && job.progress.updates.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Updates</h2>
          <div className="space-y-3">
            {job.progress.updates.map((u, i) => (
              <div key={i} className="border rounded-lg p-3 bg-white">
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>
                    {typeof u.updatedBy === "string"
                      ? u.updatedBy
                      : u.updatedBy?.name || "Worker"}
                  </span>
                  <span>
                    {u.updatedAt ? new Date(u.updatedAt).toLocaleString() : ""}
                  </span>
                </div>
                {u.message && (
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                    {u.message}
                  </p>
                )}
                {!!u.attachments?.length && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {u.attachments.map((a, idx) => (
                      <div
                        key={idx}
                        className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden border"
                      >
                        {a.startsWith("data:image") ? (
                          <Image
                            src={a}
                            alt={`attachment-${idx}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                            Attachment
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Complete & Review Modal */}
      <Modal
        isOpen={showComplete}
        onClose={() => setShowComplete(false)}
        title="Accept & Complete"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-700">Rating</label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className={`p-1 rounded transition-colors ${i <= rating ? "text-yellow-500" : "text-gray-300"}`}
                  aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`h-6 w-6 ${i <= rating ? "fill-yellow-500" : "fill-none"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700">Review (optional)</label>
            <textarea
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="Share your feedback…"
              value={review}
              onChange={(e) => setReview(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowComplete(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={submitting}>
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Request Revision Modal */}
      <Modal
        isOpen={showRevision}
        onClose={() => setShowRevision(false)}
        title="Request Revision"
      >
        <div className="space-y-3">
          <label className="text-sm text-gray-700">Reason</label>
          <textarea
            rows={4}
            className="w-full border rounded px-3 py-2"
            placeholder="Describe what needs to be improved…"
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRevision(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={submitting || !revisionReason.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Proof Modal */}
      <Modal
        isOpen={showProof}
        onClose={() => setShowProof(false)}
        title="Upload Payment Proof (Check)"
      >
        <div className="space-y-4">
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
              void onPickProof(f || null);
            }}
            className={`rounded-lg border-2 ${dragOver ? "border-blue-500 bg-blue-50" : "border-dashed border-gray-300 bg-gray-50"} p-6 flex flex-col items-center justify-center text-center`}
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
              onChange={(e) => onPickProof(e.target.files?.[0] || null)}
            />
          </div>

          {proofPreview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden border">
                <Image
                  src={proofPreview}
                  alt="check preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProofPreview(null);
                    setProofMeta(null);
                  }}
                  className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow"
                  aria-label="Remove selected image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Selected file
                </h3>
                <p className="text-sm text-gray-700 mt-1 break-all">
                  {proofMeta?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {proofMeta
                    ? `${(proofMeta.size / (1024 * 1024)).toFixed(2)} MB`
                    : ""}
                </p>
                <textarea
                  rows={3}
                  className="mt-3 w-full border rounded px-3 py-2"
                  placeholder="Optional note for admins"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowProof(false)}>
              Skip
            </Button>
            <Button
              onClick={uploadProof}
              disabled={submitting || !proofPreview}
            >
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClientJobDetailPage;
