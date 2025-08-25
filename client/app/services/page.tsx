"use client";

import React from "react";
import Card from "@/components/ui/Card";
import { SERVICES } from "@/data/services";

const ServicesPage: React.FC = () => {
  const services = SERVICES;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold">Our Services</h1>
          <p className="text-blue-100 mt-2 max-w-3xl">
            Flexible HR outsourcing built for Ethiopia’s leading NGOs,
            construction and service companies.
          </p>
        </div>
      </div>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <Card
              key={s.title}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{s.title}</h3>
                  <p className="text-gray-600 mt-1">{s.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
