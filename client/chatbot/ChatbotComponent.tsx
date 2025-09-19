"use client";

import { useState } from "react";
import Chatbot from "react-chatbot-kit";
import "react-chatbot-kit/build/main.css";
import config from "@/chatbot/config";
import MessageParser from "@/chatbot/MessageParser";
import ActionProvider from "@/chatbot/ActionProvider";
import { XCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

function ChatbotComponent() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const handleOpenChatbot = () => {
    setIsChatbotOpen(true);
  };

  const handleCloseChatbot = (e: React.MouseEvent<HTMLOrSVGElement>) => {
    e.stopPropagation(); // Prevents click from toggling open again
    setIsChatbotOpen(false);
  };

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
      <div className="fixed z-50 bottom-[5px] md:right-[7px] w-[331px] text-black">
        <div
          className={`h-[65px] flex items-center justify-between px-4 cursor-pointer transition-all rounded-t-2xl ${
            isChatbotOpen ? "bg-gray-200" : ""
          }`}
          onClick={handleOpenChatbot}
        >
          <div className="flex items-center justify-center w-full">
            <Image
              src="/belimuno.png"
              alt="chatbot"
              className="w-[150px] object-cover"
              width={150}
              height={150}
            />
          </div>
          {isChatbotOpen && (
            <XCircle
              className="text-[#4D84FF] cursor-pointer w-5 h-5 hover:text-[#1E3A8A] transition-colors"
              onClick={handleCloseChatbot}
            />
          )}
        </div>
        <div
          className={`transition-all duration-1000 ease-in-out ${
            isChatbotOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          {isChatbotOpen && (
            <Chatbot
              config={config}
              messageParser={MessageParser}
              actionProvider={ActionProvider}
            />
          )}
        </div>
      </div>
    )
  );
}

export default ChatbotComponent;
