"use client";

import { useState } from "react";
import ChatBotLogo from "@/assets/Home-Page/ChatBot Logo.png";
import Chatbot from "react-chatbot-kit";
import "react-chatbot-kit/build/main.css";
import config from "@/chatbot/config";
import MessageParser from "@/chatbot/MessageParser";
import ActionProvider from "@/chatbot/ActionProvider";
import { XCircle } from "lucide-react";
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
  return (
    <div className="fixed z-50 bottom-[5px] md:right-[7px] w-[331px] text-black">
      <div
        className="h-[65px] bg-primary-green rounded-t-2xl shadow-2xl flex justify-between items-center px-[20px] cursor-pointer hover:bg-[#73a333] transition-all"
        onClick={handleOpenChatbot}
      >
        <div className="flex items-center">
          <Image
            src={ChatBotLogo}
            alt="chatbot"
            className="w-[40px] h-[40px]"
          />
          <div className="pl-2">
            <h3 className="text-white text-[20px] font-extrabold font-eb-garamond">
              ChatBot
            </h3>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-[#43EE7D] rounded-full mr-2"></span>
              <p className="text-white text-[12px] font-extrabold font-eb-garamond">
                Online
              </p>
            </div>
          </div>
        </div>
        {isChatbotOpen && (
          <XCircle
            className="text-white cursor-pointer w-[20px] h-[20px]"
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
  );
}

export default ChatbotComponent;
