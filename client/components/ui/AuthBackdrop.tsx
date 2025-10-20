"use client";

import React from "react";

type Props = {
  intensity?: "subtle" | "default" | "strong";
};

// Decorative floating shapes backdrop for auth pages
const AuthBackdrop: React.FC<Props> = ({ intensity = "default" }) => {
  const opacity =
    intensity === "subtle"
      ? "opacity-10"
      : intensity === "strong"
        ? "opacity-40"
        : "opacity-25";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Glass spotlight panel */}
      <div className="absolute inset-6 sm:inset-10 rounded-3xl bg-white/5 backdrop-blur-[2px] ring-1 ring-white/10" />

      {/* Floating blobs */}
      <div
        className={`absolute -top-24 -right-16 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-400/40 to-blue-600/40 blur-3xl ${opacity} animate-auth-float`}
      />
      <div
        className={`absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-400/40 to-blue-500/40 blur-3xl ${opacity} animate-auth-float [animation-delay:250ms]`}
      />
      <div
        className={`absolute top-1/4 left-[-4rem] h-40 w-40 rounded-full bg-gradient-to-br from-sky-300/40 to-blue-500/40 blur-2xl ${opacity} animate-auth-drift`}
      />
      <div
        className={`absolute bottom-1/4 right-[-3rem] h-36 w-36 rounded-full bg-gradient-to-tr from-blue-300/40 to-indigo-500/40 blur-2xl ${opacity} animate-auth-drift [animation-delay:400ms]`}
      />

      {/* Abstract squiggles (soft) */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
        <div
          className={`h-20 w-20 rounded-full bg-gradient-to-br from-cyan-300/40 to-blue-600/40 blur-xl ${opacity} animate-auth-spin`}
        />
      </div>
      <div className="absolute bottom-16 left-1/3">
        <div
          className={`h-16 w-16 rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-600/40 blur-xl ${opacity} animate-auth-spin-slow`}
        />
      </div>

      <style jsx>{`
        @keyframes auth-float {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -10px, 0) scale(1.02);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes auth-drift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(8px, -6px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }
        @keyframes auth-spin {
          from {
            transform: rotate(0deg) scale(1);
          }
          to {
            transform: rotate(360deg) scale(1);
          }
        }
        .animate-auth-float {
          animation: auth-float 6s ease-in-out infinite;
        }
        .animate-auth-drift {
          animation: auth-drift 7.5s ease-in-out infinite;
        }
        .animate-auth-spin {
          animation: auth-spin 18s linear infinite;
        }
        .animate-auth-spin-slow {
          animation: auth-spin 28s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthBackdrop;
