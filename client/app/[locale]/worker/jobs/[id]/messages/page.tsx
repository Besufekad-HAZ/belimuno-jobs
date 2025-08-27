"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { workerAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { ArrowLeft, ImageIcon, Paperclip, Send } from "lucide-react";

type ChatMessage = {
  _id?: string;
  content: string;
  attachments?: string[];
  sender?: { name?: string; role?: string };
  sentAt: string;
};

const WorkerJobMessagesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<
    {
      name: string;
      type: string;
      size: number;
      dataUrl: string;
    }[]
  >([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await workerAPI.getJobMessages(String(id));
      setMessages(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, attachments]);

  // Poll while on page
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await workerAPI.getJobMessages(String(id));
        setMessages(res.data.data || []);
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const addFiles = async (files: FileList | null) => {
    const list = Array.from(files || []).slice(0, 5 - attachments.length);
    if (list.length === 0) return;
    const reads = await Promise.all(
      list.map(
        (f) =>
          new Promise<{
            name: string;
            type: string;
            size: number;
            dataUrl: string;
          }>((res) => {
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

  const send = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    setSending(true);
    try {
      const res = await workerAPI.sendJobMessage(
        String(id),
        newMessage.trim(),
        attachments.map((a) => a.dataUrl),
      );
      setMessages((prev) => [...prev, res.data.data]);
      setNewMessage("");
      setAttachments([]);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/worker/jobs/${id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Job
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Job Messages</h1>
        </div>

        <Card className="h-[70vh] flex flex-col">
          <div
            ref={scrollRef}
            id="worker-chat-scroll"
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {loading ? (
              <div className="text-center text-gray-500">Loading messages…</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500">
                No messages yet. Start the conversation.
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={m._id || idx} className="bg-white border rounded p-3">
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>
                      {m.sender?.name || "Unknown"} ({m.sender?.role || ""})
                    </span>
                    <span>{new Date(m.sentAt).toLocaleString()}</span>
                  </div>
                  {m.content && (
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {m.content}
                    </p>
                  )}
                  {!!m.attachments?.length && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {m.attachments.map((a, i) => (
                        <div
                          key={i}
                          className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden border"
                        >
                          {a.startsWith("data:image") ? (
                            <Image
                              src={a}
                              alt={`attachment-${i}`}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                              <Paperclip className="h-4 w-4 mr-1" /> Attachment
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <div className="border-t p-3">
            <div className="flex items-end gap-2">
              <label
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 border rounded hover:bg-gray-50 cursor-pointer"
                title="Add images"
              >
                <ImageIcon className="h-5 w-5 text-gray-600" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
              <div className="flex-1">
                <textarea
                  rows={2}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write a message…"
                  className="w-full px-3 py-2 border rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map((a, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-16 bg-gray-100 rounded overflow-hidden border"
                      >
                        <Image
                          src={a.dataUrl}
                          alt={a.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={send}
                disabled={
                  sending || (!newMessage.trim() && attachments.length === 0)
                }
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WorkerJobMessagesPage;
