"use client";

import React from "react";
import Card from "@/components/ui/Card";
import {
  Users,
  ShieldCheck,
  Briefcase,
  Building2,
  GraduationCap,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";

const ServicesPage: React.FC = () => {
  const t = useTranslations("ServicesPage");

  // Map icon names to components
  const iconMap = {
    Users,
    ShieldCheck,
    Briefcase,
    Building2,
    GraduationCap,
    Wrench,
  };

  // Generate array of service numbers (1-6)
  const serviceNumbers = Array.from({ length: 6 }, (_, i) =>
    (i + 1).toString(),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold">{t("hero.title")}</h1>
          <p className="text-blue-100 mt-2 max-w-3xl">{t("hero.subtitle")}</p>
        </div>
      </div>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceNumbers.map((num) => {
            const IconComponent =
              iconMap[t(`services.${num}.icon`) as keyof typeof iconMap];
            return (
              <Card key={num} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 p-3 ring-1 ring-white/60 shadow-sm">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900">
                      {t(`services.${num}.title`)}
                    </h3>
                    <p className="text-gray-600 mt-1 leading-relaxed">
                      {t(`services.${num}.description`)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
