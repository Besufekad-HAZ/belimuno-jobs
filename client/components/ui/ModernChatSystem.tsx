"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User2,
  MoreVertical,
  Paperclip,
  X,
  Check,
  CheckCheck,
  Phone,
  Video,
  Minimize2,
  Maximize2,
} from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
  type?: 'text' | 'image' | 'file';
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

interface ModernChatSystemProps {
  conversations: Conversation[];
  messages: Message[];
  currentUserId: string;
  currentConversationId?: string;
  onSendMessage: (conversationId: string, content: string, attachments?: File[]) => Promise<void>;
  onSelectConversation: (conversationId: string) => void;
  onSearch: (query: string) => void;
  onMarkAsRead: (conversationId: string) => void;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
}

const ModernChatSystem: React.FC<ModernChatSystemProps> = ({
  conversations,
  messages,
  currentUserId,
  currentConversationId,
  onSendMessage,
  onSelectConversation,
  onSearch,
  onMarkAsRead,
  isLoading = false,
  isOpen,
  onClose,
  onToggleMinimize,
  isMinimized = false,
  className = "",
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Refs for focus management
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (currentConversationId && currentConversation && currentConversation.unreadCount > 0) {
      onMarkAsRead(currentConversationId);
    }
  }, [currentConversationId, currentConversation, onMarkAsRead]);

  // Focus management - maintain focus on message input
  useEffect(() => {
    if (currentConversationId && messageInputRef.current && isOpen && !isMinimized) {
      const timeoutId = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [currentConversationId, isOpen, isMinimized]);

  // Prevent event bubbling to maintain focus
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleSendMessage = useCallback(async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !currentConversationId || sending) {
      return;
    }

    setSending(true);
    try {
      await onSendMessage(currentConversationId, newMessage.trim(), attachments);
      setNewMessage("");
      setAttachments([]);
      // Maintain focus after sending
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 50);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  }, [newMessage, attachments, currentConversationId, sending, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Handle escape to close chat
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSendMessage, onClose]);

  const handleAttachFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // Max 5 files
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch(query);
  }, [onSearch]);

  // Auto-resize textarea with stable key
  const handleMessageInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    setNewMessage(e.target.value);

    // Typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
    } else if (isTyping && e.target.value.length === 0) {
      setIsTyping(false);
    }
  }, [isTyping]);

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  }, []);

  const renderMessage = useCallback((message: Message) => {
    const isSent = message.senderId === currentUserId;

    return (
      <div
        key={message.id}
        className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4 animate-in slide-in-from-bottom-2 duration-200`}
      >
        <div className={`max-w-xs lg:max-w-md ${isSent ? 'order-2' : 'order-1'}`}>
          {!isSent && (
            <div className="flex items-center mb-1">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-2">
                <User2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-gray-500 font-medium">{message.senderName}</span>
            </div>
          )}

          <div
            className={`
              px-4 py-2 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md
              ${isSent
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                : 'bg-white border border-gray-200 text-gray-900 hover:border-gray-300'
              }
            `}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => {
                  const isImage =
                    (attachment.type && attachment.type.startsWith('image/')) ||
                    /^data:image\//.test(attachment.url) ||
                    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.url);
                  return (
                    <div
                      key={attachment.id}
                      className={`group border rounded-lg overflow-hidden ${isSent ? 'bg-white/20 border-white/30' : 'bg-gray-50 border-gray-200'}`}
                    >
                      {isImage ? (
                        <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="max-h-40 object-contain w-full bg-white"
                            loading="lazy"
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
                          className={`flex items-center gap-2 p-2 text-xs hover:underline ${isSent ? 'text-white' : 'text-blue-700'}`}
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

          <div className={`flex items-center mt-1 space-x-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-400">{formatTime(message.timestamp)}</span>
            {isSent && (
              <div className="text-gray-400">
                {message.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [currentUserId, formatTime]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${className}`}
      onClick={onClose}
    >
      <div
        ref={chatContainerRef}
        className={`
          relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100
          transition-all duration-300 ease-out transform
          ${isMinimized
            ? 'w-80 h-16'
            : 'w-full max-w-6xl h-[80vh]'
          }
        `}
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
                {isMinimized ? 'Chat' : 'Messages'}
              </h2>
              {!isMinimized && (
                <p className="text-sm text-gray-500">
                  {currentConversation ? `Chatting with ${currentConversation.participantName}` : 'Select a conversation'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    key="chat-search-input"
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm text-center">No conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => onSelectConversation(conversation.id)}
                        className={`
                          w-full p-3 rounded-xl text-left transition-all duration-200 hover:bg-white hover:shadow-sm
                          ${currentConversationId === conversation.id
                            ? 'bg-white shadow-sm border border-blue-100 ring-1 ring-blue-100'
                            : ''
                          }
                        `}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                              <User2 className="w-5 h-5 text-white" />
                            </div>
                            {conversation.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">{conversation.participantName}</h3>
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.lastMessage?.content || "No messages yet"}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full min-w-[20px] text-center animate-pulse">
                                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                </span>
                              )}
                            </div>

                            <span className="text-xs text-gray-400 capitalize">{conversation.participantRole}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                            <User2 className="w-5 h-5 text-white" />
                          </div>
                          {currentConversation.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{currentConversation.participantName}</h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {currentConversation.isOnline ? 'Online' : 'Offline'} • {currentConversation.participantRole}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Voice call">
                          <Phone className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Video call">
                          <Video className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="More options">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                        <p className="text-sm text-center">Send a message to begin chatting with {currentConversation.participantName}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

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
                            <span className="text-sm text-blue-800 truncate max-w-[120px]">{file.name}</span>
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
                      <button
                        onClick={handleAttachFile}
                        disabled={sending}
                        className="py-4 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                        title="Attach file"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <div className="flex-1 relative">
                        <textarea
                          ref={messageInputRef}
                          key="chat-message-input"
                          value={newMessage}
                          onChange={handleMessageInput}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message..."
                          disabled={sending}
                          rows={1}
                          className="w-full px-4 py-3 bg-gray-100 border-0 rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 placeholder-gray-500 disabled:opacity-50 outline-none"
                          style={{ minHeight: '44px', maxHeight: '120px' }}
                          autoComplete="off"
                          spellCheck="true"
                        />
                      </div>

                      <button
                        onClick={handleSendMessage}
                        disabled={sending || (!newMessage.trim() && attachments.length === 0)}
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
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ModernChatSystem;

