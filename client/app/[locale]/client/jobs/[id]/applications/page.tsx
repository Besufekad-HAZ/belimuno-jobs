"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { clientAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import {
  Search,
  Filter,
  User,
  Check,
  X,
  MessageCircle,
  Paperclip,
  Smile,
  FileText,
} from "lucide-react";
import Image from "next/image";

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
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageModal, setMessageModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  type PendingAttachment = {
    name: string;
    type: string;
    size: number;
    dataUrl: string;
  };
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const chatRef = React.useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);

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
      setMessageModal(true);
      const res = await clientAPI.getJobMessages(jobId);
      setChatMessages(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      const res = await clientAPI.sendJobMessage(
        jobId,
        newMessage.trim(),
        attachments.map((a) => a.dataUrl),
      );
      setChatMessages((prev) => [...prev, res.data.data]);
      setNewMessage("");
      setAttachments([]);
      setShowEmoji(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const addFiles = async (files: FileList | null) => {
    const list = Array.from(files || []).slice(0, 5 - attachments.length);
    if (list.length === 0) return;
    const reads = await Promise.all(
      list.map(
        (f) =>
          new Promise<PendingAttachment>((res) => {
            const r = new FileReader();
            r.onload = () =>
              res({
                name: f.name,
                type: f.type,
                size: f.size,
                dataUrl: String(r.result),
              });
            r.readAsDataURL(f);
          }),
      ),
    );
    setAttachments((prev) => [...prev, ...reads]);
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    if (!el) {
      setNewMessage((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const next = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + emoji.length;
      el.setSelectionRange(caret, caret);
    });
  };

  // Auto-scroll to bottom when opening and whenever messages change
  const scrollToBottom = () => {
    const el = chatRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };
  useEffect(() => {
    if (messageModal) scrollToBottom();
  }, [messageModal]);
  useEffect(() => {
    if (messageModal) scrollToBottom();
  }, [chatMessages, attachments, messageModal]);

  // Poll chat while modal open
  useEffect(() => {
    if (!messageModal) return;
    const interval = setInterval(async () => {
      try {
        const res = await clientAPI.getJobMessages(jobId);
        setChatMessages(res.data.data || []);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [messageModal, jobId]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = document.getElementById("client-chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!job) return <div className="p-8">Job not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
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
              className={`text-xs px-2 py-1 rounded border ${filterStatus === s ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm text-gray-500">
          {filtered.length} / {applications.length} shown
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map((app) => (
          <Card key={app._id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {app.worker.name}
                  </span>
                  <Badge
                    variant={
                      app.status === "accepted"
                        ? "success"
                        : app.status === "rejected"
                          ? "danger"
                          : "secondary"
                    }
                  >
                    {app.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded p-2 line-clamp-2">
                  {app.proposal}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-green-600">
                    ETB {app.proposedBudget.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400">
                    Applied {new Date(app.appliedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {app.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reject(app._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => accept(app._id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedApp(app)}
                >
                  View
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            No applications match your filters.
          </Card>
        )}
      </div>

      {/* Application detail modal */}
      <Modal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title="Application Details"
        size="md"
      >
        {selectedApp && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">
                {selectedApp.worker.name}
              </h3>
              <Badge
                variant={
                  selectedApp.status === "accepted"
                    ? "success"
                    : selectedApp.status === "rejected"
                      ? "danger"
                      : "secondary"
                }
              >
                {selectedApp.status}
              </Badge>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">
                Proposal
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {selectedApp.proposal}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Budget</p>
                <p className="font-semibold text-green-600">
                  ETB {selectedApp.proposedBudget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Applied</p>
                <p className="text-gray-900">
                  {new Date(selectedApp.appliedAt).toLocaleString()}
                </p>
              </div>
            </div>
            {selectedApp.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => reject(selectedApp._id)}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => accept(selectedApp._id)}
                  className="flex-1"
                >
                  Accept
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Messaging modal */}
      <Modal
        isOpen={messageModal}
        onClose={() => setMessageModal(false)}
        title="Job Messages"
        size="xl"
      >
        <div className="flex flex-col h-[72vh] max-h-[80vh] w-full max-w-[900px] overflow-hidden">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="text-sm text-gray-500">
              Only the client and assigned worker can view this conversation.
            </div>
          </div>
          <div
            ref={chatRef}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer?.files || null);
            }}
            className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 bg-gradient-to-b from-blue-50/40 to-white rounded-lg border px-4 py-3 custom-scroll"
            id="client-chat-scroll"
          >
            {chatMessages.map((m, i: number) => (
              <div
                key={i}
                className={`p-3 rounded-2xl text-sm break-words shadow-sm ${m.sender?.role === "client" ? "bg-blue-50/80 ml-auto border border-blue-200" : "bg-white border"} max-w-[65%]`}
              >
                <p className="font-medium mb-1 text-blue-600">
                  {m.sender?.name || "You"}
                </p>
                <p className="whitespace-pre-wrap text-gray-800">{m.content}</p>
                {"attachments" in m &&
                  Array.isArray(
                    (m as { attachments?: string[] }).attachments,
                  ) &&
                  (m as { attachments?: string[] }).attachments!.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(m as { attachments: string[] }).attachments.map(
                        (att: string, idx: number) =>
                          att.startsWith("data:image") ? (
                            <a
                              key={idx}
                              href={att}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Image
                                src={att}
                                alt="attachment"
                                width={200}
                                height={200}
                                className="h-24 w-full object-cover rounded-lg border"
                              />
                            </a>
                          ) : (
                            <a
                              key={idx}
                              href={att}
                              download
                              className="flex items-center gap-2 px-2 py-1 bg-white border rounded text-xs text-gray-700"
                            >
                              <FileText className="h-4 w-4" /> Download
                            </a>
                          ),
                      )}
                    </div>
                  )}
                <p className="mt-1 text-[10px] text-gray-400">
                  {new Date(m.sentAt).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <div className="text-xs text-gray-400 p-4">
                No messages yet. Start the conversation.
              </div>
            )}
          </div>
          {attachments.length > 0 && (
            <div className="mt-2 border rounded-lg bg-white p-2 shadow-sm">
              <div className="text-xs text-gray-500 mb-2">
                Attachments ({attachments.length}/5)
              </div>
              <div className="grid grid-cols-5 gap-2">
                {attachments.map((a, idx) => (
                  <div key={idx} className="relative group">
                    {a.type.startsWith("image") ? (
                      <Image
                        src={a.dataUrl}
                        alt={a.name}
                        width={200}
                        height={200}
                        className="h-20 w-full object-cover rounded-lg border"
                      />
                    ) : (
                      <div className="h-20 rounded border bg-gray-50 flex items-center justify-center text-xs text-gray-600">
                        <FileText className="h-4 w-4 mr-1" />
                        {a.name.slice(0, 10)}
                      </div>
                    )}
                    <button
                      className="absolute -top-2 -right-2 bg-white border rounded-full p-0.5 shadow hidden group-hover:block"
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 flex gap-2 items-center border-t pt-3 bg-white">
            <label className="inline-flex items-center gap-1 px-2 py-1 border rounded cursor-pointer text-sm text-gray-600 hover:bg-gray-50">
              <Paperclip className="h-4 w-4" />
              Attach
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
            <div className="flex-1 flex items-center gap-2">
              <input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  const files: File[] = [];
                  for (let i = 0; i < items.length; i++) {
                    const it = items[i];
                    if (it.kind === "file") {
                      const f = it.getAsFile();
                      if (f) files.push(f);
                    }
                  }
                  if (files.length > 0) {
                    const dt = new DataTransfer();
                    files.forEach((f) => dt.items.add(f));
                    addFiles(dt.files);
                  }
                }}
                placeholder="Type a message"
                className="flex-1 border rounded-full px-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="relative">
                <button
                  type="button"
                  aria-label="Choose emoji"
                  className="p-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowEmoji((v) => !v)}
                >
                  <Smile className="h-5 w-5" />
                </button>
                {showEmoji && (
                  <div className="absolute bottom-12 right-0 w-64 max-h-56 overflow-y-auto bg-white border rounded-xl shadow-2xl p-2 grid grid-cols-8 sm:grid-cols-10 gap-2 text-xl z-10">
                    {[
                      "😀",
                      "😁",
                      "😂",
                      "🤣",
                      "😊",
                      "😍",
                      "😘",
                      "😇",
                      "🙂",
                      "😉",
                      "😌",
                      "😎",
                      "🤩",
                      "🫶",
                      "👍",
                      "🙏",
                      "👏",
                      "💪",
                      "🎉",
                      "🔥",
                      "✨",
                      "💡",
                      "📌",
                      "📎",
                      "📷",
                      "📝",
                      "🤝",
                      "🤔",
                      "😅",
                      "😴",
                      "😢",
                      "😤",
                    ].map((e) => (
                      <button
                        key={e}
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => insertEmoji(e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button disabled={sending} onClick={sendMessage}>
              Send
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ApplicationsPage;
