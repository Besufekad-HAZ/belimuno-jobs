"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { clientAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import UniversalChatSystem from "@/components/ui/UniversalChatSystem";
import { toast } from "@/components/ui/sonner";
import { Search, Filter, Check, X, MessageCircle } from "lucide-react";
import Image from "next/image";
import LoadingPage from "@/components/Layout/LoadingPage";
import ErrorPage from "@/components/Layout/ErrorPage";

interface WorkerInfo {
  _id: string;
  name: string;
  profile?: { avatar?: string };
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
  content: string;
  sender?: { name?: string; role?: string };
  sentAt: string;
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
  };
  const [modernMessages, setModernMessages] = useState<ModernMessage[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const user = getStoredUser();
      if (!user || !hasRole(user, ["client"])) {
        router.push("/login");
        return;
      }
      const jobRes = await clientAPI.getJob(jobId);
      setJob(
        jobRes.data.job ||
          jobRes.data.data?.job ||
          jobRes.data.data?.job ||
          jobRes.data.data?.job,
      ); // fallback chain
      const apps =
        jobRes.data.applications || jobRes.data.data?.applications || [];
      setApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

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

  const openMessages = async () => {
    try {
      setShowChat(true);
      const res = await clientAPI.getJobMessages(jobId);
      const messages = (res.data.data || []) as ChatMessage[];
      const converted: ModernMessage[] = messages.map((m, index) => {
        const atts = Array.isArray((m as any).attachments)
          ? ((m as any).attachments as string[]).map((url, ai) => {
              const isImage = /^data:image\//.test(url) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
              const nameFromUrl = decodeURIComponent(url.split("/").pop() || "");
              return {
                id: `${index}-att-${ai}`,
                name: nameFromUrl || `Attachment ${ai + 1}`,
                url,
                type: isImage ? "image/*" : "application/octet-stream",
              };
            })
          : [];
        return {
          id: `msg-${index}-${Date.now()}`,
          senderId:
            m.sender?.role === "client"
              ? getStoredUser()?._id || "client"
              : "worker",
          senderName:
            m.sender?.name || (m.sender?.role === "client" ? "You" : "Worker"),
          content: m.content,
          timestamp: m.sentAt,
          attachments: atts,
        };
      });
      setModernMessages(converted);
    } catch (e) {
      console.error(e);
    }
  };

  const sendModernMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && !(files && files.length)) return;
    const fileToDataURL = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticAttachments = files
      ? files.map((file, index) => ({
          id: `${optimisticId}-att-${index}`,
          name: file.name,
          url: URL.createObjectURL(file), // Use a temporary blob URL for the preview
          type: file.type,
        }))
      : [];

    const optimisticMessage: ModernMessage = {
      id: optimisticId,
      senderId: getStoredUser()?._id || "client",
      senderName: "You",
      content,
      timestamp: new Date().toISOString(),
      attachments: optimisticAttachments,
    };

    setModernMessages((prev) => [...prev, optimisticMessage]);

    try {
      const attachmentDataUrls = files && files.length
        ? await Promise.all(files.map((f) => fileToDataURL(f)))
        : [];
      await clientAPI.sendJobMessage(jobId, content, attachmentDataUrls);
      toast.success("Message sent");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
      // If the API call fails, remove the optimistic message
      setModernMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      throw e;
    }
  };
  // Poll chat while chat is open
  useEffect(() => {
    if (!showChat) return;
    const interval = setInterval(() => {
      // No need for a full re-render, just fetch in the background
      // The main `openMessages` function can be used to manually refresh.
      clientAPI.getJobMessages(jobId).then(res => {
        const messages = (res.data.data || []) as ChatMessage[];
        const converted = messages.map((m, index) => {
          const atts = Array.isArray((m as any).attachments)
            ? ((m as any).attachments as string[]).map((url, ai) => {
                const isImage = /^data:image\//.test(url) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
                const nameFromUrl = decodeURIComponent(url.split("/").pop() || "");
                return {
                  id: `${(m as any)._id || index}-att-${ai}`,
                  name: nameFromUrl || `Attachment ${ai + 1}`,
                  url,
                  type: isImage ? "image/*" : "application/octet-stream",
                };
              })
            : [];
          return {
            id: (m as any)._id || `msg-${index}`,
            senderId:
              m.sender?.role === "client"
                ? getStoredUser()?._id || "client"
                : "worker",
            senderName:
              m.sender?.name || (m.sender?.role === "client" ? "You" : "Worker"),
            content: m.content,
            timestamp: m.sentAt,
            attachments: atts,
          };
        });
        setModernMessages(prev => {
          // A simple merge strategy to avoid disrupting optimistic messages
          const existingIds = new Set(prev.map(msg => msg.id));
          const newMessages = converted.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...newMessages];
        });
      }).catch(() => { /* ignore polling errors */ });
    }, 4000);
    return () => clearInterval(interval);
  }, [showChat, jobId]);

  // Cleanup blob URLs from optimistic messages
  useEffect(() => {
    return () => {
      modernMessages.forEach(message => {
        if (message.attachments) {
          message.attachments.forEach(att => {
            if (att.url.startsWith('blob:')) {
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
              className="p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {app.worker.profile?.avatar ? (
                  <Image
                    src={app.worker.profile.avatar}
                    alt={app.worker.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                )}
                <div>
                  <div className="font-medium">{app.worker.name}</div>
                  <div className="text-sm text-gray-500">
                    Budget: ${app.proposedBudget.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    Status: <Badge>{app.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={openMessages}>
                  <MessageCircle className="h-4 w-4 mr-1" /> Message
                </Button>
                {app.status !== "accepted" && (
                  <Button
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
                    variant="outline"
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
    </div>
  );
};
export default ApplicationsPage;
