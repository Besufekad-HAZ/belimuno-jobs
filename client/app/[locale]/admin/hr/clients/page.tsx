"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  UploadCloud,
  Edit3,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { adminAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import { toast } from "@/components/ui/sonner";

interface Client {
  _id?: string;
  name: string;
  type: string;
  logo?: string;
  status?: "active" | "inactive" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

type ClientFormState = {
  name: string;
  type: string;
  logo: string;
};

const emptyClientForm: ClientFormState = {
  name: "",
  type: "",
  logo: "",
};

const MAX_CLIENT_LOGO_SIZE = 1 * 1024 * 1024; // 1MB cap to keep client logos lightweight

const typeSuggestions = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Non-profit",
  "Government",
  "Media",
];

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

const ManageClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyClientForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const hasFetchedRef = useRef(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const resetLogoState = useCallback(() => {
    setLogoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setLogoUploadError(null);
    setUploadingLogo(false);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }, [logoInputRef]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) => {
        return (
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
        );
      }),
    [clients],
  );

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getClients({
        limit: 50,
        sort: "-createdAt",
      });

      const clientsData = response.data?.data || [];
      setClients(clientsData);
      setBanner((prev) => (prev?.type === "error" ? null : prev));
    } catch (error) {
      console.error("Failed to load clients:", error);
      setClients([]);
      setBanner({
        type: "error",
        message: "We couldn't load clients. Please try again shortly.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setForm({
        name: client.name,
        type: client.type,
        logo: client.logo || "",
      });
    } else {
      setEditingClient(null);
      setForm(emptyClientForm);
    }
    setFormErrors({});
    setFormMessage(null);
    resetLogoState();
    setShowModal(true);
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setForm(emptyClientForm);
    setFormErrors({});
    setFormMessage(null);
    resetLogoState();
  };

  const handleInputChange =
    (field: keyof ClientFormState) => (value: string) => {
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

  const handleSelectLogo = () => {
    setLogoUploadError(null);
    logoInputRef.current?.click();
  };

  const handleLogoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setLogoUploadError("Please choose an image file (PNG or JPG).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_CLIENT_LOGO_SIZE) {
      setLogoUploadError("Images must be 1MB or smaller.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoUploadError(null);
    setUploadingLogo(true);
    setLogoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });

    try {
      const response = await adminAPI.uploadTeamPhoto(file);
      const uploadedUrl =
        (response.data?.data?.url as string | undefined) ??
        (response.data?.url as string | undefined);

      if (uploadedUrl) {
        // Store the uploaded URL in a temporary state for form submission
        setForm((prev) => ({ ...prev, logo: uploadedUrl }));
        toast.success("Client logo uploaded.");
      } else {
        setLogoUploadError(
          "Upload finished but no URL was returned. Please try again.",
        );
      }
    } catch (error) {
      console.error("Failed to upload logo:", error);
      setLogoUploadError(
        "We couldn't upload that logo. Please try a different file.",
      );
      setLogoPreview((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const previewSource = logoPreview;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = "Please add a client name.";
    }
    if (!form.type.trim()) {
      errors.type = "Please select a client type.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormMessage(null);

      const payload = {
        name: form.name.trim(),
        type: form.type.trim(),
        logo: form.logo.trim() || undefined,
        status: "active" as const, // Default to active
      };

      if (editingClient) {
        await adminAPI.updateClient(editingClient._id!, payload);
        toast.success("Client updated successfully");
      } else {
        await adminAPI.createClient(payload);
        toast.success("Client created successfully");
      }

      await fetchClients();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save client:", error);
      const apiMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setFormMessage({
        type: "error",
        message:
          apiMessage ||
          "We couldn't save this client right now. Please retry in a moment.",
      });
      toast.error("Unable to save client");
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (client: Client) => {
    if (!client._id) return;
    setDeleteTarget(client);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteTarget._id) return;
    setDeleting(true);
    try {
      await adminAPI.deleteClient(deleteTarget._id);
      setClients((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      toast.success("Client deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete client:", error);
      toast.error("Unable to delete this client right now.");
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
    fetchClients();
  }, [fetchClients, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Clients</h1>
            <p className="text-gray-600 max-w-3xl mt-2">
              Create and manage client profiles for the platform
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
              Add Client
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage all client profiles on the platform
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
                    key={`client-skeleton-${index}`}
                    className="flex flex-col rounded-2xl border border-blue-100 bg-white/70 p-4 animate-pulse"
                  >
                    <div className="h-32 w-full rounded-lg bg-blue-100 mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-blue-100" />
                      <div className="h-3 w-3/4 rounded bg-blue-50" />
                      <div className="h-3 w-1/2 rounded bg-blue-50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedClients.map((client) => {
                  return (
                    <div
                      key={client._id || `${client.name}-${client.type}`}
                      className="group relative flex flex-col rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {client.logo && (
                        <div className="relative h-32 w-full overflow-hidden rounded-lg mb-3">
                          <Image
                            src={client.logo}
                            alt={client.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge
                            variant={getStatusColor(client.status || "active")}
                            size="sm"
                          >
                            {client.status || "active"}
                          </Badge>
                          <Badge variant="blue" size="sm">
                            {client.type}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(client.createdAt || "")}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenModal(client)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => requestDelete(client)}
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
                  No clients yet
                </h3>
                <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
                  Start by creating your first client profile to showcase your
                  partnerships and collaborations.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleOpenModal()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingClient ? "Edit Client" : "Create Client"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              ref={firstFieldRef}
              label="Client Name"
              value={form.name}
              onChange={(event) =>
                handleInputChange("name")(event.target.value)
              }
              placeholder="e.g. Acme Corporation"
              error={formErrors.name}
              required
            />
            <div>
              <Input
                label="Client Type"
                value={form.type}
                onChange={(event) =>
                  handleInputChange("type")(event.target.value)
                }
                placeholder="e.g. Technology"
                error={formErrors.type}
                list="client-types"
                required
              />
              <datalist id="client-types">
                {typeSuggestions.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              Client Logo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-blue-100 bg-blue-50 flex items-center justify-center">
                {previewSource ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSource}
                    alt="Client logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold uppercase tracking-wide text-blue-700">
                    LOGO
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center gap-2"
                  onClick={handleSelectLogo}
                  loading={uploadingLogo}
                  disabled={uploadingLogo}
                >
                  <UploadCloud className="h-4 w-4" />
                  {uploadingLogo ? "Uploading..." : "Upload logo"}
                </Button>
                <p className="text-xs text-gray-500">
                  PNG or JPG up to 1MB. We&apos;ll host it for you.
                </p>
                {logoUploadError && (
                  <p className="text-xs text-red-600">{logoUploadError}</p>
                )}
              </div>
            </div>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoFileChange}
          />

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
              {editingClient ? "Update Client" : "Create Client"}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={deleting ? () => {} : cancelDelete}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : "Confirm"}
        size="sm"
        preventCloseOnOutsideClick={deleting}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently delete the client profile. This action cannot
            be undone.
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

export default ManageClientsPage;
