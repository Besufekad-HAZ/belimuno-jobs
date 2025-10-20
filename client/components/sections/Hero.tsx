"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { getStoredUser, getRoleDashboardPath } from "@/lib/auth";
import { resolveAssetUrl } from "@/lib/assets";
import { ArrowRight, Briefcase } from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import CountUp from "react-countup";

type StoredUser = { role: string } | null;

const HERO_IMAGE_SRC = resolveAssetUrl("/hero.jpg") ?? "/hero.jpg";

export default function Hero() {
  const [user, setUser] = useState<StoredUser>(null);
  const router = useRouter();
  const t = useTranslations("Home");

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handlePrimary = () => {
    if (user) {
      router.push(getRoleDashboardPath(user.role));
    } else {
      router.push("/register");
    }
  };

  const stats = [
    { value: 12, decimals: 0, suffix: "K+", label: t("stats.activeUsers") },
    { value: 4.8, decimals: 1, suffix: "/5", label: t("stats.successRate") },
    { value: 1.8, decimals: 1, suffix: "K", label: t("stats.jobsPosted") },
  ];

  const dynamicPhrases = useMemo(() => {
    const raw = t.raw("hero.title.dynamic");
    if (Array.isArray(raw)) {
      return raw.filter(Boolean) as string[];
    }
    return [] as string[];
  }, [t]);
  const typingSequence = useMemo(() => {
    if (dynamicPhrases.length === 0) {
      return [t("hero.title.part2"), 2600];
    }
    return dynamicPhrases.flatMap((phrase) => [phrase, 2600]);
  }, [dynamicPhrases, t]);

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Full-width background image - hidden on mobile */}
      <div className="absolute inset-0 hidden lg:block">
        <Image
          src={HERO_IMAGE_SRC}
          alt="African professionals working together in a modern office"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* Left-to-right gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/65 to-transparent" />
      </div>

      {/* Mobile background accent blobs */}
      <div className="pointer-events-none absolute inset-0 lg:hidden">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-8 sm:py-10 lg:py-16">
        <div className="absolute -top-20 right-10 hidden lg:block h-44 w-44 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-28 left-16 hidden lg:block h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)]">
          {/* Copy */}
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-lg backdrop-blur animate-fade-up">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
              <span>{t("hero.tagline")}</span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.9rem] lg:text-[3.35rem] animate-fade-up animate-delay-100">
              <span className="block text-balance break-words whitespace-normal leading-[1.12] text-slate-900/90 text-[clamp(1.5rem,7.8vw,2.9rem)] lg:text-[3.35rem]">
                {t("hero.title.part1")}
              </span>
              <span className="hero-typing block text-balance break-words whitespace-normal hyphens-auto leading-[1.08] gradient-animated-text text-[clamp(1.7rem,9vw,3.5rem)] lg:text-[3.8rem] min-h-[1.25em] sm:min-h-[1.2em]">
                <TypeAnimation
                  sequence={typingSequence}
                  wrapper="span"
                  speed={20}
                  deletionSpeed={60}
                  cursor
                  repeat={Infinity}
                  preRenderFirstString
                  className="hero-typewriter"
                />
              </span>
            </h1>
            <p className="mt-2 max-w-[36rem] text-base text-slate-600 sm:text-lg lg:text-gray-700 animate-fade-up animate-delay-200 leading-relaxed">
              {t("hero.description")}
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center animate-fade-up animate-delay-300">
              <Button
                size="lg"
                onClick={handlePrimary}
                className="btn-primary-hero btn-shine group relative w-full sm:w-auto bg-gradient-to-r from-orange-500 via-orange-500 to-amber-400 text-white shadow-2xl hover:shadow-[0_20px_45px_rgba(249,115,22,0.45)] px-6 py-3 sm:px-8 lg:px-10 text-base sm:text-lg font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400"
              >
                <span className="inline-flex items-center">
                  <span className="mr-3">
                    {user ? t("hero.goToDashboard") : t("hero.register")}
                  </span>
                  <span className="ml-1 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-300 group-hover:bg-white/30">
                    <ArrowRight className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
                  </span>
                </span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/jobs")}
                className="btn-secondary-hero btn-shine group relative w-full sm:w-auto border-0 text-blue-700 shadow-lg hover:shadow-xl px-6 py-3 sm:px-8 lg:px-10 text-base sm:text-lg font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 hover:text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-500"
              >
                <span className="inline-flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-blue-600 transition-colors duration-300 group-hover:text-white" />
                  {t("hero.browseJobs")}
                </span>
              </Button>
            </div>

            <dl className="mt-10 grid gap-6 sm:grid-cols-3 animate-fade-up animate-delay-400">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group flex flex-col gap-2 border-t border-slate-200 pt-5 text-slate-700 transition-colors duration-300 hover:border-blue-400"
                >
                  <span className="flex items-center gap-2">
                    <span className="inline-flex h-[6px] w-10 items-center justify-between">
                      <span className="h-[6px] w-[6px] rounded-full bg-blue-500/60 transition-colors duration-300 group-hover:bg-blue-600" />
                      <span className="h-[6px] w-[6px] rounded-full bg-cyan-400/60 transition-colors duration-300 group-hover:bg-cyan-500" />
                      <span className="h-[6px] w-[6px] rounded-full bg-indigo-400/60 transition-colors duration-300 group-hover:bg-indigo-500" />
                    </span>
                  </span>
                  <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {stat.label}
                  </dt>
                  <dd className="text-[2.2rem] font-bold text-cyan-700">
                    <CountUp
                      start={0}
                      end={stat.value}
                      duration={2.6}
                      decimals={stat.decimals}
                      suffix={stat.suffix}
                      enableScrollSpy
                      scrollSpyOnce
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Removed side visual; background image covers entire width on desktop */}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-up {
          opacity: 0;
          animation: fade-up 0.9s ease-out forwards;
        }

        .animate-delay-100 {
          animation-delay: 0.1s;
        }
        .animate-delay-200 {
          animation-delay: 0.2s;
        }
        .animate-delay-300 {
          animation-delay: 0.3s;
        }
        .animate-delay-400 {
          animation-delay: 0.4s;
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .gradient-animated-text {
          background-image: linear-gradient(
            120deg,
            #1d4ed8 0%,
            #2563eb 18%,
            #22d3ee 45%,
            #f97316 72%,
            #fb923c 100%
          );
          background-size: 260% 260%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientShift 6s ease-in-out infinite;
          filter: drop-shadow(0 6px 16px rgba(37, 99, 235, 0.18));
        }

        .hero-typewriter {
          display: inline-block;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: normal; /* allow wrapping on small screens */
        }

        /* Button polish */
        .btn-primary-hero,
        .btn-secondary-hero {
          position: relative;
          overflow: hidden;
          border-radius: 0.75rem; /* rounded-xl to match tailwind */
        }

        /* Subtle shine sweep on hover */
        .btn-shine::after {
          content: "";
          position: absolute;
          top: 0;
          left: -150%;
          height: 100%;
          width: 50%;
          background: linear-gradient(
            120deg,
            transparent,
            rgba(255, 255, 255, 0.35),
            transparent
          );
          transform: skewX(-20deg);
          transition: left 0.6s ease;
          pointer-events: none;
        }
        .btn-shine:hover::after {
          left: 150%;
        }

        /* Gradient outline base for secondary button */
        .btn-secondary-hero {
          border: 2px solid transparent;
          background:
            linear-gradient(#fff, #fff) padding-box,
            linear-gradient(90deg, #2563eb, #06b6d4) border-box;
          backdrop-filter: blur(6px);
        }
        /* When hovered, fill with gradient (Tailwind hover: classes also apply) */
        .btn-secondary-hero:hover {
          border-color: transparent; /* rely on fill gradient */
        }
      `}</style>
    </section>
  );
}
