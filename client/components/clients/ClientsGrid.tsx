"use client";

import React from 'react';
import Card from '@/components/ui/Card';
import { Award } from 'lucide-react';
import type { ClientItem } from '@/data/clients';

type ClientsGridProps = {
  clients: ClientItem[];
  limit?: number;
  className?: string;
};

const ClientsGrid: React.FC<ClientsGridProps> = ({ clients, limit, className }) => {
  const list = typeof limit === 'number' ? clients.slice(0, limit) : clients;
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className || ''}`}>
      {list.map((client) => (
        <Card key={client.name} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{client.name}</h3>
              {client.type && <p className="text-xs text-gray-500 mb-1">{client.type}</p>}
              {client.service && <p className="text-sm text-gray-700">{client.service}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ClientsGrid;


