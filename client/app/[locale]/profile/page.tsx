"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User as BaseUser } from "@/lib/auth";
import { getStoredUser } from "@/lib/auth";
import { authAPI, workerAPI } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import BackToDashboard from "@/components/ui/BackToDashboard";
import EnhancedCVBuilder from "@/components/ui/EnhancedCVBuilder";
import jsPDF from "jspdf";
import { toast } from "@/components/ui/sonner";
import {
  Camera,
  User2,
  FileText,
  FileUp,
  FileIcon,
  Trash2,
  Eye,
} from "lucide-react";
import Cookies from "js-cookie";

// Types
type Role = BaseUser["role"];

type Availability = "full-time" | "part-time" | "freelance";

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
    education?: Array<{
      _id?: string;
      school: string;
      degree: string;
      field: string;
      startDate: string;
      endDate?: string;
      description?: string;
    }>;
    workHistory?: Array<{
      _id?: string;
      company: string;
      title: string;
      startDate: string;
      endDate?: string;
      description: string;
    }>;
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

const ProfilePage = () => {
  const router = useRouter();
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
  const [initialCVData, setInitialCVData] = useState<{
    personalInfo: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      summary: string;
      workerSkills: string[];
      workerExperience: string;
      workerHourlyRate: number;
      portfolio: string;
      dateOfBirth: string;
      gender: string;
    };
    education: Array<{
      id: string;
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: string;
      endDate: string;
      current: boolean;
    }>;
    experience: Array<{
      id: string;
      company: string;
      position: string;
      startDate: string;
      endDate: string;
      current: boolean;
      description: string;
    }>;
    detailedSkills: Array<{
      id: string;
      name: string;
      level: string;
    }>;
  } | null>(null);
  const [cvBuilderLoading, setCvBuilderLoading] = useState(true);
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
        console.log(serverUser);
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

  // CV Builder functions
  const loadExistingCV = useCallback(async () => {
    try {
      setCvBuilderLoading(true);
      const response = await authAPI.getMe();
      const userData = response.data.user as ExtendedUser;
      if (!userData) return;
      const profile = userData.profile || {};
      const workerProfile = userData.workerProfile || {};

      setInitialCVData({
        personalInfo: {
          fullName: userData.name || "",
          email: userData.email || "",
          phone: profile.phone || "",
          address: (
            profile as { address?: { city?: string; country?: string } }
          ).address?.city
            ? `${(profile as { address?: { city?: string; country?: string } }).address?.city}, ${(profile as { address?: { city?: string; country?: string } }).address?.country || "Ethiopia"}`
            : "",
          summary: profile.bio || "",
          workerSkills: profile.skills || [],
          workerExperience: String(profile.experience || ""),
          workerHourlyRate: profile.hourlyRate || 0,
          portfolio: userData.workerProfile?.portfolio?.[0] || "",
          dateOfBirth: profile.dob ? String(profile.dob).substring(0, 10) : "",
          gender: (profile as { gender?: string }).gender || "",
        },
        education: (workerProfile?.education || []).map(
          (edu: {
            _id?: string;
            school: string;
            degree: string;
            field: string;
            startDate: string;
            endDate?: string;
            description?: string;
          }) => ({
            id: edu._id || Date.now().toString(),
            institution: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.field,
            startDate: edu.startDate,
            endDate: edu.endDate || "",
            current: false,
          }),
        ),
        experience: (workerProfile?.workHistory || []).map(
          (exp: {
            _id?: string;
            company: string;
            title: string;
            startDate: string;
            endDate?: string;
            description: string;
          }) => ({
            id: exp._id || Date.now().toString(),
            company: exp.company,
            position: exp.title,
            startDate: exp.startDate,
            endDate: exp.endDate || "",
            current: false,
            description: exp.description,
          }),
        ),
        detailedSkills: (
          (
            profile as {
              detailedSkills?: Array<{
                _id?: string;
                name: string;
                level: string;
              }>;
            }
          ).detailedSkills || []
        )
          .map((skill: { _id?: string; name: string; level: string }) => ({
            id: skill._id || Date.now().toString(),
            name: skill.name,
            level: (skill.level || "Beginner") as
              | "Beginner"
              | "Intermediate"
              | "Advanced"
              | "Expert",
          }))
          .concat(
            // Also add any skills from the skills array that aren't in detailedSkills
            (profile.skills || [])
              .filter(
                (skillName) =>
                  !((profile as any).detailedSkills || []).some(
                    (ds: { name: string }) => ds.name === skillName,
                  ),
              )
              .map((skillName) => ({
                id: Date.now().toString() + Math.random(),
                name: skillName,
                level: "Beginner" as const,
              })),
          ),
      });
    } catch (error) {
      console.error("Failed to load existing CV:", error);
    } finally {
      setCvBuilderLoading(false);
    }
  }, []);

  // Load CV data on component mount
  useEffect(() => {
    if (user?.role === "worker") {
      loadExistingCV();
    }
  }, [user?.role, loadExistingCV]);

  if (!user) {
    return <div className="p-8 text-center">You are not logged in.</div>;
  }

  const role: Role = user.role;

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

  const onCVFile = async (file: File) => {
    // Check file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      toast.error("File size must be less than 2MB");
      return;
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, DOCX, or JPG file");
      return;
    }

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
      await saveProfile({ profile: { cv } });

      // Refresh user data to show the uploaded CV immediately
      try {
        const response = await authAPI.getMe();
        if (response.data.user) {
          setUser(response.data.user as ExtendedUser);
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }

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
    await saveProfile({ profile: { cv: null } });

    // Refresh user data to show the CV deletion immediately
    try {
      const response = await authAPI.getMe();
      if (response.data.user) {
        setUser(response.data.user as ExtendedUser);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }

    if (cvRef.current) cvRef.current.value = "";
  };

  const handleSaveCV = async (cvData: {
    personalInfo: {
      phone: string;
      address: string;
      summary: string;
      workerSkills: string[];
      workerExperience: string;
      workerHourlyRate: number;
      dateOfBirth: string;
      gender: string;
      fullName: string;
      portfolio: string;
    };
    education: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: string;
      endDate?: string | null;
      current: boolean;
    }>;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string | null;
      current: boolean;
      description: string;
    }>;
    detailedSkills?: Array<{
      name: string;
      level?: string;
    }>;
  }) => {
    try {
      setSaving(true);

      const profileUpdate: Record<string, unknown> = {
        phone: cvData.personalInfo.phone,
        address: {
          city: cvData.personalInfo.address.split(",")[0]?.trim() || "",
          country:
            cvData.personalInfo.address.split(",")[1]?.trim() || "Ethiopia",
        },
        bio: cvData.personalInfo.summary,
        // Combine both skill arrays - detailed skills and any existing worker skills
        skills: [
          ...new Set([
            ...(cvData.personalInfo.workerSkills || []),
            ...(cvData.detailedSkills?.map((skill) => skill.name) || []).filter(
              Boolean,
            ),
          ]),
        ],
        // Store detailed skills separately to preserve proficiency levels
        detailedSkills:
          cvData.detailedSkills?.map((skill) => ({
            name: skill.name,
            level: skill.level || "Beginner",
          })) || [],
        experience: cvData.personalInfo.workerExperience,
        hourlyRate: cvData.personalInfo.workerHourlyRate,
        dob: cvData.personalInfo.dateOfBirth,
        gender: cvData.personalInfo.gender,
        cv: {
          data: JSON.stringify(cvData),
          mimeType: "application/json",
          name: `${cvData.personalInfo.fullName.replace(/\s+/g, "_")}_CV.json`,
        },
      };

      const workerProfileUpdate: Record<string, unknown> = {
        education: cvData.education.map((edu) => ({
          school: edu.institution,
          degree: edu.degree,
          field: edu.fieldOfStudy,
          startDate: edu.startDate,
          endDate: edu.current ? null : edu.endDate,
          description: "",
        })),
        workHistory: cvData.experience.map((exp) => ({
          company: exp.company,
          title: exp.position,
          startDate: exp.startDate,
          endDate: exp.current ? null : exp.endDate,
          description: exp.description,
        })),
        portfolio: cvData.personalInfo.portfolio
          ? [cvData.personalInfo.portfolio]
          : [],
      };

      await workerAPI.updateProfile({
        profile: profileUpdate,
        workerProfile: workerProfileUpdate,
      });

      // Refresh user data
      const response = await authAPI.getMe();
      setUser(response.data.user as ExtendedUser);
      Cookies.set("user", JSON.stringify(response.data.user), { expires: 7 });

      console.log("CV saved successfully!");

      // Redirect to jobs page after successful save
      router.push("/jobs");
    } catch (error) {
      console.error("Failed to save CV:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = (cvData: {
    personalInfo: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      summary: string;
      workerSkills: string[];
      workerExperience: string;
      workerHourlyRate: number;
      portfolio: string;
      dateOfBirth: string;
      gender: string;
    };
    education: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: string;
      endDate?: string | null;
      current: boolean;
    }>;
    experience: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string | null;
      current: boolean;
      description: string;
    }>;
    detailedSkills: Array<{
      name: string;
      level?: string;
    }>;
  }) => {
    const doc = new jsPDF();
    const margin = 20;
    let yPosition = margin;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(cvData.personalInfo.fullName, margin, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(cvData.personalInfo.email, margin, yPosition);
    yPosition += 6;
    if (cvData.personalInfo.phone) {
      doc.text(cvData.personalInfo.phone, margin, yPosition);
      yPosition += 6;
    }
    if (cvData.personalInfo.address) {
      doc.text(cvData.personalInfo.address, margin, yPosition);
      yPosition += 6;
    }
    if (cvData.personalInfo.gender) {
      doc.text(`Gender: ${cvData.personalInfo.gender}`, margin, yPosition);
      yPosition += 6;
    }
    if (cvData.personalInfo.dateOfBirth) {
      doc.text(
        `Date of Birth: ${cvData.personalInfo.dateOfBirth}`,
        margin,
        yPosition,
      );
      yPosition += 10;
    }

    // Worker Details
    if (
      cvData.personalInfo.workerExperience ||
      cvData.personalInfo.workerHourlyRate
    ) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("WORKER DETAILS", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (cvData.personalInfo.workerExperience) {
        doc.text(
          `Experience: ${cvData.personalInfo.workerExperience}`,
          margin,
          yPosition,
        );
        yPosition += 5;
      }
      if (cvData.personalInfo.workerHourlyRate) {
        doc.text(
          `Hourly Rate: ETB ${cvData.personalInfo.workerHourlyRate}`,
          margin,
          yPosition,
        );
        yPosition += 10;
      }
    }

    // Key Skills
    if (
      cvData.personalInfo.workerSkills &&
      cvData.personalInfo.workerSkills.length > 0
    ) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("KEY SKILLS", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const skillsText = cvData.personalInfo.workerSkills.join(", ");
      const splitSkills = doc.splitTextToSize(skillsText, 170);
      doc.text(splitSkills, margin, yPosition);
      yPosition += splitSkills.length * 5 + 5;
    }

    // Summary
    if (cvData.personalInfo.summary) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryLines = doc.splitTextToSize(
        cvData.personalInfo.summary,
        170,
      );
      doc.text(summaryLines, margin, yPosition);
      yPosition += summaryLines.length * 5 + 5;
    }

    // Education
    if (cvData.education && cvData.education.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("EDUCATION", margin, yPosition);
      yPosition += 8;

      cvData.education.forEach((edu) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${edu.degree} - ${edu.institution}`, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        if (edu.fieldOfStudy) {
          doc.text(`Field: ${edu.fieldOfStudy}`, margin, yPosition);
          yPosition += 5;
        }
        doc.text(
          `${edu.startDate} - ${edu.endDate || "Present"}`,
          margin,
          yPosition,
        );
        yPosition += 8;
      });
    }

    // Experience
    if (cvData.experience && cvData.experience.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("EXPERIENCE", margin, yPosition);
      yPosition += 8;

      cvData.experience.forEach((exp) => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${exp.position} - ${exp.company}`, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${exp.startDate} - ${exp.endDate || "Present"}`,
          margin,
          yPosition,
        );
        yPosition += 5;

        if (exp.description) {
          const descLines = doc.splitTextToSize(exp.description, 170);
          doc.text(descLines, margin, yPosition);
          yPosition += descLines.length * 5;
        }
        yPosition += 5;
      });
    }

    // Skills
    if (cvData.detailedSkills && cvData.detailedSkills.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DETAILED SKILLS", margin, yPosition);
      yPosition += 8;

      cvData.detailedSkills.forEach((skill) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`• ${skill.name} (${skill.level})`, margin, yPosition);
        yPosition += 5;
      });
    }

    doc.save(`${cvData.personalInfo.fullName.replace(/\s+/g, "_")}_CV.pdf`);
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
            {/* Worker blocks */}
            {role === "worker" && (
              <>
                {/* Integrated CV Builder */}
                <Card className="p-0">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" /> CV Builder
                        </h3>
                        <p className="text-sm text-gray-600">
                          Create and manage your professional CV directly here.
                          All changes are automatically saved.
                        </p>
                      </div>
                    </div>
                  </div>

                  {cvBuilderLoading ? (
                    <div className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white">
                      <EnhancedCVBuilder
                        onSave={handleSaveCV}
                        onDownload={handleDownloadPDF}
                        initialData={
                          (initialCVData as Record<string, unknown>) ||
                          undefined
                        }
                        saving={saving}
                      />
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
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileIcon className="h-4 w-4" /> CV Upload
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload your CV file (PDF, DOC, DOCX, or JPG). Maximum file size:
                2MB. This is for recruiters and admins who need additional
                information.
              </p>
              {(() => {
                const cv = user.profile?.cv;
                // Only show uploaded files, not JSON CV data
                const isUploadedFile =
                  cv &&
                  cv.mimeType &&
                  !cv.mimeType.includes("application/json");

                return isUploadedFile ? (
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
                        variant="outline"
                        onClick={() => cvRef.current?.click()}
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Upload New CV
                      </Button>
                      <Button variant="danger" onClick={onDeleteCV}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete CV
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">No CV file uploaded yet.</p>
                    <div className="flex gap-2">
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
                accept="application/pdf,.doc,.docx,image/jpeg,image/jpg"
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
