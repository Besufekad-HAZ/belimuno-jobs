"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CLIENTS, type ClientItem } from "@/data/clients";
import { Sparkles } from "lucide-react";

const getInitials = (name: string) => {
  const letters = name
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "");

  const initials = letters.join("");
  return initials || name.slice(0, 2).toUpperCase();
};

type EnhancedClient = ClientItem & {
  initials: string;
};

const TrustedBySection: React.FC = () => {
  const t = useTranslations("Home.trustedBy");

  const marqueeClients = useMemo<EnhancedClient[]>(() => {
    const enhanced = CLIENTS.map((client) => ({
      ...client,
      initials: getInitials(client.name),
    }));

    // Duplicate the collection so the marquee can loop seamlessly
    return [...enhanced, ...enhanced];
  }, []);

  const renderTile = (client: EnhancedClient, index: number) => {
    const placeholderGradient = client.brandColor
      ? `linear-gradient(135deg, ${client.brandColor}22, ${client.brandColor}08)`
      : "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.12))";

    return (
      <div
        key={`${client.name}-${index}`}
        className="client-tile flex w-56 flex-shrink-0 flex-col items-center text-center"
      >
        <div className="client-logo-wrapper relative flex h-24 w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_16px_36px_rgba(15,23,42,0.12)]">
          {client.logo ? (
            <div className="relative h-full w-full px-6 py-4">
              <Image
                src={client.logo}
                alt={client.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 200px, 224px"
                style={{ objectFit: "contain" }}
                priority={index < 4}
              />
            </div>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center rounded-2xl"
              style={{ backgroundImage: placeholderGradient }}
            >
              <span className="text-lg font-semibold tracking-wide text-slate-700">
                {client.initials}
              </span>
            </div>
          )}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-900 sm:text-base">
          {client.name}
        </p>
        {client.type && (
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {client.type}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-blue-50/40 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
            <Sparkles className="h-4 w-4" />
            {t("eyebrow")}
          </span>
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-12 space-y-10">
          <div className="group relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/90 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/90 to-transparent" />
            <div className="marquee-track" data-variant="primary">
              {marqueeClients.map((client, index) => renderTile(client, index))}
            </div>
          </div>

          <div className="group relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/90 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/90 to-transparent" />
            <div className="marquee-track" data-variant="secondary">
              {marqueeClients
                .slice(Math.floor(marqueeClients.length / 2))
                .concat(
                  marqueeClients.slice(
                    0,
                    Math.floor(marqueeClients.length / 2),
                  ),
                )
                .map((client, index) => renderTile(client, index))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-track {
          display: flex;
          align-items: center;
          gap: 3.5rem;
          width: max-content;
          animation: marquee 38s linear infinite;
          will-change: transform;
        }

        .marquee-track[data-variant="secondary"] {
          animation-name: marquee-reverse;
          animation-duration: 44s;
          opacity: 0.9;
        }

        .group:hover .marquee-track {
          animation-play-state: paused;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes marquee-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
};

export default TrustedBySection;
