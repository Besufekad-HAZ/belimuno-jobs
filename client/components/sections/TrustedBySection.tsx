"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { CLIENTS, type ClientItem } from "@/data/clients";
import { Sparkles } from "lucide-react";
import { resolveAssetUrl } from "@/lib/assets";

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
  logoSrc?: string;
};

const TrustedBySection: React.FC = () => {
  const t = useTranslations("Home.trustedBy");
  const searchParams = useSearchParams();
  const isTestMode =
    (searchParams?.get("logos") || "").toLowerCase() === "test";

  // Respect user’s reduced-motion preference
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(!!mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, [isTestMode]);

  // Only animate when section is visible to improve performance/UX
  useEffect(() => {
    if (!sectionRef.current || typeof window === "undefined") return;
    const el = sectionRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { root: null, threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Base enhanced clients list
  const enhancedClients = useMemo<EnhancedClient[]>(() => {
    // Test set: use the specific logos from the provided list (mapped to existing assets)
    const testNames = new Set([
      "Unimpresa",
      "Voith",
      "Action Against Hunger",
      "Addis Guzo",
      "Alive & Thrive",
      "CGGC (China Gezuba Group)",
      "Children Believe",
      "DanChurchAid (DCA)",
      "FHI360",
      "International IDEA",
      "Jhpiego",
      "The Lutheran World Federation",
      "Oxfam",
      "Stantec",
      "The HALO Trust",
      "Trablisa",
    ]);

    const source = isTestMode
      ? CLIENTS.filter((c) => testNames.has(c.name))
      : CLIENTS;

    // Local overrides pointing to /public/clients assets to avoid S3 during tests
    const testLogoOverrides: Record<string, string> = {
      Unimpresa: "/clients/unimpresa.svg",
      Voith: "/clients/voith.svg",
      "Action Against Hunger": "/clients/action-against-hunger.svg",
      "Addis Guzo": "/clients/addis-guzo.svg",
      "Alive & Thrive": "/clients/alive-and-thrive.svg",
      "CGGC (China Gezuba Group)": "/clients/cggc.svg",
      "Children Believe": "/clients/children-believe.svg",
      "DanChurchAid (DCA)": "/clients/dca.svg",
      FHI360: "/clients/fhi360.svg",
      "International IDEA": "/clients/international-idea.svg",
      Jhpiego: "/clients/jhpiego.svg",
      "The Lutheran World Federation": "/clients/lutheran-world-federation.svg",
      Oxfam: "/clients/oxfam.svg",
      Stantec: "/clients/stantec.svg",
      "The HALO Trust": "/clients/halo-trust.svg",
      Trablisa: "/clients/trablisa.svg",
    };

    return source.map((client) => {
      const override = isTestMode ? testLogoOverrides[client.name] : undefined;
      const logoSrc = override
        ? override
        : client.logo
          ? (resolveAssetUrl(client.logo) ?? client.logo)
          : undefined;
      return {
        ...client,
        initials: getInitials(client.name),
        logoSrc,
      };
    });
  }, [isTestMode]);

  // Rotating list updated every 3 seconds to auto-change logos without remounting tracks
  const [rotating, setRotating] = useState<EnhancedClient[]>(enhancedClients);

  useEffect(() => {
    setRotating(enhancedClients);
  }, [enhancedClients]);

  const rotateArray = useCallback((arr: EnhancedClient[], offset: number) => {
    if (!arr.length) return arr;
    const k = ((offset % arr.length) + arr.length) % arr.length;
    return arr.slice(k).concat(arr.slice(0, k));
  }, []);

  useEffect(() => {
    if (reduceMotion || !isVisible) return;
    const id = setInterval(() => {
      setRotating((prev) => rotateArray(prev, 1));
    }, 3000);
    return () => clearInterval(id);
  }, [reduceMotion, isVisible, rotateArray]);

  const marqueeA = useMemo(() => {
    const list = rotating;
    return [...list, ...list];
  }, [rotating]);

  const marqueeB = useMemo(() => {
    const list = rotateArray(rotating, Math.floor(rotating.length / 3) || 1);
    return [...list, ...list];
  }, [rotating, rotateArray]);

  const renderTile = (
    client: EnhancedClient,
    index: number,
    opts?: { withTooltip?: boolean; keyOverride?: string },
  ) => {
    const placeholderGradient = client.brandColor
      ? `linear-gradient(135deg, ${client.brandColor}22, ${client.brandColor}08)`
      : "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.12))";

    return (
      <div
        key={opts?.keyOverride ?? `${client.name}-${index}`}
        className="client-tile group/tile relative flex w-32 sm:w-40 flex-shrink-0 items-center justify-center outline-none"
        tabIndex={0}
        aria-label={client.name}
        data-tip={opts?.withTooltip ? client.service || client.type : undefined}
      >
        <div className="relative flex h-12 sm:h-14 w-full items-center justify-center overflow-visible transition-transform duration-500 ease-out group-hover:-translate-y-1 focus-within:-translate-y-1">
          {client.logoSrc ? (
            <div className="relative h-full w-full px-3 py-2 logo-bob">
              <Image
                src={client.logoSrc}
                alt={client.name}
                fill
                className="object-contain transition-all duration-500 ease-out filter grayscale contrast-125 opacity-80 group-hover/tile:grayscale-0 group-hover/tile:opacity-100 group-hover/tile:contrast-100 focus:grayscale-0 focus:opacity-100"
                sizes="(max-width: 768px) 150px, 160px"
                style={{ objectFit: "contain" }}
                priority={index < 4}
              />
            </div>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundImage: placeholderGradient }}
            >
              <span className="sr-only">{client.name}</span>
              <span className="block h-6 w-6 rounded-full bg-slate-200/60" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-white via-white to-blue-50/40 mt-6 py-10"
      aria-label={t("eyebrow")}
      ref={sectionRef}
    >
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

        {reduceMotion ? (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 items-center justify-items-center">
            {CLIENTS.map((client, index) =>
              renderTile(
                {
                  ...client,
                  initials: getInitials(client.name),
                  logoSrc: client.logo
                    ? (resolveAssetUrl(client.logo) ?? client.logo)
                    : undefined,
                },
                index,
                { keyOverride: `grid-${index}` },
              ),
            )}
          </div>
        ) : (
          <div className="mt-12 space-y-10">
            {/* Row 1 - forward */}
            <div className="group relative overflow-hidden marquee-mask">
              <div
                className="marquee-track"
                data-variant="primary"
                data-animate={isVisible}
                aria-hidden="true"
              >
                {marqueeA.map((client, index) =>
                  renderTile(client, index, {
                    withTooltip: true,
                    keyOverride: `a-${index}`,
                  }),
                )}
              </div>
            </div>

            {/* Row 2 - reverse */}
            <div className="group relative overflow-hidden marquee-mask">
              <div
                className="marquee-track"
                data-variant="secondary"
                data-animate={isVisible}
                aria-hidden="true"
              >
                {marqueeB.map((client, index) =>
                  renderTile(client, index, {
                    withTooltip: true,
                    keyOverride: `b-${index}`,
                  }),
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .marquee-track {
          --gap: 3.5rem;
          --speed: 36s;
          display: flex;
          align-items: center;
          gap: var(--gap);
          width: max-content;
          animation: marquee var(--speed) linear infinite;
          will-change: transform;
        }

        .marquee-track[data-variant="secondary"] {
          animation-name: marquee-reverse;
          --speed: 46s;
          opacity: 0.95;
        }

        /* Slow down on hover instead of pausing */
        .group:hover .marquee-track {
          --speed: 90s;
        }
        /* Pause if focused for accessibility */
        .group:focus-within .marquee-track {
          animation-play-state: paused;
        }

        /* Only animate when visible */
        .marquee-track[data-animate="false"] {
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

        /* Edge fade using mask for a premium feel */
        .marquee-mask {
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 8%,
            black 92%,
            transparent 100%
          );
        }

        /* Gentle bob on logos for subtle liveliness */
        .logo-bob {
          animation: bob 6s ease-in-out infinite;
        }
        .client-tile:nth-child(3n) .logo-bob {
          animation-duration: 7.5s;
        }
        .client-tile:nth-child(4n) .logo-bob {
          animation-duration: 5.5s;
        }
        .client-tile:nth-child(5n) .logo-bob {
          animation-delay: 0.6s;
        }
        .group/tile:hover .logo-bob,
        .group/tile:focus-within .logo-bob {
          animation-play-state: paused;
        }

        @keyframes bob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        /* Tiny tooltip from data-tip */
        .client-tile[data-tip] {
          position: relative;
        }
        .client-tile[data-tip]:hover::after,
        .client-tile[data-tip]:focus-within::after {
          content: attr(data-tip);
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          background: rgba(15, 23, 42, 0.92);
          color: white;
          font-size: 12px;
          padding: 6px 8px;
          border-radius: 8px;
          pointer-events: none;
          z-index: 30;
          box-shadow: 0 8px 20px rgba(2, 6, 23, 0.35);
        }
        .client-tile[data-tip]:hover::before,
        .client-tile[data-tip]:focus-within::before {
          content: "";
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: rgba(15, 23, 42, 0.92) transparent transparent
            transparent;
          z-index: 30;
        }

        /* Respect reduced motion in CSS too */
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
          .logo-bob {
            animation: none;
          }
        }

        /* Mobile tweaks */
        @media (max-width: 640px) {
          .marquee-track {
            --gap: 2rem;
          }
          .group:hover .marquee-track {
            --speed: 70s;
          }
        }
      `}</style>
    </section>
  );
};

export default TrustedBySection;
