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
  Users,
  UserPlus,
  Trash2,
  ArrowLeft,
  UploadCloud,
  Pencil,
  Save,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { adminAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";
import { DEFAULT_TEAM_MEMBERS } from "@/data/defaultTeamMembers";

interface TeamMember {
  _id?: string;
  name: string;
  role: string;
  department: string;
  photoUrl?: string;
  image?: string;
  photoKey?: string;
  email?: string;
  phone?: string;
  bio?: string;
  order?: number;
  status?: "active" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

type TeamFormState = {
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  photoUrl: string;
  photoKey: string;
  bio: string;
  order: string;
};

const emptyTeamForm: TeamFormState = {
  name: "",
  role: "",
  department: "",
  email: "",
  phone: "",
  photoUrl: "",
  photoKey: "",
  bio: "",
  order: "",
};

const departmentSuggestions = [
  "Management",
  "Administration",
  "Finance",
  "Human Resources",
  "Operations",
  "Strategy",
  "Client Success",
  "Project Delivery",
];

const MAX_TEAM_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB limit to keep admin uploads lightweight

const deriveInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const createMemberKey = (member: TeamMember) => {
  if (member._id) {
    return String(member._id).toLowerCase();
  }
  const namePart = member.name?.trim().toLowerCase() ?? "unknown";
  const rolePart = member.role?.trim().toLowerCase() ?? "role";
  return `${namePart}|${rolePart}`;
};

const dedupeTeamMembers = (members: TeamMember[]): TeamMember[] => {
  const seen = new Map<string, TeamMember>();

  members.forEach((member) => {
    const key = createMemberKey(member);
    if (!seen.has(key)) {
      seen.set(key, member);
      return;
    }

    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, member);
      return;
    }

    const existingOrder =
      typeof existing.order === "number"
        ? existing.order
        : Number.POSITIVE_INFINITY;
    const incomingOrder =
      typeof member.order === "number"
        ? member.order
        : Number.POSITIVE_INFINITY;

    if (incomingOrder < existingOrder) {
      seen.set(key, member);
    }
  });

  return Array.from(seen.values());
};

const ManageTeamPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<TeamFormState>(emptyTeamForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasSeededDefaults, setHasSeededDefaults] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const hasFetchedRef = useRef(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const t = useTranslations("HRManageTeam");

  const safeTranslate = useCallback(
    (key: string, fallback: string) => {
      const value = t(key);
      if (!value || value === key || value === `HRManageTeam.${key}`) {
        return fallback;
      }
      return value;
    },
    [t],
  );

  const resetPhotoState = useCallback(() => {
    setPhotoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setPhotoUploadError(null);
    setUploadingPhoto(false);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }, [photoInputRef]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const sortedTeam = useMemo(
    () =>
      [...teamMembers].sort((a, b) => {
        const firstOrder = typeof a.order === "number" ? a.order : 999;
        const secondOrder = typeof b.order === "number" ? b.order : 999;
        return firstOrder - secondOrder;
      }),
    [teamMembers],
  );

  const seedDefaultTeamMembers = useCallback(async () => {
    try {
      await Promise.all(
        DEFAULT_TEAM_MEMBERS.map(async (member) => {
          try {
            await adminAPI.createTeamMember({
              name: member.name,
              role: member.role,
              department: member.department,
              photoUrl: member.image || undefined,
              email: member.email,
              phone: member.phone,
              bio: member.bio,
              order: member.order,
            });
          } catch (error) {
            const status = (error as { response?: { status?: number } })
              ?.response?.status;

            // Ignore duplicates (409) but surface other errors
            if (status && status !== 409) {
              throw error;
            }
          }
        }),
      );

      toast.success(
        t("messages.seedSuccess") ||
          "Loaded the default leadership roster into the directory.",
      );
    } catch (error) {
      console.error("Failed to seed default team members:", error);
      toast.error(
        t("messages.seedError") ||
          "We couldn't sync the default leadership roster automatically.",
      );
    }
  }, [t]);

  const parseTeamResponse = (payload: unknown): TeamMember[] => {
    const rawData =
      (payload as
        | { data?: TeamMember[]; team?: TeamMember[] }
        | TeamMember[]
        | undefined) || [];

    if (Array.isArray(rawData)) {
      return rawData;
    }
    if (Array.isArray(rawData.data)) {
      return rawData.data;
    }
    if (Array.isArray(rawData.team)) {
      return rawData.team;
    }
    return [];
  };

  const fetchTeamMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTeamMembers({
        limit: 48,
        sort: "order",
      });

      let combined = dedupeTeamMembers(parseTeamResponse(response.data));

      if (combined.length === 0) {
        if (!hasSeededDefaults) {
          await seedDefaultTeamMembers();
          setHasSeededDefaults(true);

          const seededResponse = await adminAPI.getTeamMembers({
            limit: 48,
            sort: "order",
          });
          combined = dedupeTeamMembers(parseTeamResponse(seededResponse.data));
        }

        if (combined.length === 0) {
          setTeamMembers(dedupeTeamMembers(DEFAULT_TEAM_MEMBERS));
          setBanner({
            type: "success",
            message:
              t("messages.seedFallback") ||
              "Showing the default leadership roster. Add or edit members to keep this list current.",
          });
          return;
        }
      }

      setTeamMembers(dedupeTeamMembers(combined));
      setBanner((prev) => (prev?.type === "error" ? null : prev));
    } catch (error) {
      console.error("Failed to load team members:", error);
      setTeamMembers([]);
      setBanner({
        type: "error",
        message:
          t("messages.loadError") ||
          "We couldn't load team members. Please try again shortly.",
      });
    } finally {
      setLoading(false);
    }
  }, [hasSeededDefaults, seedDefaultTeamMembers, t]);

  const handleOpenModal = () => {
    setForm({
      ...emptyTeamForm,
      order: (teamMembers.length + 1).toString(),
    });
    setFormErrors({});
    setFormMessage(null);
    setEditingMember(null);
    resetPhotoState();
    setShowModal(true);
    // Focus first field after next paint
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm(emptyTeamForm);
    setFormErrors({});
    setFormMessage(null);
    setEditingMember(null);
    resetPhotoState();
  };

  const handleEditMember = (member: TeamMember) => {
    resetPhotoState();
    setEditingMember(member);
    setForm({
      name: member.name || "",
      role: member.role || "",
      department: member.department || "",
      email: member.email || "",
      phone: member.phone || "",
      photoUrl: member.photoUrl || member.image || "",
      photoKey: member.photoKey || "",
      bio: member.bio || "",
      order:
        typeof member.order === "number" && Number.isFinite(member.order)
          ? String(member.order)
          : "",
    });
    setFormErrors({});
    setFormMessage(null);
    setShowModal(true);
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  };

  const handleInputChange = (field: keyof TeamFormState) => (value: string) => {
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

  const handlePhotoUrlChange = (value: string, key?: string | null) => {
    const sanitized = value.trim();
    setForm((prev) => {
      const next = { ...prev, photoUrl: sanitized };
      if (key !== undefined) {
        next.photoKey = key ? key : "";
      } else if (!sanitized) {
        next.photoKey = "";
      }
      return next;
    });
    setFormErrors((prev) => {
      if (!prev.photoUrl) {
        return prev;
      }
      const next = { ...prev };
      delete next.photoUrl;
      return next;
    });
    setPhotoUploadError(null);
    setPhotoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return sanitized ? sanitized : null;
    });
  };

  const handleSelectPhoto = () => {
    setPhotoUploadError(null);
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoUploadError("Please choose an image file (PNG or JPG).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_TEAM_IMAGE_SIZE) {
      setPhotoUploadError("Images must be 1MB or smaller.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoUploadError(null);
    setUploadingPhoto(true);
    setPhotoPreview((prev) => {
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
      const uploadedKey =
        (response.data?.data?.key as string | undefined) ??
        (response.data?.data?.photoKey as string | undefined) ??
        (response.data?.data?.filename as string | undefined) ??
        (response.data?.key as string | undefined) ??
        (response.data?.filename as string | undefined);

      if (uploadedUrl) {
        handlePhotoUrlChange(uploadedUrl, uploadedKey ?? null);
        toast.success("Profile photo uploaded.");
      } else {
        setPhotoUploadError(
          "Upload finished but no URL was returned. Please paste it manually.",
        );
      }
    } catch (error) {
      console.error("Failed to upload team photo:", error);
      setPhotoUploadError(
        "We couldn't upload that image. Please try a different file.",
      );
      setPhotoPreview((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  const previewSource =
    photoPreview ?? (form.photoUrl?.trim() ? form.photoUrl.trim() : null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};

    if (!form.name.trim()) {
      errors.name = "Please add the teammate's full name.";
    }
    if (!form.role.trim()) {
      errors.role = "Please specify their role or title.";
    }
    if (!form.department.trim()) {
      errors.department = "Please add a department or division.";
    }
    if (form.order) {
      const parsedOrder = Number(form.order);
      if (Number.isNaN(parsedOrder)) {
        errors.order = "Display order must be a valid number.";
      } else if (parsedOrder < 0) {
        errors.order = "Display order cannot be negative.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const isEditing = Boolean(editingMember?._id);

    try {
      setSubmitting(true);
      setFormMessage(null);

      const trimmedPhotoKey = form.photoKey.trim();
      const photoKeyPayload = trimmedPhotoKey
        ? trimmedPhotoKey
        : isEditing && editingMember?.photoKey
          ? null
          : undefined;

      const payload: {
        name: string;
        role: string;
        department: string;
        photoUrl?: string;
        photoKey?: string | null;
        email?: string;
        phone?: string;
        bio?: string;
        order?: number;
      } = {
        name: form.name.trim(),
        role: form.role.trim(),
        department: form.department.trim(),
        photoUrl: form.photoUrl.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        bio: form.bio.trim() || undefined,
        order: form.order ? Number(form.order) : undefined,
      };

      if (photoKeyPayload !== undefined) {
        payload.photoKey = photoKeyPayload;
      }

      if (isEditing && editingMember?._id) {
        await adminAPI.updateTeamMember(editingMember._id, payload);
        toast.success(
          t("messages.updateSuccess", { name: payload.name }) ||
            `${payload.name} has been updated.`,
        );
      } else {
        await adminAPI.createTeamMember(payload);
        toast.success(
          t("messages.createSuccess", { name: payload.name }) ||
            `${payload.name} has been added to the team.`,
        );
      }

      await fetchTeamMembers();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save team member:", error);
      const apiMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setFormMessage({
        type: "error",
        message:
          apiMessage ||
          "We couldn't save this team member right now. Please retry in a moment.",
      });
      toast.error(
        isEditing
          ? "Unable to update team member"
          : "Unable to add team member",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (member: TeamMember) => {
    if (!member._id) return;
    setDeleteTarget(member);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteTarget._id) return;
    setDeleting(true);
    try {
      await adminAPI.deleteTeamMember(deleteTarget._id);
      setTeamMembers((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      toast.success(
        t("messages.deleteSuccess", { name: deleteTarget.name }) ||
          `${deleteTarget.name} has been removed from the team.`,
      );
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete team member:", error);
      toast.error(
        t("messages.deleteError") ||
          "Unable to remove this team member right now.",
      );
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
    fetchTeamMembers();
  }, [fetchTeamMembers, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-600 max-w-3xl mt-2">{t("subtitle")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => router.push("/admin/hr/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("buttons.back")}
            </Button>
            <Button
              variant="primary"
              className="flex items-center justify-center gap-2"
              onClick={handleOpenModal}
            >
              <UserPlus className="h-4 w-4" />
              {t("buttons.addMember")}
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("list.title")}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{t("list.subtitle")}</p>
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
                    key={`team-skeleton-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-cyan-100 bg-white/70 p-4 animate-pulse"
                  >
                    <div className="h-16 w-16 rounded-full bg-cyan-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-cyan-100" />
                      <div className="h-3 w-24 rounded bg-cyan-50" />
                      <div className="h-3 w-20 rounded bg-cyan-50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedTeam.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedTeam.map((member) => {
                  const photo = member.photoUrl || member.image;
                  return (
                    <div
                      key={member._id || `${member.name}-${member.role}`}
                      className="group relative flex items-start gap-4 rounded-2xl border border-cyan-100 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-cyan-200/70">
                        {photo ? (
                          <Image
                            src={photo}
                            alt={member.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-100 via-blue-100 to-indigo-200 text-base font-semibold text-slate-700">
                            {deriveInitials(member.name)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {member.name}
                          </h3>
                          {typeof member.order === "number" && (
                            <span className="text-xs uppercase tracking-[0.2em] text-cyan-600">
                              #{member.order}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="blue"
                          size="sm"
                          className="mt-1 uppercase tracking-[0.25em]"
                        >
                          {member.department}
                        </Badge>
                        <p className="mt-2 text-sm font-medium text-slate-600 line-clamp-2">
                          {member.role}
                        </p>
                        {member.bio && (
                          <p className="mt-1 text-xs text-slate-500 line-clamp-3">
                            {member.bio}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          {member.email && <span>{member.email}</span>}
                          {member.phone && <span>{member.phone}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {member._id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-cyan-600 hover:text-cyan-700"
                              onClick={() => handleEditMember(member)}
                              aria-label={t("buttons.editMember")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => requestDelete(member)}
                              aria-label={`Remove ${member.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t("empty.title")}
                </h3>
                <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
                  {t("empty.description")}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={handleOpenModal}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("buttons.addMember")}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={
          editingMember
            ? safeTranslate("modal.editTitle", "Edit team member")
            : safeTranslate("modal.title", "Add a team member")
        }
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
              label="Full name"
              value={form.name}
              onChange={(event) =>
                handleInputChange("name")(event.target.value)
              }
              placeholder="e.g. Mulusew Asres"
              error={formErrors.name}
              required
            />
            <Input
              label="Role / Title"
              value={form.role}
              onChange={(event) =>
                handleInputChange("role")(event.target.value)
              }
              placeholder="e.g. Managing Director"
              error={formErrors.role}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Department"
                value={form.department}
                onChange={(event) =>
                  handleInputChange("department")(event.target.value)
                }
                placeholder="e.g. Operations"
                error={formErrors.department}
                list="manage-team-departments"
                required
              />
              <datalist id="manage-team-departments">
                {departmentSuggestions.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>
            <Input
              label="Display order"
              type="number"
              min={0}
              value={form.order}
              onChange={(event) =>
                handleInputChange("order")(event.target.value)
              }
              placeholder="1"
              helperText="Lower numbers appear first on the About page"
              error={formErrors.order}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={(event) =>
                handleInputChange("email")(event.target.value)
              }
              placeholder="name@belimunojobs.com"
            />
            <Input
              label="Phone (optional)"
              type="tel"
              value={form.phone}
              onChange={(event) =>
                handleInputChange("phone")(event.target.value)
              }
              placeholder="+251 900 000 000"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-900">
                Profile photo
              </label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-cyan-100 bg-cyan-50 flex items-center justify-center">
                  {previewSource ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewSource}
                      alt={
                        form.name ? `${form.name} preview` : "Profile preview"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-semibold uppercase tracking-wide text-cyan-700">
                      {deriveInitials(form.name || "Team Member") || "TM"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="inline-flex items-center gap-2"
                    onClick={handleSelectPhoto}
                    loading={uploadingPhoto}
                    disabled={uploadingPhoto}
                  >
                    <UploadCloud className="h-4 w-4" />
                    {uploadingPhoto ? "Uploading..." : "Upload photo"}
                  </Button>
                  <p className="text-xs text-gray-500">
                    PNG or JPG up to 1MB. We&apos;ll host it for you.
                  </p>
                  {photoUploadError && (
                    <p className="text-xs text-red-600">{photoUploadError}</p>
                  )}
                </div>
              </div>
              <Input
                label="Profile photo URL (optional)"
                value={form.photoUrl}
                onChange={(event) => handlePhotoUrlChange(event.target.value)}
                placeholder="https://..."
                helperText="Paste a public image URL or use the upload button above."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Bio highlight (optional)
              </label>
              <textarea
                value={form.bio}
                onChange={(event) =>
                  handleInputChange("bio")(event.target.value)
                }
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Two short sentences that celebrate their impact."
              />
            </div>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoFileChange}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="min-w-[110px]"
            >
              {safeTranslate("modal.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="min-w-[150px] inline-flex items-center gap-2"
            >
              {editingMember ? (
                <>
                  <Save className="h-4 w-4" />
                  <span>
                    {safeTranslate("modal.update", "Update team member")}
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>
                    {safeTranslate("modal.submit", "Save team member")}
                  </span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={deleting ? () => {} : cancelDelete}
        title={deleteTarget ? `Remove ${deleteTarget.name}?` : "Confirm"}
        size="sm"
        preventCloseOnOutsideClick={deleting}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently remove the team member from the directory. You
            can re-add them later, but their ordering information may change.
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

export default ManageTeamPage;
