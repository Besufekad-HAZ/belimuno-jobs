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
import { formatDistanceToNow } from "date-fns";
import { adminAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import BackToDashboard from "@/components/ui/BackToDashboard";
import { toast } from "@/components/ui/sonner";
import { CLIENTS } from "@/data/clients";
import { resolveAssetUrl } from "@/lib/assets";

const PREFERRED_UPLOAD_HOST = "belimuno-uploads.s3.eu-north-1.amazonaws.com";
const LEGACY_UPLOAD_HOSTS = new Set([
  "belimuno-uploads.s3.amazonaws.com",
  "belimuno-uploads.s3.us-east-1.amazonaws.com",
  "belimuno-uploads.s3.us-west-1.amazonaws.com",
]);

const CLIENT_LOGO_SLUG_MAP = CLIENTS.reduce<Map<string, string>>(
  (map, client) => {
    const logoPath = client.logo?.trim();
    if (!logoPath) {
      return map;
    }
    const slug = getClientLogoSlug(logoPath);
    if (!slug) {
      return map;
    }
    const resolved = resolveAssetUrl(logoPath);
    if (!resolved) {
      return map;
    }
    map.set(slug, resolved);
    return map;
  },
  new Map(),
);

function getClientLogoSlug(logoPath: string): string | null {
  if (!logoPath) return null;
  const normalized = logoPath.split("?")[0].split("#")[0].trim();
  if (!normalized.startsWith("/clients/")) {
    return null;
  }
  const filename = normalized.split("/").pop();
  if (!filename) return null;
  const withoutExtension = filename.replace(/\.[^.]+$/u, "");
  const slug = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return slug || null;
}

function normalizeLogoPath(logo?: string | null): string | null {
  if (typeof logo !== "string") return null;
  const trimmed = logo.trim();
  if (!trimmed) return null;
  if (/^data:/iu.test(trimmed)) return trimmed;

  const coerceClientPath = (path: string): string | undefined => {
    const normalizedPath = path.startsWith("/clients/")
      ? path
      : path.includes("/clients/")
        ? path.slice(path.indexOf("/clients/"))
        : path.startsWith("clients/")
          ? `/${path}`
          : undefined;

    if (!normalizedPath) {
      return undefined;
    }

    const slug = getClientLogoSlug(normalizedPath);
    if (slug) {
      const mapped = CLIENT_LOGO_SLUG_MAP.get(slug);
      if (mapped) {
        return mapped;
      }
    }

    return resolveAssetUrl(normalizedPath) ?? normalizedPath;
  };

  if (/^https?:\/\//iu.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (LEGACY_UPLOAD_HOSTS.has(url.hostname)) {
        const candidate = coerceClientPath(url.pathname);
        if (candidate) {
          return candidate;
        }
      }

      if (
        url.hostname === PREFERRED_UPLOAD_HOST ||
        url.pathname.includes("/clients/")
      ) {
        const candidate = coerceClientPath(url.pathname);
        if (candidate) {
          return candidate;
        }
      }
    } catch {
      // ignore parsing errors and fall through
    }
    return trimmed;
  }

  const candidate = coerceClientPath(trimmed);
  if (candidate) {
    return candidate;
  }

  return resolveAssetUrl(trimmed) ?? trimmed;
}

interface TrustedCompanyRecord {
  _id: string;
  name: string;
  status: "active" | "inactive" | "archived";
  description?: string | null;
  website?: string | null;
  brandColor?: string | null;
  logo?: string | null;
  order?: number | null;
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
}

type CompanyFormState = {
  name: string;
  status: "active" | "inactive" | "archived";
  description: string;
  website: string;
  brandColor: string;
  logo: string;
  order: string;
  tags: string;
};

const createEmptyForm = (): CompanyFormState => ({
  name: "",
  status: "active",
  description: "",
  website: "",
  brandColor: "",
  logo: "",
  order: "",
  tags: "",
});

