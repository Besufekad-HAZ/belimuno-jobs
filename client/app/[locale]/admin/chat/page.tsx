"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  Users,
  Search,
  Crown,
  ShieldCheck,
  Share2,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { chatAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UniversalChatSystem from "@/components/ui/UniversalChatSystem";
import type { User } from "@/lib/auth";

interface ChatContact {
  _id: string;
  name: string;
  email: string;
  role: User["role"];
  avatar?: string;
}

interface ChatConversation {
  id: string;
  participants: ChatContact[];
  participantRoles: string[];
  updatedAt: string;
  lastMessage: {
    content: string;
    senderId?: string;
    senderName?: string;
    timestamp: string;
  } | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: Array<{ id: string; name: string; type: string; url: string }>;
}

interface ApiChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: Array<{ id: string; name: string; url: string; type?: string }>;
}

type ConversationMode = "list" | "new" | "active";

const roleMeta: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  super_admin: {
    label: "Super Admin",
    color: "bg-gradient-to-r from-purple-500 to-indigo-500",
    icon: <Crown className="w-3.5 h-3.5" />,
  },
  admin_hr: {
    label: "HR Admin",
    color: "bg-gradient-to-r from-blue-500 to-cyan-500",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
  admin_outsource: {
    label: "Outsource Admin",
    color: "bg-gradient-to-r from-teal-500 to-emerald-500",
    icon: <Share2 className="w-3.5 h-3.5" />,
  },
};

