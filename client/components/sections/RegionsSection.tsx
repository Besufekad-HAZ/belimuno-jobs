"use client";

import React from "react";
import { MapPin } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useTranslations } from "next-intl";

const RegionsSection: React.FC = () => {
  const t = useTranslations("Home");

  const regions = [
    {
      key: "afar",
      border: "border-l-orange-400",
      icon: "text-orange-300",
    },
    {
      key: "amhara",
      border: "border-l-amber-400",
      icon: "text-amber-300",
    },
    {
      key: "benishangul",
      border: "border-l-teal-400",
      icon: "text-teal-300",
    },
    {
      key: "gambela",
      border: "border-l-cyan-400",
      icon: "text-cyan-300",
    },
    {
      key: "harari",
      border: "border-l-yellow-300",
      icon: "text-yellow-200",
    },
    {
      key: "oromia",
      border: "border-l-emerald-400",
      icon: "text-emerald-300",
    },
    {
      key: "sidama",
      border: "border-l-rose-400",
      icon: "text-rose-300",
    },
    {
      key: "somali",
      border: "border-l-sky-400",
      icon: "text-sky-300",
    },
    {
      key: "southEthiopia",
      border: "border-l-indigo-400",
      icon: "text-indigo-300",
    },
    {
      key: "southWestEthiopia",
      border: "border-l-purple-400",
      icon: "text-purple-300",
    },
    {
      key: "tigray",
      border: "border-l-fuchsia-400",
      icon: "text-fuchsia-300",
    },
    {
      key: "centralEthiopia",
      border: "border-l-blue-400",
      icon: "text-blue-300",
    },
    {
      key: "addisAbaba",
      border: "border-l-violet-400",
      icon: "text-violet-300",
    },
    {
      key: "direDawa",
      border: "border-l-pink-400",
      icon: "text-pink-300",
    },
  ] as const;

  return (
    <div className="relative py-20 bg-white text-slate-900 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-200/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[20rem] w-[20rem] rounded-full bg-blue-200/8 blur-[160px]" />
        <div className="absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full border border-slate-100/40" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 shadow-sm">
            <MapPin className="h-4 w-4" />
            {t("regions.title")}
          </span>
          <h2 className="mt-6 text-4xl font-bold text-slate-900 sm:text-5xl">
            {t("regions.subtitle")}
          </h2>
          <p className="mt-4 text-base text-slate-600 max-w-2xl">
            {t("regions.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {regions.map(({ key, border, icon }) => (
            <Card
              key={key}
              className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-500 hover:-translate-y-2 hover:border-cyan-200 hover:shadow-lg ${border}`}
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none z-0">
                {/* subtle darker overlay to give cards a gentle contrast on the white section */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/6 via-transparent to-slate-900/10 z-0" />
              </div>
              <div className="relative flex items-start space-x-4 z-10">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50">
                  <MapPin className={`h-6 w-6 ${icon} z-10`} />
                  <div className="absolute -inset-2 rounded-3xl bg-cyan-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0 pointer-events-none" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-700 border border-slate-100">
                      {t(`regions.${key}.tagline`)}
                    </Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900 group-hover:text-cyan-700">
                    {t(`regions.${key}.name`)}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {t(`regions.${key}.description`)}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    {t(`regions.${key}.jobs`)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegionsSection;
