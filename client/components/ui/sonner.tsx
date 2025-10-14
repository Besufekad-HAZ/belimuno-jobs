"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
export { toast } from "sonner";

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        className:
          "backdrop-blur-md border border-slate-200 bg-white text-slate-900 shadow-2xl ring-1 ring-slate-900/5 dark:border-slate-700/70 dark:bg-slate-900/90 dark:text-slate-100",
        descriptionClassName:
          "text-slate-600/90 text-sm leading-relaxed dark:text-slate-300/90",
        duration: 4500,
        ...toastOptions,
        style: {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          paddingInline: "1.1rem",
          paddingBlock: "0.85rem",
          borderRadius: "1rem",
          ...toastOptions?.style,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
