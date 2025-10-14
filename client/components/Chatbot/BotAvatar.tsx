import React from "react";
import Image from "next/image";
import { AvatarProps } from "@/chatbot/config";
import { resolveAssetUrl } from "@/lib/assets";

const BOT_AVATAR_SRC =
  resolveAssetUrl("/belimuno-logo.png") ?? "/belimuno-logo.png";

const BotAvatar: React.FC<AvatarProps> = () => {
  return (
    <div className="bg-white w-[40px] rounded-full flex items-center justify-center">
      <Image
        src={BOT_AVATAR_SRC}
        alt="chatbot"
        className="w-full object-cover"
        width={40}
        height={40}
      />
    </div>
    // <div className="w-[40px] h-[40px] rounded-lg flex items-center justify-center text-[20px] font-bold bg-[#4D84FF] text-white">
    //   B
    // </div>
  );
};

export default BotAvatar;
