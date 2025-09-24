import React from "react";
// import Image from "next/image";
import { AvatarProps } from "@/chatbot/config";

const BotAvatar: React.FC<AvatarProps> = () => {
  return (
    // <div className="bg-white w-[100px] rounded-full flex items-center justify-center">
    //   <Image
    //     src="/belimuno.png"
    //     alt="chatbot"
    //     className="w-full object-cover"
    //     width={100}
    //     height={100}
    //   />
    // </div>
    <div className="w-[40px] h-[40px] rounded-lg flex items-center justify-center text-[20px] font-bold bg-[#4D84FF] text-white">
      B
    </div>
  );
};

export default BotAvatar;
