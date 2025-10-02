"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { clientAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import UniversalChatSystem from "@/components/ui/UniversalChatSystem";
import CVDisplay from "@/components/ui/CVDisplay";
import { toast } from "@/components/ui/sonner";
import { Search, Filter, Check, X, MessageCircle, Eye } from "lucide-react";
import Image from "next/image";
import LoadingPage from "@/components/Layout/LoadingPage";
import ErrorPage from "@/components/Layout/ErrorPage";

interface WorkerInfo {
  _id: string;
  name: string;
  profile?: {
    avatar?: string;
    cv?: {
      data: string | object;
      mimeType: string;
      name: string;
    };
  };
  workerProfile?: { rating?: number; skills?: string[] };
}
interface Application {
  _id: string;
  proposal: string;
  proposedBudget: number;
  status: string;
  appliedAt: string;
  worker: WorkerInfo;
}
interface JobDetail {
  _id: string;
  title: string;
  status: string;
  budget: number;
  deadline: string;
  description: string;
}
interface ChatMessage {
  _id?: string;
  content: string;
<<<<<<< HEAD
  sender?: { _id?: string; name?: string; role?: string };
=======
  sender?: { name?: string; role?: string; _id?: string };
>>>>>>> 6e455b34cc23b044ddfa4941b29e08ae249df9bc
  sentAt: string;
  attachments?: string[];
}

const ApplicationsPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  // Removed unused selectedApp state
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedWorkerCV, setSelectedWorkerCV] = useState<object | null>(null);
  type ModernMessage = {
    id: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    attachments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
    }>;
    uploadProgress?: number;
  };
  const [modernMessages, setModernMessages] = useState<ModernMessage[]>([]);
  const currentUser = useMemo(() => getStoredUser(), []);
  const currentUserId = currentUser?._id || "client";

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const user = currentUser;
      if (!user || !hasRole(user, ["client"])) {
        router.push("/login");
        return;
      }
      const jobRes = await clientAPI.getJob(jobId);
      console.log("jobs", jobRes);
      setJob(
        jobRes.data.job ||
          jobRes.data.data?.job ||
          jobRes.data.data?.job ||
          jobRes.data.data?.job,
      ); // fallback chain
      const apps =
        jobRes.data.applications || jobRes.data.data?.applications || [];
      console.log("applications", apps);
      setApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [jobId, router, currentUser]);

  useEffect(() => {
    if (jobId) load();
  }, [jobId, load]);

  const filtered = applications.filter(
    (a) =>
      (filterStatus === "all" || a.status === filterStatus) &&
      (a.worker.name.toLowerCase().includes(search.toLowerCase()) ||
        a.proposal.toLowerCase().includes(search.toLowerCase())),
  );

  const accept = async (applicationId: string) => {
    await clientAPI.acceptApplication(jobId, applicationId);
    await load();
  };
  const reject = async (applicationId: string) => {
    await clientAPI.rejectApplication(jobId, applicationId);
    await load();
  };

  const viewWorkerCV = (worker: WorkerInfo) => {
    if (worker.profile?.cv?.data) {
      try {
        const cvData =
          typeof worker.profile.cv.data === "string"
            ? JSON.parse(worker.profile.cv.data)
            : worker.profile.cv.data;
        setSelectedWorkerCV(cvData);
        setShowCVModal(true);
      } catch {
        toast.error("Unable to load CV data");
      }
    } else {
      toast.error("No CV available for this worker");
    }
  };
  const normalizeChatMessage = useCallback(
    (message: ChatMessage, fallbackIndex: number): ModernMessage => {
      const attachments = Array.isArray(message.attachments)
        ? message.attachments.map((url, index) => {
            const isImage =
              /^data:image\//.test(url) ||
              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
            const nameFromUrl = decodeURIComponent(url.split("/").pop() || "");
            return {
              id: `${message._id || fallbackIndex}-att-${index}`,
              name: nameFromUrl || `Attachment ${index + 1}`,
              url,
              type: isImage ? "image/*" : "application/octet-stream",
            };
          })
        : [];

      const senderRole = message.sender?.role;
      const senderId =
        message.sender?._id?.toString?.() ||
        (senderRole === "client" ? currentUserId : "worker");
      const senderName =
        message.sender?.name ||
        (senderRole === "client"
          ? "You"
          : senderRole === "worker"
            ? "Worker"
            : "Admin");

      return {
        id: message._id || `msg-${fallbackIndex}`,
        senderId,
        senderName,
        content: message.content,
        timestamp: message.sentAt,
        attachments,
      };
    },
    [currentUserId],
  );

  const fileToDataUrl = useCallback(
    (file: File, onProgress?: (value: number) => void) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") {
            resolve(result);
          } else {
            reject(new Error("Unable to read file"));
          }
        };
        reader.onerror = () =>
          reject(reader.error || new Error("File read failed"));
        reader.onprogress = (event) => {
          if (!onProgress) return;
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        reader.readAsDataURL(file);
      }),
    [],
  );

  const openMessages = useCallback(async () => {
    try {
      setShowChat(true);
      const res = await clientAPI.getJobMessages(jobId);
      const messages = (res.data.data || []) as ChatMessage[];
      const converted = messages.map((message, index) =>
        normalizeChatMessage(message, index),
      );
      converted.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      setModernMessages(converted);
    } catch (error) {
      console.error(error);
    }
  }, [jobId, normalizeChatMessage]);

  const sendModernMessage = useCallback(
    async (content: string, files?: File[]) => {
      const trimmed = content.trim();
      const hasAttachments = Boolean(files && files.length > 0);
      if (!trimmed && !hasAttachments) return;

      const pendingId = `pending-${Date.now()}`;
      const tempAttachmentUrls: string[] = [];
      const optimisticAttachments = (files || []).map((file, index) => {
        const url = URL.createObjectURL(file);
        tempAttachmentUrls.push(url);
        return {
          id: `${pendingId}-att-${index}`,
          name: file.name,
          url,
          type: file.type || "application/octet-stream",
        };
      });

      const optimisticMessage: ModernMessage = {
        id: pendingId,
        senderId: currentUserId,
        senderName: "You",
        content: trimmed,
        timestamp: new Date().toISOString(),
        attachments: optimisticAttachments,
        uploadProgress: hasAttachments ? 5 : undefined,
      };

      setModernMessages((prev) => [...prev, optimisticMessage]);

      const updateMessageProgress = (value: number) => {
        if (!hasAttachments) return;
        const bounded = Math.max(1, Math.min(99, Math.round(value)));
        setModernMessages((prev) =>
          prev.map((message) =>
            message.id === pendingId
              ? { ...message, uploadProgress: bounded }
              : message,
          ),
        );
      };

      try {
        let attachmentDataUrls: string[] | undefined;
        if (hasAttachments && files) {
          const total = files.length;
          attachmentDataUrls = [];
          for (let index = 0; index < total; index += 1) {
            const file = files[index];
            const dataUrl = await fileToDataUrl(file, (progress) => {
              const base = index / total;
              const combined = base + (progress / 100) * (1 / total);
              updateMessageProgress(10 + combined * 60);
            });
            attachmentDataUrls.push(dataUrl);
          }
          updateMessageProgress(70);
        }

        const response = await clientAPI.sendJobMessage(
          jobId,
          trimmed,
          attachmentDataUrls,
          hasAttachments
            ? {
                onUploadProgress: (event) => {
                  if (!event.total) {
                    updateMessageProgress(90);
                    return;
                  }
                  const ratio = event.loaded / event.total;
                  updateMessageProgress(70 + ratio * 25);
                },
              }
            : undefined,
        );

        const apiMessage = response.data?.data as ChatMessage | undefined;
        if (apiMessage) {
          if (hasAttachments) {
            updateMessageProgress(100);
          }
          const savedMessage = normalizeChatMessage(apiMessage, 0);
          setModernMessages((prev) =>
            prev.map((message) =>
              message.id === pendingId ? savedMessage : message,
            ),
          );
          toast.success("Message sent");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to send message");
        setModernMessages((prev) =>
          prev.filter((message) => message.id !== pendingId),
        );
        throw error;
      } finally {
        tempAttachmentUrls.forEach((url) => URL.revokeObjectURL(url));
      }
    },
    [currentUserId, fileToDataUrl, jobId, normalizeChatMessage],
  );

  // Poll chat while chat is open
  useEffect(() => {
    if (!showChat) return;
    const interval = setInterval(() => {
      clientAPI
        .getJobMessages(jobId)
        .then((res) => {
          const messages = (res.data.data || []) as ChatMessage[];
          const converted = messages.map((message, index) =>
            normalizeChatMessage(message, index),
          );
          converted.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          );
          setModernMessages((prev) => {
            const pending = prev.filter((message) =>
              message.id.startsWith("pending-"),
            );
            const merged = [...converted, ...pending];
            merged.sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );
            return merged;
          });
        })
        .catch(() => {
          /* ignore polling errors */
        });
    }, 4000);
    return () => clearInterval(interval);
  }, [showChat, jobId, normalizeChatMessage]);

  // Cleanup blob URLs from optimistic messages
  useEffect(() => {
    return () => {
      modernMessages.forEach((message) => {
        if (message.attachments) {
          message.attachments.forEach((att) => {
            if (att.url.startsWith("blob:")) {
              URL.revokeObjectURL(att.url);
            }
          });
        }
      });
    };
  }, [modernMessages]);

  if (loading) return <LoadingPage />;
  if (!job) return <ErrorPage message="Job not found" />;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 min-h-[41vh]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications for: {job.title}</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/client/dashboard")}
          >
            Back
          </Button>
          <Button onClick={openMessages}>
            <MessageCircle className="h-4 w-4 mr-1" />
            Messages
          </Button>
        </div>
      </div>

      <Card className="p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search proposals or workers"
            className="border rounded px-2 py-1 text-sm text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="h-4 w-4 text-gray-500" />
          {["all", "pending", "accepted", "rejected", "withdrawn"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded text-sm ${
                filterStatus === s ? "bg-blue-600 text-white" : "border"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No applications found.</p>
        ) : (
          filtered.map((app) => (
            <Card
              key={app._id}
              className="p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  {app.worker.profile?.avatar ? (
                    <Image
                      src={app.worker.profile.avatar}
                      alt={app.worker.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-15 h-15 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                      {app.worker.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {app.worker.name}
                      </h3>
                      <Badge
                        variant={
                          app.status === "accepted"
                            ? "primary"
                            : app.status === "rejected"
                              ? "danger"
                              : "secondary"
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Proposed Budget:</span>{" "}
                        ETB {app.proposedBudget.toFixed(2)}
                      </div>
                      {app.worker.workerProfile?.rating && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Rating:</span> ⭐{" "}
                          {app.worker.workerProfile.rating}/5
                        </div>
                      )}
                      {app.worker.workerProfile?.skills && (
                        <div className="text-sm text-gray-600 md:col-span-2">
                          <span className="font-medium">Skills:</span>{" "}
                          {app.worker.workerProfile.skills
                            .slice(0, 3)
                            .join(", ")}
                          {app.worker.workerProfile.skills.length > 3 &&
                            ` +${app.worker.workerProfile.skills.length - 3} more`}
                        </div>
                      )}
                    </div>

                    {app.proposal && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          <span className="font-medium">Proposal:</span>{" "}
                          {app.proposal}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-max">
                  {app.worker.profile?.cv && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewWorkerCV(app.worker)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View CV
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={openMessages}>
                    <MessageCircle className="h-4 w-4 mr-1" /> Message
                  </Button>
                  {app.status !== "accepted" && (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          await accept(app._id);
                          toast.success("Application accepted");
                        } catch (e) {
                          console.error(e);
                          toast.error("Failed to accept application");
                        }
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                  )}
                  {app.status !== "rejected" && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        try {
                          await reject(app._id);
                          toast.success("Application rejected");
                        } catch (e) {
                          console.error(e);
                          toast.error("Failed to reject application");
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {job && (
        <UniversalChatSystem
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          onSendMessage={sendModernMessage}
          messages={modernMessages}
          currentUserId={getStoredUser()?._id || "client"}
          recipientName={"Worker"}
          recipientRole="worker"
          mode="chat"
          title={`Job Messages - ${job.title}`}
          placeholder="Write your message..."
        />
      )}

      {/* CV Modal */}
      {showCVModal && selectedWorkerCV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Worker CV</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCVModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <CVDisplay
                cvData={
                  selectedWorkerCV as {
                    personalInfo: {
                      fullName: string;
                      email: string;
                      phone: string;
                      address: string;
                      summary: string;
                      workerSkills: string[];
                      workerExperience: string;
                      workerHourlyRate: number;
                      portfolio: string;
                      dateOfBirth: string;
                      gender: string;
                    };
                    education: Array<{
                      institution: string;
                      degree: string;
                      fieldOfStudy: string;
                      startDate: string;
                      endDate: string;
                      current: boolean;
                    }>;
                    experience: Array<{
                      company: string;
                      position: string;
                      startDate: string;
                      endDate: string;
                      current: boolean;
                      description: string;
                    }>;
                    detailedSkills: Array<{
                      name: string;
                      level: string;
                    }>;
                  }
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApplicationsPage;
