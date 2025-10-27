"use client";

import React, { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { publicAPI } from "@/lib/api";

interface Service {
  _id: string;
  title: string;
  description: string;
  status?: "active" | "inactive" | "archived";
}

const ServicesPage: React.FC = () => {
  const t = useTranslations("ServicesPage");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicAPI.getServices({
        status: "active",
        limit: 50,
      });

      const servicesData = response.data?.data || [];
      setServices(servicesData);
    } catch (err) {
      console.error("Failed to load services:", err);
      setError("Failed to load services. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold">{t("hero.title")}</h1>
          <p className="text-blue-100 mt-2 max-w-3xl">{t("hero.subtitle")}</p>
        </div>
      </div>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-full bg-gray-200 p-3 w-12 h-12" />
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-5/6" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card
                  key={service._id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 p-3 ring-1 ring-white/60 shadow-sm">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-gray-900">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 mt-1 leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No services available at the moment.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
