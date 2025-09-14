"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Building,
  Search,
  Filter,
  Eye,
  Mail,
  Phone,
  Calendar,
  Star,
  Briefcase,
  DollarSign,
  TrendingUp,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { getStoredUser, hasRole } from "@/lib/auth";
import { adminAPI, notificationsAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import MessageModal from "@/components/ui/MessageModal";
import BackToDashboard from "@/components/ui/BackToDashboard";
import { formatDistanceToNow } from "date-fns";

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  clientProfile?: {
    company?: string;
    industry?: string;
    companySize?: string;
    website?: string;
    totalSpent?: number;
    projectsCompleted?: number;
    totalProjects?: number;
    averageRating?: number;
    lastProjectDate?: string;
    paymentHistory?: Array<{
      amount: number;
      date: string;
      status: string;
    }>;
  };
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    address?: {
      street?: string;
      city?: string;
      region?: string;
      country?: string;
    };
  };
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  newThisMonth: number;
  topSpenders: number;
  averageProjectValue: number;
  clientRetentionRate: number;
}

type StatusFilter = "all" | "active" | "inactive";
interface MessageContent {
  title: string;
  message: string;
}
type ApiClient = Partial<Client> & {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  isActive?: boolean;
};
type BadgeVariant =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState<MessageContent>({
    title: "",
    message: "",
  });
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_outsource"])) {
      router.push("/login");
      return;
    }

    fetchClients();
  }, [router]);

  const filterClients = useCallback(() => {
    let filtered = [...clients];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(q) ||
          client.email.toLowerCase().includes(q) ||
          (client.clientProfile?.company?.toLowerCase().includes(q) ?? false) ||
          (client.clientProfile?.industry?.toLowerCase().includes(q) ?? false),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((client) =>
        statusFilter === "active" ? client.isActive : !client.isActive,
      );
    }

    if (industryFilter !== "all") {
      filtered = filtered.filter(
        (client) => client.clientProfile?.industry === industryFilter,
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, statusFilter, industryFilter]);

  useEffect(() => {
    filterClients();
  }, [filterClients]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({ role: "client", limit: 100 });
      const clientsData = (response.data?.data ||
        response.data?.users ||
        response.data ||
        []) as ApiClient[];

      // Enhance client data with mock business metrics
      const enhancedClients: Client[] = clientsData.map((client) => ({
        _id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        isActive: client.isActive ?? true,
        createdAt: client.createdAt,
        clientProfile: {
          ...client.clientProfile,
          company: client.clientProfile?.company || `${client.name} Corp`,
          industry:
            client.clientProfile?.industry ||
            ["Technology", "Healthcare", "Finance", "Education", "Retail"][
              Math.floor(Math.random() * 5)
            ],
          companySize:
            client.clientProfile?.companySize ||
            ["1-10", "11-50", "51-200", "201-500", "500+"][
              Math.floor(Math.random() * 5)
            ],
          website:
            client.clientProfile?.website ||
            `https://${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
          totalSpent:
            client.clientProfile?.totalSpent ||
            Math.floor(Math.random() * 50000) + 5000,
          projectsCompleted:
            client.clientProfile?.projectsCompleted ||
            Math.floor(Math.random() * 20) + 1,
          totalProjects:
            client.clientProfile?.totalProjects ||
            Math.floor(Math.random() * 25) + 1,
          averageRating:
            client.clientProfile?.averageRating ??
            parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
          lastProjectDate:
            client.clientProfile?.lastProjectDate ||
            new Date(
              Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
            ).toISOString(),
        },
        profile: client.profile,
      }));

      setClients(enhancedClients);

      // Calculate stats
      const clientStats: ClientStats = {
        totalClients: enhancedClients.length,
        activeClients: enhancedClients.filter((c) => c.isActive).length,
        newThisMonth: enhancedClients.filter((c) => {
          const createdDate = new Date(c.createdAt);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return createdDate >= thisMonth;
        }).length,
        topSpenders: enhancedClients.filter(
          (c) => (c.clientProfile?.totalSpent || 0) > 20000,
        ).length,
        averageProjectValue:
          enhancedClients.reduce(
            (sum, c) => sum + (c.clientProfile?.totalSpent || 0),
            0,
          ) / Math.max(enhancedClients.length, 1),
        clientRetentionRate: 85, // Mock data
      };

      setStats(clientStats);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtering logic moved into useCallback above

  const handleSendMessage = async () => {
    if (!selectedClient || !messageContent.title || !messageContent.message)
      return;

    try {
      await notificationsAPI.create({
        recipients: [selectedClient._id],
        title: messageContent.title,
        message: messageContent.message,
        type: "general",
        priority: "medium",
      });

      setShowMessageModal(false);
      setMessageContent({ title: "", message: "" });
      alert("Message sent successfully!");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getIndustryColor = (industry: string): BadgeVariant => {
    const colors = {
      Technology: "info",
      Healthcare: "success",
      Finance: "warning",
      Education: "primary",
      Retail: "secondary",
    };
    return (colors[industry as keyof typeof colors] ||
      "secondary") as BadgeVariant;
  };

  const getClientScore = (client: Client) => {
    const profile = client.clientProfile;
    if (!profile) return 0;

    let score = 0;
    if (profile.totalSpent) score += Math.min(profile.totalSpent / 1000, 20);
    if (profile.projectsCompleted) score += profile.projectsCompleted * 2;
    if (profile.averageRating)
      score += parseFloat(profile.averageRating.toString()) * 2;

    return Math.min(Math.round(score), 100);
  };

  const uniqueIndustries = Array.from(
    new Set(
      clients
        .map((c) => c.clientProfile?.industry)
        .filter((i): i is string => Boolean(i)),
    ),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <BackToDashboard
              currentRole="admin_outsource"
              variant="breadcrumb"
              className="mb-2"
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Client Management
            </h1>
            <p className="text-gray-600">
              Manage client relationships and business accounts
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <BackToDashboard
              currentRole="admin_outsource"
              variant="button"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <Building className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">
                  Total Clients
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.totalClients || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Active</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.activeClients || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">
                  New This Month
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.newThisMonth || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">
                  Top Spenders
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.topSpenders || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Avg. Value</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(stats?.averageProjectValue || 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Retention</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats?.clientRetentionRate || 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients by name, email, company, or industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Industry:</span>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Industries</option>
                  {uniqueIndustries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card className="p-12 text-center">
              <Building className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No clients found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "No clients match your search criteria."
                  : "No clients available."}
              </p>
            </Card>
          ) : (
            filteredClients.map((client) => {
              return (
                <Card key={client._id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Avatar */}
                      {client.profile?.avatar ? (
                        <Image
                          src={client.profile.avatar}
                          alt={client.name}
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <Building className="h-8 w-8 text-gray-600" />
                      )}
                    </div>

                    {/* Client Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {client.name}
                        </h3>
                        <Badge variant={client.isActive ? "success" : "danger"}>
                          {client.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {client.clientProfile?.averageRating || 0}/5
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {client.email}
                          </p>
                          {client.phone && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-1" />
                              {client.phone}
                            </p>
                          )}
                          {client.clientProfile?.company && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <Building className="h-4 w-4 mr-1" />
                              {client.clientProfile.company}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Total Spent:</strong>{" "}
                            {formatCurrency(
                              client.clientProfile?.totalSpent || 0,
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Projects:</strong>{" "}
                            {client.clientProfile?.projectsCompleted || 0}/
                            {client.clientProfile?.totalProjects || 0}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Company Size:</strong>{" "}
                            {client.clientProfile?.companySize ||
                              "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">
                            <strong>Joined:</strong>{" "}
                            {formatDistanceToNow(new Date(client.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                          {client.clientProfile?.lastProjectDate && (
                            <p className="text-sm text-gray-600">
                              <strong>Last Project:</strong>{" "}
                              {formatDistanceToNow(
                                new Date(client.clientProfile.lastProjectDate),
                                { addSuffix: true },
                              )}
                            </p>
                          )}
                          <div className="flex items-center space-x-1 mt-1">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600">
                              Score: {getClientScore(client)}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Industry & Website */}
                      <div className="flex items-center space-x-4 mb-2">
                        {client.clientProfile?.industry && (
                          <Badge
                            variant={getIndustryColor(
                              client.clientProfile.industry,
                            )}
                            size="sm"
                          >
                            {client.clientProfile.industry}
                          </Badge>
                        )}
                        {client.clientProfile?.website && (
                          <a
                            href={client.clientProfile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {client.clientProfile.website}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowClientModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>

                    <Button
                      onClick={() => {
                        setSelectedClient(client);
                        setShowMessageModal(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Message</span>
                    </Button>

                    <Button
                      onClick={() =>
                        router.push(
                          `/admin/outsource/clients/${client._id}/projects`,
                        )
                      }
                      variant="primary"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>Projects</span>
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Client Details Modal */}
        <Modal
          isOpen={showClientModal}
          onClose={() => {
            setShowClientModal(false);
            setSelectedClient(null);
          }}
          title="Client Details"
          size="xl"
        >
          {selectedClient && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                {selectedClient.profile?.avatar ? (
                  <Image
                    src={selectedClient.profile.avatar}
                    alt={selectedClient.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <Building className="h-10 w-10 text-gray-600" />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold">
                    {selectedClient.name}
                  </h3>
                  <p className="text-gray-600">{selectedClient.email}</p>
                  <Badge
                    variant={selectedClient.isActive ? "success" : "danger"}
                  >
                    {selectedClient.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {selectedClient.clientProfile && (
                <div>
                  <h4 className="font-semibold mb-3">Company Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <p>
                      <strong>Company:</strong>{" "}
                      {selectedClient.clientProfile.company}
                    </p>
                    <p>
                      <strong>Industry:</strong>{" "}
                      {selectedClient.clientProfile.industry}
                    </p>
                    <p>
                      <strong>Size:</strong>{" "}
                      {selectedClient.clientProfile.companySize}
                    </p>
                    <p>
                      <strong>Website:</strong>
                      <a
                        href={selectedClient.clientProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 ml-1"
                      >
                        {selectedClient.clientProfile.website}
                      </a>
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Business Metrics</h4>
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                  <p>
                    <strong>Total Spent:</strong>{" "}
                    {formatCurrency(
                      selectedClient.clientProfile?.totalSpent || 0,
                    )}
                  </p>
                  <p>
                    <strong>Average Rating:</strong>{" "}
                    {selectedClient.clientProfile?.averageRating}/5 ⭐
                  </p>
                  <p>
                    <strong>Projects Completed:</strong>{" "}
                    {selectedClient.clientProfile?.projectsCompleted}
                  </p>
                  <p>
                    <strong>Total Projects:</strong>{" "}
                    {selectedClient.clientProfile?.totalProjects}
                  </p>
                  <p>
                    <strong>Client Score:</strong>{" "}
                    {getClientScore(selectedClient)}/100
                  </p>
                  <p>
                    <strong>Member Since:</strong>{" "}
                    {new Date(selectedClient.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedClient.profile && (
                <div>
                  <h4 className="font-semibold mb-3">Contact Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {selectedClient.phone && (
                      <p>
                        <strong>Phone:</strong> {selectedClient.phone}
                      </p>
                    )}
                    {selectedClient.profile.address && (
                      <div>
                        <strong>Address:</strong>
                        <p className="text-sm text-gray-600">
                          {[
                            selectedClient.profile.address.street,
                            selectedClient.profile.address.city,
                            selectedClient.profile.address.region,
                            selectedClient.profile.address.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                    {selectedClient.profile.bio && (
                      <div className="mt-3">
                        <strong>Bio:</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedClient.profile.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Message Modal */}
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedClient(null);
          }}
          onSend={async (title, message) => {
            if (!selectedClient) return;
            try {
              await notificationsAPI.create({
                recipients: [selectedClient._id],
                title: title,
                message: message,
                type: "general",
                priority: "medium",
              });
              alert("Message sent successfully!");
            } catch (error) {
              console.error("Failed to send message:", error);
              alert("Failed to send message. Please try again.");
            }
          }}
          recipientName={selectedClient?.name || "Select a client"}
          title="Send Message to Client"
        />
      </div>
    </div>
  );
};

export default ClientManagement;
