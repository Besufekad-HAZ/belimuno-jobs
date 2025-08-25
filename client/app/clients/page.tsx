"use client";

import React from "react";
import ClientsGrid from "@/components/clients/ClientsGrid";
import { CLIENTS } from "@/data/clients";

const ClientsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold">Our Clients</h1>
          <p className="text-blue-100 mt-2 max-w-3xl">
            We have been trusted by international NGOs and leading construction
            companies since 2011.
          </p>
        </div>
      </div>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ClientsGrid clients={CLIENTS} />
        </div>
      </section>
    </div>
  );
};

export default ClientsPage;
