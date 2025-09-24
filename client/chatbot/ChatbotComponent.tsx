"use client";

import { useState } from "react";
import Chatbot from "react-chatbot-kit";
import "react-chatbot-kit/build/main.css";
import "./modern-chatbot.css";
import config from "@/chatbot/config";
import MessageParser from "@/chatbot/MessageParser";
import ActionProvider from "@/chatbot/ActionProvider";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import ModernChatbotHeader from "@/components/Chatbot/ModernChatbotHeader";

function ChatbotComponent() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  // Close handled inside header

  // Get the pathname
  const pathname = usePathname();

  // List of pages where chatbot should appear
  const chatbotPages = [
    "/",
    "/about",
    "/services",
    "/clients",
    "/jobs",
    "/contact",
  ];

  // Check if the pathname is in the list of pages where chatbot should appear
  const showChatbot = chatbotPages.includes(pathname);

  return (
    showChatbot && (
      <div className="fixed z-50 bottom-4 right-4 max-w-[92vw] text-black select-none">
        {/* Floating toggle button when closed */}
        {!isChatbotOpen && (
          <button
            onClick={handleOpenChatbot}
            className="group flex items-center gap-3 pl-3 pr-4 py-2 rounded-full shadow-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/60 transition-all"
            aria-label="Open chat"
          >
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-white/25 blur-[6px] opacity-60 group-hover:opacity-90 transition" />
              <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/15">
                <MessageCircle className="w-5 h-5" />
              </span>
            </span>
            <span className="font-semibold">Chat with us</span>
          </button>
        )}

        {/* Chat window */}
        <div
          className={`mt-2 rounded-2xl overflow-hidden bg-white transition-all duration-500 ease-out ${
            isChatbotOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Belimuno Assistant"
        >
          {isChatbotOpen && (
            <div className="rounded-2xl shadow-2xl">
              <ModernChatbotHeader onClose={() => setIsChatbotOpen(false)} />
              <Chatbot
                config={config}
                messageParser={MessageParser}
                actionProvider={ActionProvider}
              />
            </div>
          )}
        </div>
      </div>
    )
  );
}

export default ChatbotComponent;
