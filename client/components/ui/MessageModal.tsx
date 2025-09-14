import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, User, MessageSquare } from "lucide-react";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (title: string, message: string) => Promise<void>;
  recipientName: string;
  title?: string;
  loading?: boolean;
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  onSend,
  recipientName,
  title = "Send Message",
}) => {
  const [messageContent, setMessageContent] = useState({
    title: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({ title: "", message: "" });
  const [isAnimating, setIsAnimating] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);


  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setMessageContent({ title: "", message: "" });
      setErrors({ title: "", message: "" });
      setSending(false);

      // Focus management with proper delay
      const timeoutId = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 150);

      return () => clearTimeout(timeoutId);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Prevent event bubbling and maintain focus
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !sending) {
      onClose();
    }
  }, [onClose, sending]);

  // Validate inputs
  const validateInputs = useCallback(() => {
    const newErrors = { title: "", message: "" };
    let isValid = true;

    if (!messageContent.title.trim()) {
      newErrors.title = "Subject is required";
      isValid = false;
    }

    if (!messageContent.message.trim()) {
      newErrors.message = "Message is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [messageContent]);

  const handleSend = useCallback(async () => {
    if (!validateInputs() || sending) return;

    setSending(true);
    try {
      await onSend(messageContent.title.trim(), messageContent.message.trim());
      setMessageContent({ title: "", message: "" });
      onClose();
    } catch (error) {
      console.error("Failed to send message:", error);
      // You could add error handling UI here
    } finally {
      setSending(false);
    }
  }, [validateInputs, sending, onSend, messageContent.title, messageContent.message, onClose]);

  const handleClose = useCallback(() => {
    if (!sending) {
      setMessageContent({ title: "", message: "" });
      setErrors({ title: "", message: "" });
      onClose();
    }
  }, [sending, onClose]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageContent(prev => ({ ...prev, title: value }));
    if (errors.title && value.trim()) {
      setErrors(prev => ({ ...prev, title: "" }));
    }
  }, [errors.title]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageContent(prev => ({ ...prev, message: value }));
    if (errors.message && value.trim()) {
      setErrors(prev => ({ ...prev, message: "" }));
    }
  }, [errors.message]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Ctrl+Enter to send
    if (e.key === 'Enter' && e.ctrlKey && !sending) {
      e.preventDefault();
      handleSend();
    }
    // Escape to close
    if (e.key === 'Escape' && !sending) {
      e.preventDefault();
      handleClose();
    }
  }, [handleSend, handleClose, sending]);

  // Auto-resize textarea
  const handleTextareaInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    handleMessageChange(e);
  }, [handleMessageChange]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <div
        ref={modalRef}
        className={`
          relative w-full max-w-lg bg-white rounded-2xl shadow-2xl
          transform transition-all duration-300 ease-out
          ${isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{
          maxHeight: '90vh',
          animation: isAnimating ? 'slideInUp 0.3s ease-out' : undefined
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <User className="w-4 h-4" />
                <span>To: {recipientName}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Subject Input */}
          <div className="space-y-2">
            <label htmlFor="message-subject" className="block text-sm font-medium text-gray-700">
              Subject *
            </label>
            <div className="relative">
              <input
                ref={titleInputRef}
                key="message-modal-title"
                id="message-subject"
                type="text"
                value={messageContent.title}
                onChange={handleTitleChange}
                placeholder="Enter message subject..."
                disabled={sending}
                className={`
                  w-full px-4 py-3 bg-white border rounded-lg shadow-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                  transition-all duration-200 text-gray-900 placeholder-gray-400 outline-none
                  ${errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                `}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            {errors.title && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <span>⚠️</span>
                <span>{errors.title}</span>
              </p>
            )}
          </div>

          {/* Message Textarea */}
          <div className="space-y-2">
            <label htmlFor="message-content" className="block text-sm font-medium text-gray-700">
              Message *
            </label>
            <div className="relative">
              <textarea
                ref={messageTextareaRef}
                key="message-modal-content"
                id="message-content"
                value={messageContent.message}
                onChange={handleTextareaInput}
                placeholder="Type your message here..."
                disabled={sending}
                rows={4}
                className={`
                  w-full px-4 py-3 bg-white border rounded-lg shadow-sm resize-none
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                  transition-all duration-200 text-gray-900 placeholder-gray-400 outline-none
                  ${errors.message ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
                `}
                style={{ minHeight: '100px', maxHeight: '200px' }}
                autoComplete="off"
                spellCheck="true"
              />

              {/* Character count */}
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {messageContent.message.length} chars
              </div>
            </div>
            {errors.message && (
              <p className="text-sm text-red-600 flex items-center space-x-1">
                <span>⚠️</span>
                <span>{errors.message}</span>
              </p>
            )}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            💡 <strong>Tips:</strong> Press Ctrl+Enter to send, Escape to close
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {sending && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span>Sending message...</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              disabled={sending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !messageContent.title.trim() || !messageContent.message.trim()}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? "Sending..." : "Send Message"}</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default MessageModal;
