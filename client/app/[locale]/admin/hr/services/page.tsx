"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  Edit3,
  Calendar,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { adminAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import { toast } from "@/components/ui/sonner";

interface Service {
  _id: string;
  title: string;
  description: string;
  status?: "active" | "inactive" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

type ServiceFormState = {
  title: string;
  description: string;
};

const emptyServiceForm: ServiceFormState = {
  title: "",
  description: "",
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "warning";
    case "archived":
      return "gray";
    default:
      return "blue";
  }
};

const ManageServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceFormState>(emptyServiceForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const hasFetchedRef = useRef(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  // Services are already sorted oldest first from the API
  const sortedServices = useMemo(() => services, [services]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getServices({
        limit: 50,
        sort: "createdAt",
      });

      const servicesData = response.data?.data || [];
      setServices(servicesData);
      setBanner((prev) => (prev?.type === "error" ? null : prev));
    } catch (error) {
      console.error("Failed to load services:", error);
      setServices([]);
      setBanner({
        type: "error",
        message: "We couldn't load services. Please try again shortly.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setForm({
        title: service.title,
        description: service.description,
      });
    } else {
      setEditingService(null);
      setForm(emptyServiceForm);
    }
    setFormErrors({});
    setFormMessage(null);
    setShowModal(true);
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setForm(emptyServiceForm);
    setFormErrors({});
    setFormMessage(null);
  };

  const handleInputChange =
    (field: keyof ServiceFormState) => (value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        if (!prev[field]) {
          return prev;
        }
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};

    if (!form.title.trim()) {
      errors.title = "Please add a service title.";
    }
    if (!form.description.trim()) {
      errors.description = "Please add a service description.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormMessage(null);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: "active" as const, // Default to active
      };

      if (editingService) {
        await adminAPI.updateService(editingService._id!, payload);
        toast.success("Service updated successfully");
      } else {
        await adminAPI.createService(payload);
        toast.success("Service created successfully");
      }

      await fetchServices();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save service:", error);
      const apiMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setFormMessage({
        type: "error",
        message:
          apiMessage ||
          "We couldn't save this service right now. Please retry in a moment.",
      });
      toast.error("Unable to save service");
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (service: Service) => {
    if (!service._id) return;
    setDeleteTarget(service);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteTarget._id) return;
    setDeleting(true);
    try {
      await adminAPI.deleteService(deleteTarget._id);
      setServices((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      toast.success("Service deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error("Unable to delete this service right now.");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_hr"])) {
      router.push("/login");
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchServices();
  }, [fetchServices, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Services
            </h1>
            <p className="text-gray-600 max-w-3xl mt-2">
              Create and manage services offered on the platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => router.push("/admin/hr/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button
              variant="primary"
              className="flex items-center justify-center gap-2"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Services</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage all services offered on the platform
              </p>
            </div>

            {banner && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${banner.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
              >
                {banner.message}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`service-skeleton-${index}`}
                    className="flex flex-col rounded-2xl border border-blue-100 bg-white/70 p-4 animate-pulse"
                  >
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-blue-100" />
                      <div className="h-3 w-3/4 rounded bg-blue-50" />
                      <div className="h-3 w-1/2 rounded bg-blue-50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedServices.map((service) => {
                  return (
                    <div
                      key={service._id || service.title}
                      className="group relative flex flex-col rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge
                            variant={getStatusColor(service.status || "active")}
                            size="sm"
                          >
                            {service.status || "active"}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(service.createdAt || "")}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenModal(service)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => requestDelete(service)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No services yet
                </h3>
                <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
                  Start by creating your first service to showcase what your
                  platform offers.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleOpenModal()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingService ? "Edit Service" : "Create Service"}
        size="lg"
      >
        {formMessage && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${formMessage.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {formMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            ref={firstFieldRef}
            label="Service Title"
            value={form.title}
            onChange={(event) => handleInputChange("title")(event.target.value)}
            placeholder="e.g. Manpower Supply"
            error={formErrors.title}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                handleInputChange("description")(event.target.value)
              }
              placeholder="Describe the service in detail..."
              rows={6}
              className="w-full rounded-lg border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
            {formErrors.description && (
              <p className="mt-1 text-xs text-red-600">
                {formErrors.description}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="min-w-[110px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="min-w-[150px]"
            >
              <Plus className="h-4 w-4" />
              {editingService ? "Update Service" : "Create Service"}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={deleting ? () => {} : cancelDelete}
        title={deleteTarget ? `Delete "${deleteTarget.title}"?` : "Confirm"}
        size="sm"
        preventCloseOnOutsideClick={deleting}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently delete the service. This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={deleting ? undefined : cancelDelete}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={confirmDelete}
              loading={deleting}
              disabled={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageServicesPage;
