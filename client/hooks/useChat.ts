"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type?: "text" | "image" | "file";
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
  avatar?: string;
}

interface UseChatOptions {
  userId: string;
  onSendMessage?: (
    conversationId: string,
    content: string,
    attachments?: File[],
  ) => Promise<unknown>;
  onMarkAsRead?: (conversationId: string) => void;
  onSearch?: (query: string) => void;
}

interface UseChatReturn {
  // State
  conversations: Conversation[];
  messages: Message[];
  currentConversationId: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isMinimized: boolean;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  selectConversation: (conversationId: string) => void;
  sendMessage: (
    conversationId: string,
    content: string,
    attachments?: File[],
  ) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  search: (query: string) => void;
  openChat: () => void;
  closeChat: () => void;
  toggleMinimize: () => void;
  setLoading: (loading: boolean) => void;

  // Current conversation
  currentConversation: Conversation | null;
}

export const useChat = (options: UseChatOptions): UseChatReturn => {
  const { userId, onSendMessage, onMarkAsRead, onSearch } = options;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Refs for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current conversation
  const currentConversation =
    conversations.find((c) => c.id === currentConversationId) || null;

  // Actions
  const selectConversation = useCallback(
    (conversationId: string) => {
      setCurrentConversationId(conversationId);
      if (onMarkAsRead) {
        onMarkAsRead(conversationId);
      }
    },
    [onMarkAsRead],
  );

  const addMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m.id === message.id)) {
          return prev;
        }
        return [...prev, message].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
      });

      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              lastMessage: message,
              unreadCount:
                message.senderId !== userId
                  ? conv.unreadCount + 1
                  : conv.unreadCount,
            };
          }
          return conv;
        }),
      );
    },
    [currentConversationId, userId],
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string, attachments?: File[]) => {
      if (!onSendMessage) {
        throw new Error("onSendMessage handler not provided");
      }

      try {
        await onSendMessage(conversationId, content, attachments);
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error;
      }
    },
    [onSendMessage],
  );

  const markAsRead = useCallback(
    (conversationId: string) => {
      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv,
        ),
      );

      // Call external handler
      if (onMarkAsRead) {
        onMarkAsRead(conversationId);
      }
    },
    [onMarkAsRead],
  );

  const search = useCallback(
    (query: string) => {
      if (onSearch) {
        onSearch(query);
      }
    },
    [onSearch],
  );

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setCurrentConversationId(null);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    const intervalId = pollIntervalRef.current;

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  return {
    // State
    conversations,
    messages,
    currentConversationId,
    isLoading,
    isOpen,
    isMinimized,

    // Actions
    setConversations,
    setMessages,
    addMessage,
    selectConversation,
    sendMessage,
    markAsRead,
    search,
    openChat,
    closeChat,
    toggleMinimize,
    setLoading: setIsLoading,

    // Current conversation
    currentConversation,
  };
};

export default useChat;
