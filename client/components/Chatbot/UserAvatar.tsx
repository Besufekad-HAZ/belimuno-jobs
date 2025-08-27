import React from "react";
import { AvatarProps } from "@/chatbot/config";

const UserAvatar: React.FC<AvatarProps> = () => {
  return (
    <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center font-[20px]">
      👤
    </div>
  );
};

export default UserAvatar;
