import { createChatBotMessage } from "react-chatbot-kit";
import BotAvatar from "@/components/Chatbot/BotAvatar";
import UserAvatar from "@/components/Chatbot/UserAvatar";
// @ts-ignore - Type definitions for react-chatbot-kit are incomplete
import type { Config } from "react-chatbot-kit";
import React from "react";

export interface AvatarProps {
  className?: string;
}

const currentHour = new Date().getHours();
const timeOfDay =
  currentHour < 12
    ? "Good morning"
    : currentHour < 18
      ? "Good afternoon"
      : "Good evening";
const config: Config = {
  initialMessages: [
    createChatBotMessage(
      `${timeOfDay}! Welcome to Belimuno Jobs! 👋 How can I assist you today?\n\n` +
        `If you'd like to know what I can help with, just type "help" to see a list of topics.`,
      {},
    ),
  ],
  botName: "Belimuno Bot",
  customStyles: {
    botMessageBox: {
      backgroundColor: "var(--belimuno-primary)",
    },
    chatButton: {
      backgroundColor: "var(--belimuno-primary)",
    },
  },
  customComponents: {
    botAvatar: (props: any) => React.createElement(BotAvatar, props),
    userAvatar: (props: any) => React.createElement(UserAvatar, props),
  },
  state: {
    userData: {},
  },
  widgets: [],
};

export default config;
