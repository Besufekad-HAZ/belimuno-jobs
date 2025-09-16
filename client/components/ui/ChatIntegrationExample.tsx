"use client";

import React, { useState, useEffect } from "react";
import ModernChatSystem from "./ModernChatSystem";
import SimpleChatInterface from "./SimpleChatInterface";
import ChatButton from "./ChatButton";
import useChat from "../../hooks/useChat";

interface ChatIntegrationExampleProps {
  userId: string;
  userRole: "client" | "worker" | "admin_hr" | "admin_outsource" | "superadmin";
  // API functions - these should be implemented based on your backend
  sendMessageAPI?: (
    conversationId: string,
    content: string,
    attachments?: File[],
  ) => Promise<unknown>;
  markAsReadAPI?: (conversationId: string) => Promise<void>;
  searchAPI?: (query: string) => Promise<unknown[]>;
}

const ChatIntegrationExample: React.FC<ChatIntegrationExampleProps> = ({
  userId,
  userRole,
  sendMessageAPI,
  markAsReadAPI,
  searchAPI,
}) => {
  const [chatMode, setChatMode] = useState<"modern" | "simple">("modern");

  // Initialize chat hook
  const chat = useChat({
    userId,
    onSendMessage: async (
      conversationId: string,
      content: string,
      attachments?: File[],
    ) => {
      if (sendMessageAPI) {
        const response = await sendMessageAPI(
          conversationId,
          content,
          attachments,
        );

        // Add the sent message to local state
        const newMessage = {
          id:
            (typeof response === "object" &&
            response !== null &&
            "id" in response
              ? (response as { id: string }).id
              : undefined) || `msg-${Date.now()}`,
          senderId: userId,
          senderName: "You",
          content,
          timestamp: new Date().toISOString(),
          read: true,
          attachments: attachments
            ? attachments.map((file, index) => ({
                id: `attachment-${index}`,
                name: file.name,
                url: URL.createObjectURL(file),
                type: file.type,
                size: file.size,
              }))
            : undefined,
        };

        chat.addMessage(newMessage);
        return response;
      }
      throw new Error("Send message API not implemented");
    },
    onMarkAsRead: async (conversationId: string) => {
      if (markAsReadAPI) {
        await markAsReadAPI(conversationId);
      }
      chat.markAsRead(conversationId);
    },
    onSearch: async (query: string) => {
      if (searchAPI) {
        try {
          const results = await searchAPI(query);
          // Handle search results as needed
          console.log("Search results:", results);
        } catch (error) {
          console.error("Search failed:", error);
        }
      }
    },
  });

  // Mock data for demonstration (replace with real API calls)
  useEffect(() => {
    const loadMockData = () => {
      // Mock conversations
      const mockConversations = [
        {
          id: "conv-1",
          participantId: "user-1",
          participantName: "John Smith",
          participantRole: userRole === "client" ? "worker" : "client",
          lastMessage: {
            id: "msg-1",
            senderId: "user-1",
            senderName: "John Smith",
            content: "Hello! How can I help you today?",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            read: false,
          },
          unreadCount: 2,
          isOnline: true,
        },
        {
          id: "conv-2",
          participantId: "user-2",
          participantName: "Sarah Johnson",
          participantRole: userRole === "client" ? "worker" : "client",
          lastMessage: {
            id: "msg-2",
            senderId: userId,
            senderName: "You",
            content: "Thanks for the update!",
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            read: true,
          },
          unreadCount: 0,
          isOnline: false,
        },
      ];

      chat.setConversations(mockConversations);
    };

    loadMockData();
  }, [userId, userRole, chat]);

  // Mock messages for selected conversation
  useEffect(() => {
    if (chat.currentConversationId) {
      const mockMessages = [
        {
          id: "msg-1",
          senderId: "user-1",
          senderName: "John Smith",
          content: "Hello! How can I help you today?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
        {
          id: "msg-2",
          senderId: "user-1",
          senderName: "John Smith",
          content: "I saw your job posting and I'm very interested.",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          read: false,
        },
        {
          id: "msg-3",
          senderId: userId,
          senderName: "You",
          content: "Great! Let me know if you have any questions.",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          read: true,
        },
      ];

      chat.setMessages(mockMessages);
    } else {
      chat.setMessages([]);
    }
  }, [chat.currentConversationId, userId, chat]);

  // Calculate total unread count
  const totalUnreadCount = chat.conversations.reduce(
    (total, conv) => total + conv.unreadCount,
    0,
  );

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button */}
      {!chat.isOpen && (
        <ChatButton
          onClick={chat.openChat}
          unreadCount={totalUnreadCount}
          size="lg"
        />
      )}

      {/* Modern Chat System */}
      {chatMode === "modern" && (
        <ModernChatSystem
          conversations={chat.conversations}
          messages={chat.messages}
          currentUserId={userId}
          currentConversationId={chat.currentConversationId || undefined}
          onSendMessage={chat.sendMessage}
          onSelectConversation={chat.selectConversation}
          onSearch={chat.search}
          onMarkAsRead={chat.markAsRead}
          isLoading={chat.isLoading}
          isOpen={chat.isOpen}
          onClose={chat.closeChat}
          onToggleMinimize={chat.toggleMinimize}
          isMinimized={chat.isMinimized}
        />
      )}

      {/* Simple Chat Interface */}
      {chatMode === "simple" && chat.currentConversation && (
        <SimpleChatInterface
          isOpen={chat.isOpen}
          onClose={chat.closeChat}
          onSendMessage={async (content: string, attachments?: File[]) => {
            if (chat.currentConversationId) {
              return chat.sendMessage(
                chat.currentConversationId,
                content,
                attachments,
              );
            }
            throw new Error("No conversation selected");
          }}
          messages={chat.messages}
          currentUserId={userId}
          recipientName={chat.currentConversation.participantName}
          recipientRole={chat.currentConversation.participantRole}
          isLoading={chat.isLoading}
          title={`Chat with ${chat.currentConversation.participantName}`}
        />
      )}

      {/* Mode Toggle (for demo purposes - remove in production) */}
      <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-lg p-2 border">
        <button
          onClick={() =>
            setChatMode(chatMode === "modern" ? "simple" : "modern")
          }
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          Switch to {chatMode === "modern" ? "Simple" : "Modern"} Chat
        </button>
      </div>
    </div>
  );
};

export default ChatIntegrationExample;
