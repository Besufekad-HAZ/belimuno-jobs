import React from "react";
import Image from "next/image";
import ChatBotLogo from "@/assets/Home-Page/ChatBot Logo.png";
import { AvatarProps } from "@/chatbot/config";

const BotAvatar: React.FC<AvatarProps> = () => {
  return (
    <div className="bg-primary-green w-[40px] h-[40px] rounded-full flex items-center justify-center">
      <Image
        src={ChatBotLogo}
        alt="chatbot"
        className="w-[40px] h-[40px] object-cover"
      />
    </div>
  );
};

export default BotAvatar;