const formatErrorMessage = (error: unknown): string => {
  if (!error) return "Something went wrong";
  const maybeResponse = (
    error as { response?: { data?: { message?: string } } }
  ).response;
  const message = maybeResponse?.data?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "We couldn't complete that request";
};

const statusVariantMap: Record<
  TrustedCompanyRecord["status"],
  "success" | "secondary" | "warning"
> = {
  active: "success",
  inactive: "secondary",
  archived: "warning",
};

const TrustedCompaniesPage: React.FC = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<TrustedCompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<CompanyFormState>(() => createEmptyForm());
  const [activeCompany, setActiveCompany] =
    useState<TrustedCompanyRecord | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const hasAttemptedSeedRef = useRef(false);
  const seedingRef = useRef(false);

  const seedDefaultCompanies = useCallback(async () => {
    if (seedingRef.current) return;
    seedingRef.current = true;
    try {
      await Promise.all(
        CLIENTS.map((client, index) =>
          adminAPI
            .createTrustedCompany({
              name: client.name,
              status: "active",
              order: index + 1,
              brandColor: client.brandColor ?? null,
              website: null,
              description: client.service ?? null,
              logo: normalizeLogoPath(client.logo) ?? null,
              tags: client.type ? [client.type] : [],
            })
            .catch((error) => {
              console.warn(
                `Failed to seed trusted company ${client.name}`,
                error,
              );
            }),
        ),
      );
    } finally {
      seedingRef.current = false;
    }
  }, []);

  const ensureNormalizedLogos = useCallback(
    async (records: TrustedCompanyRecord[]) => {
      if (!Array.isArray(records) || records.length === 0) {
        return records;
      }

      const updates: Promise<unknown>[] = [];
      const normalizedRecords = records.map((record) => {
        const normalizedLogo = normalizeLogoPath(record.logo);
        if (normalizedLogo && normalizedLogo !== record.logo) {
          updates.push(
            adminAPI
              .updateTrustedCompany(record._id, { logo: normalizedLogo })
              .catch((error) => {
                console.warn(
                  `Failed to normalize logo for ${record.name}`,
                  error,
                );
              }),
          );
          return { ...record, logo: normalizedLogo };
        }
        return record;
      });

      if (updates.length > 0) {
        await Promise.allSettled(updates);
      }

      return normalizedRecords;
    },
    [],
  );

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getTrustedCompanies({
        limit: 200,
        sort: "order name",
      });
      let payload = (response.data?.data || []) as TrustedCompanyRecord[];

      if ((!payload || payload.length === 0) && !hasAttemptedSeedRef.current) {
        hasAttemptedSeedRef.current = true;
        await seedDefaultCompanies();
        const seededResponse = await adminAPI.getTrustedCompanies({
          limit: 200,
          sort: "order name",
        });
        payload = (seededResponse.data?.data || []) as TrustedCompanyRecord[];
      }

      const normalized = await ensureNormalizedLogos(payload);
      setCompanies(Array.isArray(normalized) ? normalized : []);
    } catch (error) {
      console.error("Failed to load trusted companies", error);
      toast.error(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [seedDefaultCompanies, ensureNormalizedLogos]);

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const orderA =
        typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB =
        typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [companies]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_outsource", "super_admin"])) {
      router.push("/login");
      return;
    }
    void fetchCompanies();
  }, [router, fetchCompanies]);

  const resetModalState = useCallback(() => {
    setModalOpen(false);
    setActiveCompany(null);
    setForm(createEmptyForm());
    setUploadingLogo(false);
    setLogoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  const openCreateModal = () => {
    resetModalState();
    setModalOpen(true);
  };

  const openEditModal = (company: TrustedCompanyRecord) => {
    resetModalState();
    setActiveCompany(company);
    const normalizedLogo = normalizeLogoPath(company.logo) ?? "";
    setForm({
      name: company.name,
      status: company.status,
      description: company.description || "",
      website: company.website || "",
      brandColor: company.brandColor || "",
      logo: normalizedLogo,
      order: typeof company.order === "number" ? String(company.order) : "",
      tags: Array.isArray(company.tags) ? company.tags.join(", ") : "",
    });
    setLogoPreview(normalizedLogo || null);
    setModalOpen(true);
  };

  const handleLogoSelection: React.ChangeEventHandler<
    HTMLInputElement
  > = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG, SVG).");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo files must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });

    setUploadingLogo(true);
    try {
      const response = await adminAPI.uploadTrustedCompanyLogo(file);
      const uploadedUrl = response.data?.data?.url;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, logo: uploadedUrl }));
        toast.success("Logo uploaded successfully");
      } else {
        toast.error("Upload succeeded but we couldn't read the URL.");
      }
    } catch (error) {
      console.error("Logo upload failed", error);
      toast.error(formatErrorMessage(error));
      setLogoPreview((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return (
          normalizeLogoPath(activeCompany?.logo) ??
          (typeof activeCompany?.logo === "string"
            ? activeCompany.logo.trim() || null
            : null)
        );
      });
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  };

  const handleFieldChange =
    (
      key: keyof CompanyFormState,
    ): React.ChangeEventHandler<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    > =>
    (event) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    const normalizedLogo = normalizeLogoPath(form.logo);
    const payload = {
      name: form.name.trim(),
      status: form.status,
      description: form.description.trim() || null,
      website: form.website.trim() || null,
      brandColor: form.brandColor.trim() || null,
      logo: normalizedLogo ?? (form.logo.trim() || null),
      order:
        form.order.trim() && !Number.isNaN(Number(form.order))
          ? Number(form.order)
          : undefined,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    };

    setSaving(true);
    try {
      if (activeCompany) {
        await adminAPI.updateTrustedCompany(activeCompany._id, payload);
        toast.success("Trusted company updated");
      } else {
        await adminAPI.createTrustedCompany(payload);
        toast.success("Trusted company created");
      }
      await fetchCompanies();
      resetModalState();
    } catch (error) {
      console.error("Failed to save trusted company", error);
      toast.error(formatErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (company: TrustedCompanyRecord) => {
    if (!company?._id) return;
    setDeletingId(company._id);
    try {
      await adminAPI.deleteTrustedCompany(company._id);
      toast.success("Trusted company removed");
      await fetchCompanies();
    } catch (error) {
      console.error("Failed to delete trusted company", error);
      toast.error(formatErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const stats = useMemo(() => {
    if (!companies.length) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        archived: 0,
        lastUpdated: null as string | null,
      };
    }
    const active = companies.filter(
      (company) => company.status === "active",
    ).length;
    const inactive = companies.filter(
      (company) => company.status === "inactive",
    ).length;
    const archived = companies.filter(
      (company) => company.status === "archived",
    ).length;
    const lastUpdated =
      companies
        .map((company) => company.updatedAt || company.createdAt)
        .filter(Boolean)
        .sort()
        .pop() || null;
    return {
      total: companies.length,
      active,
      inactive,
      archived,
      lastUpdated,
    };
  }, [companies]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BackToDashboard
              currentRole="admin_outsource"
              variant="breadcrumb"
              className="mb-2"
            />
            <h1 className="text-3xl font-bold text-gray-900">
              Trusted Companies
            </h1>
            <p className="text-gray-600">
              Manage the organisations showcased in the homepage marquee.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BackToDashboard currentRole="admin_outsource" variant="button" />
            <Button onClick={openCreateModal} variant="primary">
              Add trusted company
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total companies
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {stats.total}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Active marquee logos
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {stats.active}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Inactive placeholders
            </p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">
              {stats.inactive}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last updated
            </p>
            <p className="mt-1 text-sm text-gray-700">
              {stats.lastUpdated
                ? formatDistanceToNow(new Date(stats.lastUpdated), {
                    addSuffix: true,
                  })
                : "–"}
            </p>
          </Card>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <span className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-500" />
          </div>
        ) : sortedCompanies.length === 0 ? (
          <Card className="p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              No trusted companies yet
            </h2>
            <p className="mt-2 text-gray-600">
              Add your first organisation to refresh the homepage marquee.
            </p>
            <Button
              onClick={openCreateModal}
              className="mt-6"
              variant="primary"
            >
              Add trusted company
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {sortedCompanies.map((company) => {
              const orderLabel =
                typeof company.order === "number"
                  ? `#${company.order}`
                  : "Unordered";
              const logoSrc =
                normalizeLogoPath(company.logo) ??
                (typeof company.logo === "string"
                  ? company.logo.trim() || null
                  : null);

              return (
                <Card key={company._id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {company.name}
                        </h3>
                        <Badge variant={statusVariantMap[company.status]}>
                          {company.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{orderLabel}</p>
                    </div>
                    {company.brandColor ? (
                      <span
                        className="inline-flex h-6 w-6 rounded-full border border-gray-200 shadow-sm"
                        style={{ backgroundColor: company.brandColor }}
                        aria-label="Brand colour swatch"
                      />
                    ) : null}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {logoSrc ? (
                        <Image
                          src={logoSrc}
                          alt={`${company.name} logo`}
                          fill
                          className="object-contain"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                          No logo
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-sm text-gray-600">
                      {company.description && <p>{company.description}</p>}
                      {company.website && (
                        <p className="truncate">
                          <span className="font-medium text-gray-700">
                            Website:
                          </span>{" "}
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {company.website}
                          </a>
                        </p>
                      )}
                      {company.tags && company.tags.length > 0 && (
                        <p className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {company.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-gray-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Updated{" "}
                      {company.updatedAt
                        ? formatDistanceToNow(new Date(company.updatedAt), {
                            addSuffix: true,
                          })
                        : "–"}
                    </span>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(company)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(company)}
                        disabled={deletingId === company._id}
                      >
                        {deletingId === company._id ? "Removing…" : "Delete"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={resetModalState}
        title={activeCompany ? "Edit trusted company" : "Add trusted company"}
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Company name"
              value={form.name}
              onChange={handleFieldChange("name")}
              required
            />
            <label className="block text-sm font-medium text-gray-900">
              Status
              <select
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.status}
                onChange={handleFieldChange("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <Input
              label="Website"
              placeholder="https://"
              value={form.website}
              onChange={handleFieldChange("website")}
            />
            <Input
              label="Brand colour"
              placeholder="#0EA5E9"
              value={form.brandColor}
              onChange={handleFieldChange("brandColor")}
            />
            <Input
              label="Display order"
              type="number"
              min={0}
              value={form.order}
              onChange={handleFieldChange("order")}
              helperText="Lower numbers appear earlier in the marquee. Leave blank to append."
            />
            <Input
              label="Tags"
              placeholder="e.g. NGO, Energy"
              value={form.tags}
              onChange={handleFieldChange("tags")}
              helperText="Comma separated keywords"
            />
          </div>

          <label className="block text-sm font-medium text-gray-900">
            Description
            <textarea
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={form.description}
              onChange={handleFieldChange("description")}
              placeholder="Short service line used in hover tooltips"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-[160px_1fr]">
            <div className="relative h-28 w-full overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-gray-500">
                  <span className="font-medium">Logo preview</span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG, SVG up to 5MB
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoSelection}
                  disabled={uploadingLogo}
                />
                {uploadingLogo ? "Uploading…" : "Upload logo"}
              </label>
              {form.logo && (
                <p className="break-all text-xs text-gray-500">
                  Stored URL: <span className="text-blue-600">{form.logo}</span>
                </p>
              )}
              <p className="text-xs text-gray-500">
                Uploading a new logo replaces any existing asset automatically.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={resetModalState}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? "Saving…"
                : activeCompany
                  ? "Save changes"
                  : "Create company"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TrustedCompaniesPage;