const AdminCollaborationChat: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ChatContact[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [conversationMode, setConversationMode] =
    useState<ConversationMode>("list");

  const initializeChat = useCallback(async () => {
    try {
      setLoading(true);
      const [contactsRes, conversationRes] = await Promise.all([
        chatAPI.getContacts(),
        chatAPI.getConversations(),
      ]);
      setContacts(contactsRes.data?.data || []);
      setFilteredContacts(contactsRes.data?.data || []);
      setConversations(conversationRes.data?.data || []);
    } catch (error) {
      console.error("Failed to load chat data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (
      !user ||
      !hasRole(user, ["super_admin", "admin_hr", "admin_outsource"])
    ) {
      router.push("/login");
      return;
    }
    setCurrentUser(user);
    initializeChat();
  }, [router, initializeChat]);

  const handleFilterContacts = useCallback(
    (value: string) => {
      setSearchTerm(value);
      const normalized = value.trim().toLowerCase();
      if (!normalized) {
        setFilteredContacts(contacts);
        return;
      }
      setFilteredContacts(
        contacts.filter(
          (contact) =>
            contact.name.toLowerCase().includes(normalized) ||
            contact.email.toLowerCase().includes(normalized) ||
            contact.role.toLowerCase().includes(normalized),
        ),
      );
    },
    [contacts],
  );

  const normalizeMessage = useCallback(
    (message: ApiChatMessage): ChatMessage => ({
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      timestamp: message.timestamp,
      attachments: (message.attachments || []).map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        type: attachment.type || "application/octet-stream",
      })),
    }),
    [],
  );

  const openConversation = useCallback(
    async (conversation: ChatConversation) => {
      setActiveConversation(conversation);
      setIsComposerOpen(true);
      setConversationMode("active");
      try {
        setMessageLoading(true);
        const response = await chatAPI.getMessages(conversation.id, {
          limit: 50,
        });
        const apiMessages = (response.data?.data || []) as ApiChatMessage[];
        const loaded: ChatMessage[] = apiMessages.map(normalizeMessage);
        setMessages(loaded);
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setMessageLoading(false);
      }
    },
    [normalizeMessage],
  );

  const closeComposer = useCallback(() => {
    setIsComposerOpen(false);
    setActiveConversation(null);
    setMessages([]);
    setSelectedRecipients([]);
    setConversationMode("list");
  }, []);

  const toggleRecipient = useCallback((userId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }, []);

  const startNewConversation = useCallback(() => {
    if (selectedRecipients.length === 0) return;
    setActiveConversation(null);
    setMessages([]);
    setConversationMode("new");
    setIsComposerOpen(true);
  }, [selectedRecipients]);

  const handleCreateConversation =
    useCallback(async (): Promise<ChatConversation | null> => {
      if (selectedRecipients.length === 0) return null;
      try {
        const response = await chatAPI.createConversation(selectedRecipients);
        const conversation: ChatConversation = response.data?.data;
        if (conversation) {
          setConversations((prev) => {
            const exists = prev.some((item) => item.id === conversation.id);
            const updated = exists
              ? prev.map((item) =>
                  item.id === conversation.id ? conversation : item,
                )
              : [conversation, ...prev];
            return updated.sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
            );
          });
          await openConversation(conversation);
          setSelectedRecipients([]);
          return conversation;
        }
      } catch (error) {
        console.error("Failed to create conversation", error);
      }
      return null;
    }, [selectedRecipients, openConversation]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      let targetConversation = activeConversation;

      if (!targetConversation) {
        const created = await handleCreateConversation();
        if (!created) return;
        targetConversation = created;
      }

      const trimmed = content.trim();
      if (!trimmed) return;

      const optimisticMessage: ChatMessage = {
        id: `pending-${Date.now()}`,
        senderId: currentUser?._id || "",
        senderName: currentUser?.name || "You",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await chatAPI.sendMessage(targetConversation.id, {
          content: trimmed,
        });
        const apiMessage = response.data?.data as ApiChatMessage | undefined;
        if (apiMessage) {
          const savedMessage = normalizeMessage(apiMessage);
          setMessages((prev) =>
            prev
              .filter((msg) => !msg.id.startsWith("pending-"))
              .concat(savedMessage),
          );

          setConversations((prev) =>
            prev
              .map((conversation) =>
                conversation.id === targetConversation!.id
                  ? {
                      ...conversation,
                      lastMessage: {
                        content: savedMessage.content,
                        senderId: savedMessage.senderId,
                        senderName: savedMessage.senderName,
                        timestamp: savedMessage.timestamp,
                      },
                      updatedAt: savedMessage.timestamp,
                    }
                  : conversation,
              )
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime(),
              ),
          );
        }
      } catch (error) {
        console.error("Failed to send message", error);
        setMessages((prev) =>
          prev.filter((msg) => !msg.id.startsWith("pending-")),
        );
      }
    },
    [
      activeConversation,
      currentUser,
      handleCreateConversation,
      normalizeMessage,
    ],
  );

  const selectedContacts = useMemo(
    () =>
      contacts.filter((contact) => selectedRecipients.includes(contact._id)),
    [contacts, selectedRecipients],
  );

  const conversationHeader = useMemo(() => {
    if (conversationMode === "new") {
      if (selectedContacts.length > 0) {
        return selectedContacts.map((contact) => contact.name).join(", ");
      }
      return "Start a new conversation";
    }
    if (activeConversation) {
      const others = activeConversation.participants.filter(
        (participant) => participant._id !== currentUser?._id,
      );
      return others.map((contact) => contact.name).join(", ") || "Conversation";
    }
    return "Select a conversation";
  }, [conversationMode, activeConversation, currentUser, selectedContacts]);

  const conversationRoleBadges = useCallback(
    (conversation: ChatConversation) => (
      <div className="flex flex-wrap items-center gap-1">
        {conversation.participants.map((participant) => {
          const meta = roleMeta[participant.role];
          if (!meta) return null;
          return (
            <span
              key={`${conversation.id}-${participant._id}`}
              className={`inline-flex items-center gap-1 text-[11px] font-medium text-white px-2 py-0.5 rounded-full ${meta.color} shadow-sm`}
            >
              {meta.icon}
              <span>{meta.label}</span>
            </span>
          );
        })}
      </div>
    ),
    [],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-500">Loading secure admin chat…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageSquarePlus className="w-8 h-8 text-blue-500" />
              Admin Collaboration Chat
            </h1>
            <p className="text-gray-600">
              Keep communication seamless between Super Admin, HR, and Outsource
              teams.
            </p>
          </div>
          <Button variant="outline" onClick={initializeChat}>
            Refresh
          </Button>
        </div>

        <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h2>
                <p className="text-sm text-gray-500">
                  Secure, role-based collaboration
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => handleFilterContacts(event.target.value)}
                placeholder="Search by name, email, or role"
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredContacts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No team members match your search.
                </p>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedRecipients.includes(contact._id);
                  const meta = roleMeta[contact.role];
                  return (
                    <button
                      key={contact._id}
                      onClick={() => toggleRecipient(contact._id)}
                      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-blue-400 bg-blue-50 shadow"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.name}
                        </p>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                      {meta && (
                        <span
                          className={`text-[11px] font-semibold text-white px-2 py-1 rounded-full ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <Button
              onClick={startNewConversation}
              variant="primary"
              className="w-full"
              disabled={selectedRecipients.length === 0}
            >
              Start conversation
            </Button>
          </Card>

          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent conversations
                  </h2>
                  <p className="text-sm text-gray-500">
                    Chat privately with authorized admin roles
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={startNewConversation}
                  disabled={selectedRecipients.length === 0}
                >
                  New chat
                </Button>
              </div>

              {conversations.length === 0 ? (
                <div className="min-h-[180px] flex flex-col items-center justify-center text-gray-500">
                  <MessageSquarePlus className="w-12 h-12 mb-3 opacity-40" />
                  <p className="font-medium">No conversations yet</p>
                  <p className="text-sm">
                    Select team members to start a secure chat.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conversation) => {
                    const others = conversation.participants.filter(
                      (participant) => participant._id !== currentUser?._id,
                    );
                    const lastMessageTime = conversation.lastMessage?.timestamp
                      ? formatDistanceToNow(
                          new Date(conversation.lastMessage.timestamp),
                          {
                            addSuffix: true,
                          },
                        )
                      : "";

                    return (
                      <Card
                        key={conversation.id}
                        className="border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <button
                          type="button"
                          className="flex w-full flex-col gap-2 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl"
                          onClick={() => openConversation(conversation)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {others.length > 0
                                  ? others
                                      .map((participant) => participant.name)
                                      .join(", ")
                                  : "You"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {conversation.lastMessage
                                  ? `${conversation.lastMessage.senderName || "Someone"}: ${conversation.lastMessage.content}`
                                  : "No messages yet"}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              {lastMessageTime}
                            </span>
                          </div>
                          {conversationRoleBadges(conversation)}
                        </button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {isComposerOpen && (
        <UniversalChatSystem
          isOpen={isComposerOpen}
          onClose={closeComposer}
          onSendMessage={handleSendMessage}
          messages={messages}
          currentUserId={currentUser?._id || ""}
          recipientName={conversationHeader}
          recipientRole="admin"
          title={conversationHeader}
          isLoading={messageLoading}
          mode="chat"
        />
      )}
    </div>
  );
};

export default AdminCollaborationChat;
