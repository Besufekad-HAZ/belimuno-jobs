"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import { getStoredUser, getRoleDashboardPath } from "@/lib/auth";
import { resolveAssetUrl } from "@/lib/assets";
import { ArrowRight, Briefcase } from "lucide-react";

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
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/55 to-transparent" />
      </div>

      {/* Mobile background accent blobs */}
      <div className="pointer-events-none absolute inset-0 lg:hidden">
        <div className="absolute -top-32 -right-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-48 lg:py-56">
        <div className="grid items-center gap-10">
          {/* Copy */}
          <div className="relative z-10">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              <span className="block">{t("hero.title.part1")}</span>
              <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 bg-clip-text text-transparent">
                {t("hero.title.part2")}
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl lg:text-gray-700">
              {t("hero.description")}
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Button
                size="lg"
                onClick={handlePrimary}
                className="group bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-2xl px-8 py-3 text-lg"
              >
                <span className="inline-flex items-center">
                  <span className="mr-3">
                    {user ? t("hero.goToDashboard") : t("hero.register")}
                  </span>
                  <span className="ml-1 flex h-9 w-9 items-center justify-center rounded-md bg-white/20 text-white transition-all duration-300 group-hover:bg-white/30">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/jobs")}
                className="group border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white px-8 py-3 text-lg"
              >
                <span className="inline-flex items-center">
                  <Briefcase className="mr-2 h-5 w-5" />
                  {t("hero.browseJobs")}
                </span>
              </Button>
            </div>
          </div>

          {/* Removed side visual; background image covers entire width on desktop */}
        </div>
      </div>
    </section>
  );
}
