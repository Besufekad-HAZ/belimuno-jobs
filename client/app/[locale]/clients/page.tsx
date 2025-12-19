"use client";

import React, { useEffect, useState } from "react";
import ClientsGrid from "@/components/clients/ClientsGrid";
import { publicAPI } from "@/lib/api";
import { useTranslations } from "next-intl";

interface Client {
  _id: string;
  name: string;
  type: string;
  service?: string;
  logo?: string;
  status?: "active" | "inactive" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

const ClientsPage: React.FC = () => {
  const t = useTranslations("ClientsPage");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await publicAPI.getClients({
          status: "active",
          limit: 50,
          sort: "-createdAt",
        });

        const clientsData = response.data?.data || [];
        setClients(clientsData);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
        setError("Failed to load clients. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-linear-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
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
                <div
                  key={`client-skeleton-${index}`}
                  className="bg-white rounded-lg p-6 shadow-sm animate-pulse"
                >
                  <div className="flex items-start space-x-4">
                    <div className="h-14 w-14 bg-gray-200 rounded-2xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Unable to load clients
              </h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No clients available
              </h3>
              <p className="text-gray-600">
                Check back later for our client showcase.
              </p>
            </div>
          ) : (
            <ClientsGrid clients={clients} />
          )}
        </div>
      </section>
    </div>
  );
};

export default ClientsPage;
