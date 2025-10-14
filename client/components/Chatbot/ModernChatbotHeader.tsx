"use client";

import React from "react";
import Image from "next/image";
import { Minimize2, X } from "lucide-react";
import { resolveAssetUrl } from "@/lib/assets";

const HEADER_LOGO_SRC =
  resolveAssetUrl("/belimuno-logo.png") ?? "/belimuno-logo.png";

interface ModernChatbotHeaderProps {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onMinimize?: () => void;
}

const ModernChatbotHeader: React.FC<ModernChatbotHeaderProps> = ({
  title = "Belimuno Assistant",
  subtitle = "Online",
  onClose,
  onMinimize,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-t-2xl border-b border-white/10">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden">
          <Image
            src={HEADER_LOGO_SRC}
            alt="Belimuno"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{title}</div>
          <div className="text-xs opacity-80 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]" />
            {subtitle}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onMinimize && (
          <button
            type="button"
            aria-label="Minimize"
            className="p-1 rounded-lg hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={onMinimize}
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          aria-label="Close"
          className="p-1 rounded-lg hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ModernChatbotHeader;
