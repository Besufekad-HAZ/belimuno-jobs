"use client";

import { useEffect, useRef, useState } from "react";
import type { User as BaseUser } from "@/lib/auth";
import { getStoredUser } from "@/lib/auth";
import { authAPI, workerAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import BackToDashboard from "@/components/ui/BackToDashboard";
import EnhancedCVBuilder from "@/components/ui/EnhancedCVBuilder";
import jsPDF from "jspdf";
import {
  Camera,
  User2,
  Briefcase,
  GraduationCap,
  FileText,
  Sparkles,
  FileUp,
  FileIcon,
  Trash2,
  Link2,
  X,
  Eye,
  Edit,
  Plus,
} from "lucide-react";
import Cookies from "js-cookie";

// Types
type Role = BaseUser["role"];

type Availability = "full-time" | "part-time" | "freelance";

type Education = {
  school?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

type WorkItem = {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
};

type ExtendedUser = BaseUser & {
  isVerified?: boolean;
  isActive?: boolean;
  profile?: BaseUser["profile"] & {
    avatar?: string;
    bio?: string;
    dob?: string | Date;
    cv?: { name?: string; mimeType?: string; data?: string };
  };
  workerProfile?: {
    skills?: string[];
    experience?: string;
    hourlyRate?: number;
    availability?: Availability;
    portfolio?: string[];
    certifications?: string[];
    languages?: string[];
    education?: Education[];
    workHistory?: WorkItem[];
  };
  clientProfile?: {
    companyName?: string;
    industry?: string;
    website?: string;
  };
};

interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  profile?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
  workerProfile?: Record<string, unknown>;
  clientProfile?: Record<string, unknown>;
}

// Helper UI components (defined before usage to avoid TDZ issues)
const AddSimple: React.FC<{
  onAdd: (value: string) => void;
  placeholder?: string;
}> = ({ onAdd, placeholder }) => {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2">
      <Input
        placeholder={placeholder || "Type and add"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        onClick={() => {
          onAdd(value);
          setValue("");
        }}
      >
        Add
      </Button>
    </div>
  );
};

const AddSkill: React.FC<{ onAdd: (skill: string) => void }> = ({ onAdd }) => {
  const [skill, setSkill] = useState("");
  return (
    <div className="flex gap-2">
      <Input
        placeholder="e.g., Floor polishing, Deep cleaning"
        value={skill}
        onChange={(e) => setSkill(e.target.value)}
      />
      <Button
        onClick={() => {
          onAdd(skill);
          setSkill("");
        }}
      >
        Add
      </Button>
    </div>
  );
};

const AddEducationForm: React.FC<{ onAdd: (item: Education) => void }> = ({
  onAdd,
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Education>({});
  return (
    <div>
      {!open ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          + Add education
        </Button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="School/University"
            value={form.school || ""}
            onChange={(e) => setForm({ ...form, school: e.target.value })}
          />
          <Input
            placeholder="Degree"
            value={form.degree || ""}
            onChange={(e) => setForm({ ...form, degree: e.target.value })}
          />
          <Input
            placeholder="Field"
            value={form.field || ""}
            onChange={(e) => setForm({ ...form, field: e.target.value })}
          />
          <Input
            placeholder="Start (YYYY-MM)"
            value={form.startDate || ""}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            placeholder="End (YYYY-MM)"
            value={form.endDate || ""}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onAdd(form);
                setOpen(false);
                setForm({});
              }}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const AddWorkForm: React.FC<{ onAdd: (item: WorkItem) => void }> = ({
  onAdd,
}) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<WorkItem>({});
  return (
    <div>
      {!open ? (
        <Button variant="outline" onClick={() => setOpen(true)}>
          + Add work
        </Button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Company"
            value={form.company || ""}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <Input
            placeholder="Title/Role"
            value={form.title || ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            placeholder="Start (YYYY-MM)"
            value={form.startDate || ""}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            placeholder="End (YYYY-MM)"
            value={form.endDate || ""}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                onAdd(form);
                setOpen(false);
                setForm({});
              }}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfilePage = () => {
  const [user, setUser] = useState<ExtendedUser | null>(
    getStoredUser() as ExtendedUser | null,
  );
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.profile?.avatar || null,
  );
  const [cvPreview, setCvPreview] = useState<string | null>(
    user?.profile?.cv?.data || null,
  );
  const [cvObjectUrl, setCvObjectUrl] = useState<string | null>(null);
  const ensureDataUrl = (
    data: string | null | undefined,
    mimeType?: string,
  ): string | null => {
    if (!data) return null;
    if (data.startsWith("data:")) return data;
    const mt = mimeType || "application/pdf";
    return `data:${mt};base64,${data}`;
  };
  const toBlobUrl = (
    data: string | null | undefined,
    mimeType?: string,
  ): string | null => {
    if (!data) return null;
    try {
      let base64: string;
      let mt = mimeType || "application/pdf";
      if (data.startsWith("data:")) {
        const parts = data.split(",");
        const header = parts[0];
        const b64 = parts[1] || "";
        const match = /data:(.*?);base64/.exec(header);
        if (match && match[1]) mt = match[1];
        base64 = b64;
      } else {
        base64 = data;
      }
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mt });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  };
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cvRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const updateUser = () => setUser(getStoredUser() as ExtendedUser | null);
    window.addEventListener("authChanged", updateUser);
    window.addEventListener("storage", updateUser);
    // Also fetch fresh data from server so avatar/CV persist across refresh without relying on cookies
    (async () => {
      try {
        const res = await authAPI.getMe();
        const serverUser = res.data?.user as ExtendedUser | undefined;
        if (serverUser) {
          setUser(serverUser);
          setCvPreview(
            ensureDataUrl(
              serverUser.profile?.cv?.data,
              serverUser.profile?.cv?.mimeType,
            ),
          );
          try {
            const safeUser: ExtendedUser = { ...serverUser };
            // Avoid storing huge base64 blobs in cookies
            if (
              safeUser.profile?.cv?.data &&
              safeUser.profile.cv.data.length > 500_000
            ) {
              const { name, mimeType } = safeUser.profile.cv;
              safeUser.profile = {
                ...safeUser.profile,
                cv: { name, mimeType },
              };
            }
            Cookies.set("user", JSON.stringify(safeUser), { expires: 30 });
          } catch {}
        }
      } catch {}
    })();
    return () => {
      window.removeEventListener("authChanged", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  // Keep avatar preview in sync with server/user updates
  useEffect(() => {
    setAvatarPreview(user?.profile?.avatar || null);
  }, [user?.profile?.avatar]);

  // Keep CV preview normalized and in sync with user changes
  useEffect(() => {
    const data = user?.profile?.cv?.data;
    const mime = user?.profile?.cv?.mimeType;
    setCvPreview(ensureDataUrl(data, mime));
    // Recreate object URL for reliable viewing/downloading
    setCvObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      const url = toBlobUrl(data || null, mime);
      return url;
    });
  }, [user?.profile?.cv?.data, user?.profile?.cv?.mimeType]);

  if (!user) {
    return <div className="p-8 text-center">You are not logged in.</div>;
  }

  const role: Role = user.role;

  const profileCompletion = (() => {
    if (role === "worker") {
      const factors = [
        !!user.profile?.avatar,
        !!(user.profile?.bio && user.profile.bio.trim().length >= 10),
        (user.workerProfile?.skills?.length || 0) >= 3,
        !!(
          user.workerProfile?.experience &&
          user.workerProfile.experience.trim().length >= 20
        ),
        (user.workerProfile?.certifications?.length || 0) > 0,
        (user.workerProfile?.languages?.length || 0) > 0,
        (user.workerProfile?.education?.length || 0) > 0,
        (user.workerProfile?.workHistory?.length || 0) > 0,
        !!user.profile?.dob,
        !!user.profile?.cv,
      ];
      return Math.round(
        (factors.filter(Boolean).length / factors.length) * 100,
      );
    }
    if (role === "client") {
      const factors = [
        !!user.profile?.avatar,
        !!(user.profile?.bio && user.profile.bio.trim().length >= 10),
        !!user.clientProfile?.companyName,
        !!user.clientProfile?.website,
        !!user.clientProfile?.industry,
      ];
      return Math.round(
        (factors.filter(Boolean).length / factors.length) * 100,
      );
    }
    const factors = [!!user.profile?.avatar, !!user.profile?.bio];
    return Math.round((factors.filter(Boolean).length / factors.length) * 100);
  })();

  const updateLocalUser = (partial: Partial<ExtendedUser>) => {
    const next = { ...user, ...partial } as ExtendedUser;
    setUser(next);
    try {
      const safe: ExtendedUser = { ...next };
      // If updated payload contains cv data, keep a local preview before stripping
      const incomingCvData =
        typeof (partial as unknown) === "object" &&
        partial !== null &&
        "profile" in (partial as Record<string, unknown>) &&
        (partial as { profile?: { cv?: { data?: unknown } } }).profile?.cv
          ?.data;
      if (typeof incomingCvData === "string") {
        const incomingMime = (
          partial as { profile?: { cv?: { mimeType?: string } } }
        )?.profile?.cv?.mimeType;
        setCvPreview(ensureDataUrl(incomingCvData, incomingMime));
      }
      if (safe.profile?.cv?.data && safe.profile.cv.data.length > 500_000) {
        const { name, mimeType } = safe.profile.cv;
        safe.profile = { ...safe.profile, cv: { name, mimeType } };
      }
      Cookies.set("user", JSON.stringify(safe), { expires: 30 });
      window.dispatchEvent(new Event("authChanged"));
    } catch {}
  };

  const saveProfile = async (payload: ProfileUpdatePayload) => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(
        payload as unknown as Record<string, unknown>,
      );
      const updated = (res.data?.user || res.data?.data?.user) as
        | ExtendedUser
        | undefined;
      if (updated) updateLocalUser(updated);
    } catch (e) {
      console.error("Failed to save profile", e);
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      await saveProfile({ profile: { ...user.profile, avatar: base64 } });
    };
    reader.readAsDataURL(file);
  };

  // Worker helpers
  const addSkill = async (skill: string) => {
    const list = user.workerProfile?.skills || [];
    const v = skill.trim();
    if (!v || list.includes(v)) return;
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, skills: [...list, v] },
    };
    updateLocalUser(nextUser);
    await saveProfile({
      workerProfile: { skills: nextUser.workerProfile?.skills },
    });
  };
  const removeSkill = async (skill: string) => {
    const list = (user.workerProfile?.skills || []).filter((s) => s !== skill);
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, skills: list },
    };
    updateLocalUser(nextUser);
    await saveProfile({ workerProfile: { skills: list } });
  };

  const setExperienceSummary = async (summary: string) => {
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, experience: summary },
    };
    updateLocalUser(nextUser);
    await saveProfile({ workerProfile: { experience: summary } });
  };

  const addCertification = async (cert: string) => {
    const list = user.workerProfile?.certifications || [];
    const v = cert.trim();
    if (!v || list.includes(v)) return;
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, certifications: [...list, v] },
    };
    updateLocalUser(nextUser);
    await saveProfile({
      workerProfile: { certifications: nextUser.workerProfile?.certifications },
    });
  };
  const removeCertification = async (cert: string) => {
    const list = (user.workerProfile?.certifications || []).filter(
      (c) => c !== cert,
    );
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, certifications: list },
    };
    updateLocalUser(nextUser);
    await saveProfile({ workerProfile: { certifications: list } });
  };

  const addLanguage = async (lang: string) => {
    const list = user.workerProfile?.languages || [];
    const v = lang.trim();
    if (!v || list.includes(v)) return;
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, languages: [...list, v] },
    };
    updateLocalUser(nextUser);
    await saveProfile({
      workerProfile: { languages: nextUser.workerProfile?.languages },
    });
  };
  const removeLanguage = async (lang: string) => {
    const list = (user.workerProfile?.languages || []).filter(
      (l) => l !== lang,
    );
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, languages: list },
    };
    updateLocalUser(nextUser);
    await saveProfile({ workerProfile: { languages: list } });
  };

  const addPortfolioLink = async (url: string) => {
    const list = user.workerProfile?.portfolio || [];
    const v = url.trim();
    if (!v) return;
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, portfolio: [...list, v] },
    };
    updateLocalUser(nextUser);
    await saveProfile({
      workerProfile: { portfolio: nextUser.workerProfile?.portfolio },
    });
  };
  const removePortfolioLink = async (url: string) => {
    const list = (user.workerProfile?.portfolio || []).filter((u) => u !== url);
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, portfolio: list },
    };
    updateLocalUser(nextUser);
    await saveProfile({ workerProfile: { portfolio: list } });
  };

  const addEducationItem = async (item: Education) => {
    const list = user.workerProfile?.education || [];
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, education: [...list, item] },
    };
    updateLocalUser(nextUser);
    await saveProfile({
      workerProfile: { education: nextUser.workerProfile?.education },
    });
  };
  const removeEducationItem = async (index: number) => {
    const list = [...(user.workerProfile?.education || [])];
    list.splice(index, 1);
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, education: list },
    };
    updateLocalUser(nextUser);
    await saveProfile({ workerProfile: { education: list } });
  };

  const addWorkItem = async (item: WorkItem) => {
    const list = user.workerProfile?.workHistory || [];
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, workHistory: [...list, item] },
    };
    updateLocalUser(nextUser);
    await saveProfile({
      workerProfile: { workHistory: nextUser.workerProfile?.workHistory },
    });
  };
  const removeWorkItem = async (index: number) => {
    const list = [...(user.workerProfile?.workHistory || [])];
    list.splice(index, 1);
    const nextUser: ExtendedUser = {
      ...user,
      workerProfile: { ...user.workerProfile, workHistory: list },
    };
    updateLocalUser(nextUser);
    await saveProfile({ workerProfile: { workHistory: list } });
  };

  const onDOBBlur = async (value: string) => {
    await saveProfile({
      profile: { ...user.profile, dob: value && value.trim() ? value : null },
    });
  };

  const onCVFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const cv = { name: file.name, mimeType: file.type, data: base64 };
      setCvPreview(ensureDataUrl(base64, file.type));
      // Update blob URL for reliable viewing
      setCvObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return toBlobUrl(base64, file.type);
      });
      // Optimistically update local user so UI shows a proper link and file name
      updateLocalUser({
        profile: { ...(user.profile || {}), cv },
      } as unknown as ExtendedUser);
      await saveProfile({ profile: { ...user.profile, cv } });
      // Reset input to allow selecting the same file again
      if (cvRef.current) cvRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const onDeleteCV = async () => {
    // send null to explicitly delete server-side
    setCvPreview(null);
    setCvObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    // Optimistic local update to remove cv instantly
    const np = { ...(user.profile || {}) } as Record<string, unknown>;
    delete np["cv"];
    const nextProfile = np as NonNullable<ExtendedUser["profile"]>;
    updateLocalUser({ profile: nextProfile } as unknown as ExtendedUser);
    await saveProfile({ profile: { ...user.profile, cv: null } });
    if (cvRef.current) cvRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-4">
          <BackToDashboard
            currentRole={user?.role || "worker"}
            variant="breadcrumb"
            className="mb-4"
          />
        </div>
        <div className="flex items-start gap-6 mb-8">
          <Card className="flex-1">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User2 className="h-10 w-10 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow"
                  title="Change avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && onAvatarChange(e.target.files[0])
                  }
                />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {role.replace("_", " ")}
                  </Badge>
                  {user.isVerified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Pending</Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
          {/* Duplicate profile completion card removed; sidebar card remains */}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Bio</h3>
                  <p className="text-sm text-gray-600">
                    Add a short, compelling summary about you.
                  </p>
                </div>
                <div className="flex-1">
                  <textarea
                    rows={3}
                    defaultValue={user.profile?.bio || ""}
                    onBlur={(e) =>
                      saveProfile({
                        profile: { ...user.profile, bio: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell clients about yourself, your strengths and achievements"
                  />
                </div>
              </div>
            </Card>

            {/* Worker blocks */}
            {role === "worker" && (
              <>
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Experience Summary
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Summarize your relevant work experience, achievements, and
                    tools.
                  </p>
                  <textarea
                    rows={4}
                    defaultValue={user.workerProfile?.experience || ""}
                    onBlur={(e) => setExperienceSummary(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 3+ years in cleaning services, specialized in office and post-construction cleaning..."
                  />
                </Card>

                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" /> Skills
                  </h3>
                  <AddSkill onAdd={addSkill} />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(user.workerProfile?.skills || []).map((s, i) => (
                      <span
                        key={i}
                        className="group inline-flex items-center gap-1 border border-gray-200 rounded-full bg-white px-2 py-1 shadow-sm"
                      >
                        <Badge
                          className="!bg-transparent !border-0 !px-0 !py-0"
                          variant="secondary"
                          size="sm"
                        >
                          {s}
                        </Badge>
                        <button
                          aria-label={`Remove ${s}`}
                          className="p-0.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeSkill(s)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Certifications &
                    Languages
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Certifications
                      </h4>
                      <AddSimple
                        onAdd={addCertification}
                        placeholder="e.g., OSHA Safety, Cleaning Pro Level 2"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(user.workerProfile?.certifications || []).map(
                          (c, i) => (
                            <span
                              key={i}
                              className="group inline-flex items-center gap-1 border border-gray-200 rounded-full bg-white px-2 py-1 shadow-sm"
                            >
                              <Badge
                                className="!bg-transparent !border-0 !px-0 !py-0"
                                variant="secondary"
                                size="sm"
                              >
                                {c}
                              </Badge>
                              <button
                                className="p-0.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => removeCertification(c)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Languages
                      </h4>
                      <AddSimple
                        onAdd={addLanguage}
                        placeholder="e.g., Amharic, English"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(user.workerProfile?.languages || []).map((l, i) => (
                          <span
                            key={i}
                            className="group inline-flex items-center gap-1 border border-gray-200 rounded-full bg-white px-2 py-1 shadow-sm"
                          >
                            <Badge
                              className="!bg-transparent !border-0 !px-0 !py-0"
                              variant="secondary"
                              size="sm"
                            >
                              {l}
                            </Badge>
                            <button
                              className="p-0.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => removeLanguage(l)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> Portfolio
                  </h3>
                  <AddSimple
                    onAdd={addPortfolioLink}
                    placeholder="https://your-portfolio-link"
                  />
                  <ul className="mt-3 space-y-1 text-sm">
                    {(user.workerProfile?.portfolio || []).map((url, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 p-2 bg-white rounded border border-gray-200 shadow-sm"
                      >
                        <a
                          className="underline text-blue-700 truncate"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {url}
                        </a>
                        <button
                          aria-label={`Remove ${url}`}
                          className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removePortfolioLink(url)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> CV Builder
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Use our interactive CV builder to create a professional resume with all your details.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => window.open("/profile/cv-builder", "_blank")}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Open CV Builder
                    </Button>
                  </div>
                  
                  {/* Show summary of CV data if available */}
                  {user.profile?.cv?.data && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Current CV Status:</strong> Complete
                      </p>
                      <div className="text-xs text-gray-600">
                        {user.workerProfile?.education?.length > 0 && (
                          <span className="mr-4">• {user.workerProfile.education.length} Education entries</span>
                        )}
                        {user.workerProfile?.workHistory?.length > 0 && (
                          <span className="mr-4">• {user.workerProfile.workHistory.length} Work experiences</span>
                        )}
                        {user.workerProfile?.skills?.length > 0 && (
                          <span>• {user.workerProfile.skills.length} Skills</span>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Client blocks */}
            {role === "client" && (
              <>
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Company
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      label="Company Name"
                      defaultValue={user.clientProfile?.companyName || ""}
                      onBlur={(e) =>
                        saveProfile({
                          clientProfile: {
                            ...user.clientProfile,
                            companyName: e.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      label="Website"
                      defaultValue={user.clientProfile?.website || ""}
                      onBlur={(e) =>
                        saveProfile({
                          clientProfile: {
                            ...user.clientProfile,
                            website: e.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      label="Industry"
                      defaultValue={user.clientProfile?.industry || ""}
                      onBlur={(e) =>
                        saveProfile({
                          clientProfile: {
                            ...user.clientProfile,
                            industry: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </Card>
                <Card>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Preferences
                  </h3>
                  <p className="text-sm text-gray-600">
                    Update notification and language preferences in settings.
                  </p>
                </Card>
              </>
            )}

            {/* Super admin block */}
            {role === "super_admin" && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-2">Account</h3>
                <p className="text-sm text-gray-600">
                  You have full administrative privileges.
                </p>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">
                Profile Completion
              </h3>
              <ProgressBar progress={profileCompletion} />
              <p className="text-xs text-gray-500 mt-2">
                Complete your profile to increase trust and win more jobs.
              </p>
              {saving && (
                <p className="text-xs text-gray-500 mt-1">Saving...</p>
              )}
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-2">
                Date of Birth
              </h3>
              <Input
                type="date"
                defaultValue={
                  user.profile?.dob
                    ? String(user.profile?.dob).substring(0, 10)
                    : ""
                }
                onBlur={(e) => onDOBBlur(e.target.value)}
              />
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileIcon className="h-4 w-4" /> CV
              </h3>
              {(() => {
                const cv = user.profile?.cv;
                return cv ? (
                  <div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                      <FileIcon className="h-4 w-4 text-gray-700" />
                      <span className="text-sm text-gray-800 truncate">
                        {cv?.name}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(() => {
                        const url =
                          cvObjectUrl ||
                          toBlobUrl(cv?.data, cv?.mimeType) ||
                          cvPreview ||
                          ensureDataUrl(cv?.data, cv?.mimeType);
                        if (!url) return null;
                        const isPdf = (cv?.mimeType || "")
                          .toLowerCase()
                          .includes("pdf");
                        return (
                          <a
                            className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-sm"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={isPdf ? undefined : cv?.name || "cv"}
                          >
                            <Eye className="h-4 w-4 mr-2" />{" "}
                            {isPdf ? "View CV" : "Download CV"}
                          </a>
                        );
                      })()}
                      <Button
                        variant="primary"
                        onClick={() => window.open("/profile/cv-builder", "_blank")}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit CV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => cvRef.current?.click()}
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload CV
                      </Button>
                      <Button variant="danger" onClick={onDeleteCV}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete CV
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">No CV created yet.</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="primary"
                        onClick={() => window.open("/profile/cv-builder", "_blank")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Build CV
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => cvRef.current?.click()}
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload CV
                      </Button>
                    </div>
                  </div>
                );
              })()}
              <input
                ref={cvRef}
                type="file"
                accept="application/pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => e.target.files && onCVFile(e.target.files[0])}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
