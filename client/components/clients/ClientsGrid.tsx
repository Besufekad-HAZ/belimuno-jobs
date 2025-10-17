"use client";

import React from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";
import { resolveAssetUrl } from "@/lib/assets";

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

type ClientsGridProps = {
  clients: Client[];
  limit?: number;
  className?: string;
};

const ClientsGrid: React.FC<ClientsGridProps> = ({
  clients,
  limit,
  className,
}) => {
  const list = typeof limit === "number" ? clients.slice(0, limit) : clients;

  const getInitials = (name: string) =>
    name
      .replace(/\([^)]*\)/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || name.slice(0, 2).toUpperCase();
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className || ""}`}
    >
      {list.map((client) => {
        // Use the logo URL directly from the API, or try to resolve it if it's a relative path
        const logoSrc = client.logo
          ? client.logo.startsWith("http")
            ? client.logo
            : (resolveAssetUrl(client.logo) ?? client.logo)
          : undefined;

        return (
          <Card
            key={client._id || client.name}
            className="p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt={client.name}
                    fill
                    sizes="56px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-base font-semibold tracking-wide text-slate-700"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.12))",
                    }}
                  >
                    {getInitials(client.name)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{client.name}</h3>
                {client.type && (
                  <p className="text-xs text-gray-500 mb-1">{client.type}</p>
                )}
                {client.service && (
                  <p className="text-sm text-gray-700">{client.service}</p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ClientsGrid;
