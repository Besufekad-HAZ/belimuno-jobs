"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  MessageSquare,
  Send,
  X,
  User2,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";
import NextImage from 'next/image';

interface ChatMessage {
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
}

interface UniversalChatSystemProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
  messages: ChatMessage[];
  currentUserId: string;
  recipientName: string;
  recipientRole?: string;
  title?: string;
  isLoading?: boolean;
  mode?: "chat" | "compose"; // chat = full conversation, compose = send message only
  placeholder?: string;
  showAttachments?: boolean;
  showEmoji?: boolean;
}

const UniversalChatSystem: React.FC<UniversalChatSystemProps> = ({
  isOpen,
  onClose,
  onSendMessage,
  messages,
  currentUserId,
  recipientName,
  recipientRole = "user",
  title,
  isLoading = false,
  mode = "chat",
  placeholder = "Type a message...",
  showAttachments = true,
  showEmoji = false,
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  // Optimistic messages are now handled by the parent component to ensure a single source of truth.
  // The `messages` prop should be updated optimistically by the parent.
  const [showAll, setShowAll] = useState(false);

  // Refs for focus management
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Only render a window of the latest messages for performance
  const visibleMessages = useMemo(() => {
    const MAX = 50; // render last 50 messages for speed
    if (!messages) return [];
    if (showAll) return messages;
    return messages.length > MAX ? messages.slice(-MAX) : messages;
  }, [messages, showAll]);

  // Auto-scroll to bottom when new messages arrive
  // This useEffect handles auto-scrolling.
  // It now depends directly on `messages` prop.
  useEffect(() => {
    if (messagesEndRef.current && isOpen && mode === "chat") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, mode]);

  // Focus management - maintain focus on message input
  useEffect(() => {
    if (isOpen && messageInputRef.current) {
      const timeoutId = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  // Prevent event bubbling to maintain focus
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !sending) {
        onClose();
      }
    },
    [onClose, sending],
  );

  // naive compression for images (canvas resize to max 1600px)
  const compressImage = (
    file: File,
    maxDim = 1600,
    quality = 0.8,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error("Canvas context not available"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) return reject(new Error("Compression failed"));
            const compressed = new File([blob], file.name, { type: file.type });
            resolve(compressed);
          },
          file.type,
          quality,
        );
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e as unknown as Error);
      };
      img.src = url;
    });
  };

  const compressFilesIfNeeded = useCallback(
    async (files: File[]): Promise<File[]> => {
      const processed: File[] = [];
      for (const file of files) {
        if (file.type.startsWith("image/") && file.size > 500 * 1024) {
          try {
            const compressed = await compressImage(file, 1600, 0.8);
            processed.push(compressed);
          } catch {
            processed.push(file);
          }
        } else {
          processed.push(file);
        }
      }
      return processed;
    },
    [],
  );

  const handleSendMessage = useCallback(async () => {
    const content = newMessage.trim();
    if ((!content && attachments.length === 0) || sending) {
      return;
    }

    setSending(true);

    // Keep copies of the state to be cleared
    const currentContent = newMessage;
    const currentAttachments = [...attachments];

    // Immediately clear the input fields for a better user experience
    setNewMessage("");
    setAttachments([]);
    setShowEmojiPicker(false);

    try {
      // Compress images before sending
      const maybeCompressed = await compressFilesIfNeeded(currentAttachments);

      // The parent component is now responsible for optimistic updates.
      await onSendMessage(content, maybeCompressed);
    } catch (error) {
      console.error("Failed to send message:", error);
      // If sending fails, restore the message and attachments so the user can retry.
      setNewMessage(currentContent);
      setAttachments(currentAttachments);
    } finally {
      setSending(false);
      // Ensure focus is returned to the input field after the operation completes.
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 50);
    }
  }, [newMessage, attachments, sending, onSendMessage, compressFilesIfNeeded]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
      // Handle escape to close chat
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSendMessage, onClose],
  );

  const handleAttachFile = useCallback(() => {
    if (showAttachments) {
      fileInputRef.current?.click();
    }
  }, [showAttachments]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setAttachments((prev) => [...prev, ...files].slice(0, 5)); // Max 5 files
    },
    [],
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Auto-resize textarea with stable key and focus management
  const handleMessageInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
      setNewMessage(e.target.value);
    },
    [],
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      const textarea = messageInputRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue =
          newMessage.slice(0, start) + emoji + newMessage.slice(end);
        setNewMessage(newValue);

        // Restore cursor position
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(
            start + emoji.length,
            start + emoji.length,
          );
        }, 0);
      }
      setShowEmojiPicker(false);
    },
    [newMessage],
  );

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const renderMessage = useCallback(
    (message: ChatMessage) => {
      const isSent = message.senderId === currentUserId;

      return (
        <div
          key={message.id}
          className={`flex ${isSent ? "justify-end" : "justify-start"} mb-4 animate-in slide-in-from-bottom-2 duration-200`}
        >
          <div
            className={`max-w-xs lg:max-w-md ${isSent ? "order-2" : "order-1"}`}
          >
            {!isSent && (
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-2">
                  <User2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {message.senderName}
                </span>
              </div>
            )}

            <div
              className={`
              px-4 py-2 rounded-2xl shadow-sm transition-all duration-200
              ${
                isSent
                  ? message.id.startsWith("pending-")
                    ? "bg-gradient-to-r from-blue-400 to-cyan-400 text-white opacity-80"
                    : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                  : "bg-white border border-gray-200 text-gray-900"
              }
            `}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => {
                    const isImage =
                      (attachment.type && attachment.type.startsWith("image/")) ||
                      /^data:image\//.test(attachment.url) ||
                      /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.url);
                    return (
                      <div key={attachment.id} className={`
                        group border rounded-lg overflow-hidden ${isSent ? "bg-white/20 border-white/30" : "bg-gray-50 border-gray-200"}
                      `}>
                        {isImage ? (
                          <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
                            <NextImage
                              src={attachment.url}
                              alt={attachment.name}
                              width={400}
                              height={160}
                              className="max-h-40 object-contain w-full bg-white"
                            />
                            <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 bg-white/80">
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate">{attachment.name}</span>
                            </div>
                          </a>
                        ) : (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            download={attachment.name}
                            className={`flex items-center gap-2 p-2 text-xs hover:underline ${isSent ? "text-white" : "text-blue-700"}`}
                          >
                            <Paperclip className="w-3 h-3" />
                            <span className="truncate">{attachment.name}</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className={`flex items-center mt-1 ${isSent ? "justify-end" : "justify-start"}`}
            >
              <span className="text-xs text-gray-400 flex items-center gap-2">
                {message.id.startsWith("pending-") && (
                  <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-transparent"></span>
                )}
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      );
    },
    [currentUserId, formatTime],
  );

  if (!isOpen) return null;

  const displayTitle =
    title ||
    `${mode === "compose" ? "Send Message to" : "Chat with"} ${recipientName}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={handleBackdropClick}
    >
      <div
        ref={chatContainerRef}
        className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 transform transition-all duration-300 ease-out ${
          mode === "compose" ? "h-auto" : "h-[80vh]"
        }`}
        onClick={handleContainerClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {displayTitle}
              </h2>
              <p className="text-sm text-gray-500">
                {recipientRole &&
                  `${recipientRole.charAt(0).toUpperCase() + recipientRole.slice(1)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {mode === "chat" && (
              <>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              disabled={sending}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages - Only show in chat mode */}
        {mode === "chat" && (
          <div
            className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white"
            style={{ height: "calc(80vh - 200px)" }}
          >
            {messages.length > 50 && !showAll && (
              <div className="flex justify-center mb-2">
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setShowAll(true)}
                >
                  Load older messages
                </button>
              </div>
            )}
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            ) : visibleMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm text-center">
                  Send a message to begin chatting with {recipientName}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleMessages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={`attachment-${index}`}
                  className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
                >
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800 truncate max-w-[120px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end space-x-3">
            {showAttachments && (
              <button
                onClick={handleAttachFile}
                disabled={sending}
                className="py-4 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
            )}

            <div className="flex-1 relative">
              <textarea
                ref={messageInputRef}
                key="universal-chat-input"
                value={newMessage}
                onChange={handleMessageInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={sending}
                rows={1}
                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-500 disabled:opacity-50 outline-none"
                style={{ minHeight: "44px", maxHeight: "120px" }}
                autoComplete="off"
                spellCheck="true"
              />
            </div>

            {showEmoji && (
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={sending}
                  className="py-4 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
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
                    ].map((emoji) => (
                      <button
                        key={emoji}
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleSendMessage}
              disabled={
                sending || (!newMessage.trim() && attachments.length === 0)
              }
              className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full hover:from-blue-600 hover:to-cyan-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Send message"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line, Escape to close
          </p>
        </div>

        {/* Hidden file input */}
        {showAttachments && (
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
};

export default UniversalChatSystem;
