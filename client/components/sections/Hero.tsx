import React, { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getStoredUser, getRoleDashboardPath } from "@/lib/auth";
import {
  ArrowRight,
  Briefcase,
  Search,
  Shield,
  Zap,
  Users,
  Star,
  CheckCircle2,
} from "lucide-react";
import { TypeAnimation } from "react-type-animation";

type StoredUser = { role: string } | null;

export default function Hero() {
  const [user, setUser] = useState<StoredUser>(null);
  const [counts, setCounts] = useState({ users: 0, rate: 0, jobs: 0 });
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const t = useTranslations("Home");

  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setCounts({
        users: Math.round(12000 * progress) / 1000,
        rate: Math.round(4.8 * progress * 10) / 10,
        jobs: Math.round(1.8 * progress * 10) / 10,
      });
      if (currentStep >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handlePrimary = () => {
    if (user) {
      router.push(getRoleDashboardPath(user.role));
    } else {
      router.push("/register");
    }
  };

  const dynamicPhrases = useMemo(() => {
    const raw = t.raw("hero.title.dynamic");
    if (Array.isArray(raw)) return raw.filter(Boolean) as string[];
    return [] as string[];
  }, [t]);

  const typingSequence = useMemo(() => {
    if (dynamicPhrases.length === 0) return [t("hero.title.part2"), 2600];
    return dynamicPhrases.flatMap((phrase) => [phrase, 2600]);
  }, [dynamicPhrases, t]);

  const stats = [
    {
      icon: Users,
      value: `${counts.users.toFixed(0)}K+`,
      label: "Active Users",
      gradient: "from-sky-400 to-blue-500",
      shadow: "shadow-sky-400/30",
    },
    {
      icon: Star,
      value: `${counts.rate.toFixed(1)}/5`,
      label: "Satisfaction Rate",
      gradient: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-400/30",
    },
    {
      icon: Briefcase,
      value: `${counts.jobs.toFixed(1)}K`,
      label: "Jobs Posted",
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-400/30",
    },
  ];

  return (
    <section
      ref={heroRef}
      className="hero-root relative min-h-[600px] sm:min-h-[680px] lg:min-h-[720px] overflow-hidden"
    >
      {/* Full-width background image */}
      <div className="absolute inset-0">
        <Image
          src="/hero.jpg"
          alt="African professionals working together in a modern office"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={90}
        />
        {/* Multi-layer gradient overlays for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1e3d]/90 via-[#0f2847]/75 to-[#0f2847]/30 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1e3d]/60 via-transparent to-[#0c1e3d]/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c1e3d]/40 via-transparent to-transparent h-32" />
      </div>

      {/* Animated accent orbs (subtle, blend with image) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-20 sm:pb-24 lg:pb-28">
        <div className="lg:max-w-[55%]">
          {/* Eyebrow badge */}
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-sky-200 backdrop-blur-md ${mounted ? "animate-hero-fade-up" : "opacity-0"}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-400" />
            </span>
            {t("hero.tagline")}
          </div>

          {/* Main heading */}
          <h1
            className={`mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[3.75rem] leading-[1.1] ${mounted ? "animate-hero-fade-up animation-delay-100" : "opacity-0"}`}
          >
            <span className="block drop-shadow-lg">{t("hero.title.part1")}</span>
            <span className="hero-gradient-text block mt-1 min-h-[1.2em]">
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

          {/* Description */}
          <p
            className={`mt-6 max-w-xl text-lg text-slate-200/90 leading-relaxed ${mounted ? "animate-hero-fade-up animation-delay-200" : "opacity-0"}`}
          >
            {t("hero.description")}
          </p>

          {/* CTA buttons */}
          <div
            className={`mt-10 flex flex-col gap-4 sm:flex-row sm:items-center ${mounted ? "animate-hero-fade-up animation-delay-300" : "opacity-0"}`}
          >
            <button
              onClick={handlePrimary}
              className="hero-btn-primary group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-xl px-8 py-4 text-base font-semibold text-white shadow-xl shadow-sky-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <span className="relative z-10">
                {user ? t("hero.goToDashboard") : t("hero.register")}
              </span>
              <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition-all duration-300 group-hover:bg-white/30">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>

            <button
              onClick={() => router.push("/jobs")}
              className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <Search className="h-5 w-5 text-sky-300 transition-colors group-hover:text-sky-200" />
              {t("hero.browseJobs")}
            </button>
          </div>

          {/* Trust signals */}
          <div
            className={`mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-300/90 ${mounted ? "animate-hero-fade-up animation-delay-400" : "opacity-0"}`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-sky-400" />
              <span>Verified profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Fast matching</span>
            </div>
          </div>
        </div>

        {/* Floating stat cards - positioned over the image on lg+ */}
        <div className="hidden lg:block">
          {/* Card 1 - top right area */}
          <div
            className={`hero-float-card hero-float-1 absolute top-24 right-[8%] z-20 ${mounted ? "animate-hero-fade-up animation-delay-200" : "opacity-0"}`}
          >
            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur-xl">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stats[0].gradient} shadow-lg ${stats[0].shadow}`}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats[0].value}</div>
                <div className="text-xs text-slate-500">{stats[0].label}</div>
              </div>
            </div>
          </div>

          {/* Card 2 - middle right */}
          <div
            className={`hero-float-card hero-float-2 absolute top-[45%] right-[4%] z-20 ${mounted ? "animate-hero-fade-up animation-delay-300" : "opacity-0"}`}
          >
            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur-xl">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stats[1].gradient} shadow-lg ${stats[1].shadow}`}>
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats[1].value}</div>
                <div className="text-xs text-slate-500">{stats[1].label}</div>
              </div>
            </div>
          </div>

          {/* Card 3 - bottom center-right */}
          <div
            className={`hero-float-card hero-float-3 absolute bottom-24 right-[16%] z-20 ${mounted ? "animate-hero-fade-up animation-delay-400" : "opacity-0"}`}
          >
            <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/95 px-5 py-4 shadow-2xl backdrop-blur-xl">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stats[2].gradient} shadow-lg ${stats[2].shadow}`}>
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{stats[2].value}</div>
                <div className="text-xs text-slate-500">{stats[2].label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile stats row */}
        <div
          className={`lg:hidden grid grid-cols-3 gap-3 mt-12 ${mounted ? "animate-hero-fade-up animation-delay-500" : "opacity-0"}`}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md`}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">{stat.value}</span>
              <span className="text-xs text-slate-300">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade to white */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />

      <style jsx>{`
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          will-change: transform;
          opacity: 0.4;
        }

        .hero-orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.3), transparent);
          top: -100px;
          left: 10%;
          animation: hero-orb-drift-1 20s ease-in-out infinite;
        }

        .hero-orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent);
          bottom: -100px;
          right: 20%;
          animation: hero-orb-drift-2 25s ease-in-out infinite;
        }

        @keyframes hero-orb-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 20px) scale(1.05); }
          66% { transform: translate(15px, -15px) scale(0.95); }
        }

        @keyframes hero-orb-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
        }

        .hero-gradient-text {
          background-image: linear-gradient(
            135deg,
            #38bdf8 0%,
            #67e8f9 20%,
            #a5f3fc 40%,
            #c4b5fd 55%,
            #67e8f9 75%,
            #38bdf8 100%
          );
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: hero-gradient-shift 8s ease-in-out infinite;
        }

        @keyframes hero-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .hero-typewriter {
          display: inline;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .animate-hero-fade-up {
          animation: hero-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animation-delay-100 { animation-delay: 100ms; opacity: 0; }
        .animation-delay-200 { animation-delay: 200ms; opacity: 0; }
        .animation-delay-300 { animation-delay: 300ms; opacity: 0; }
        .animation-delay-400 { animation-delay: 400ms; opacity: 0; }
        .animation-delay-500 { animation-delay: 500ms; opacity: 0; }

        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-float-card {
          animation: hero-float 6s ease-in-out infinite;
        }
        .hero-float-1 { animation-delay: 0s; }
        .hero-float-2 { animation-delay: 2s; }
        .hero-float-3 { animation-delay: 4s; }

        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }

        .hero-btn-primary {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%);
          background-size: 200% 200%;
          animation: hero-btn-gradient 4s ease-in-out infinite;
        }

        .hero-btn-primary::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .hero-btn-primary:hover::before {
          transform: translateX(100%);
        }

        @keyframes hero-btn-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-orb,
          .hero-float-card,
          .hero-gradient-text,
          .hero-btn-primary {
            animation: none;
          }
          .hero-gradient-text {
            color: #38bdf8;
            background: none;
            -webkit-background-clip: unset;
            background-clip: unset;
          }
          .animate-hero-fade-up {
            animation: none;
            opacity: 1;
          }
          .animation-delay-100,
          .animation-delay-200,
          .animation-delay-300,
          .animation-delay-400,
          .animation-delay-500 {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
