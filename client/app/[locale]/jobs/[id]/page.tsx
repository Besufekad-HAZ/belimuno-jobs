"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  Clock,
  MapPin,
  User,
  Calendar,
  Star,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Share2,
  Bookmark,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { jobsAPI } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { workerAPI } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { useTranslations } from "next-intl";

type Job = {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  budgetType: string;
  currency: string;
  deadline: string;
  priority: string;
  status: string;
  experienceLevel: string;
  requiredSkills: string[];
  tags: string[];
  deliverables: string[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isArchived: boolean;
  client: {
    _id: string;
    name: string;
    profile: {
      avatar?: string;
    };
    clientProfile: {
      companyName?: string;
      rating?: number;
    };
  };
  region: {
    _id: string;
    name: string;
  };
  progress: {
    percentage: number;
    milestones: object[];
    updates: object[];
  };
  payment: {
    paymentStatus: string;
  };
  dispute: {
    isDisputed: boolean;
    status: string;
  };
  workerAcceptance: string;
};

const JobDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const user = getStoredUser();
  const t = useTranslations("JobDetailPage");

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await jobsAPI.getById(id);
        const j = res.data?.data || res.data?.job || res.data;
        console.log(j);
        setJob(j as Job);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      if (user?.role !== "worker" || !id) return;
      try {
        const res = await workerAPI.getSavedJobs();
        const list: { _id: string }[] = res.data?.data || [];
        setIsSaved(list.some((j) => String(j._id) === String(id)));
      } catch {}
    })();
  }, [id, user?.role]);

  const toggleSave = async () => {
    if (user?.role !== "worker" || !id) return;
    setSaving(true);
    try {
      if (isSaved) {
        await workerAPI.unsaveJob(String(id));
        setIsSaved(false);
      } else {
        await workerAPI.saveJob(String(id));
        setIsSaved(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const shareJob = async () => {
    if (!job) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData: ShareData = {
      title: `Belimuno Job: ${job.title}`,
      text: `${job.title} — ETB ${job.budget}.`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t("notFound.title")}
          </h2>
          <p className="text-gray-600 mb-4">{t("notFound.description")}</p>
          <Button onClick={() => router.push("/jobs")}>
            {t("notFound.backButton")}
          </Button>
        </Card>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "posted":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push("/jobs")}
                className="flex items-center"
              >
                ← {t("backToJobs")}
              </Button>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(job.status)}>
                  {job.status.replace("_", " ")}
                </Badge>
                <Badge className={getPriorityColor(job.priority)}>
                  {job.priority} priority
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {user?.role === "worker" && (
                <Button
                  variant={isSaved ? "outline" : "ghost"}
                  onClick={toggleSave}
                  loading={saving}
                  className="flex items-center"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  {isSaved ? t("saved") : t("saveJob")}
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={shareJob}
                className="flex items-center"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {t("share")}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Title and Description */}
            <Card>
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {job.title}
                </h1>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>
            </Card>

            {/* Job Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("jobDetails")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{t("category")}</p>
                      <p className="font-medium">{job.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{t("budget")}</p>
                      <p className="font-medium">
                        {job.currency} {job.budget?.toLocaleString()} (
                        {job.budgetType})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{t("deadline")}</p>
                      <p className="font-medium">
                        {new Date(job.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{t("location")}</p>
                      <p className="font-medium">{job.region?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {t("experienceLevel")}
                      </p>
                      <p className="font-medium capitalize">
                        {job.experienceLevel}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">{t("posted")}</p>
                      <p className="font-medium">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t("requiredSkills")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t("tags")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Deliverables */}
            {job.deliverables && job.deliverables.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t("deliverables")}
                  </h2>
                  <ul className="space-y-2">
                    {job.deliverables.map((deliverable, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {/* Attachments */}
            {job.attachments && job.attachments.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t("attachments")}
                  </h2>
                  <div className="space-y-2">
                    {job.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                      >
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{attachment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("clientInfo")}
                </h2>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{job.client?.name}</p>
                    {job.client?.clientProfile?.companyName && (
                      <p className="text-sm text-gray-500">
                        {job.client.clientProfile.companyName}
                      </p>
                    )}
                    {job.client?.clientProfile?.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm">
                          {job.client.clientProfile.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* <Link href={`/client/${job.client?._id}`}>
                  <Button variant="outline" className="w-full">
                    {t("viewClientProfile")}
                  </Button>
                </Link> */}
              </div>
            </Card>

            {/* Action Buttons */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("actions")}
                </h2>
                <div className="space-y-3">
                  {user?.role === "worker" && job.status === "posted" && (
                    <Link href={`/jobs/${job._id}/apply`} className="block">
                      <Button className="w-full">{t("applyNow")}</Button>
                    </Link>
                  )}
                  {user?.role === "client" && job.client?._id === user._id && (
                    <Link href={`/client/jobs/${job._id}`} className="block">
                      <Button className="w-full">{t("manageJob")}</Button>
                    </Link>
                  )}
                  {!user && (
                    <Link href="/login" className="block">
                      <Button className="w-full">{t("loginToApply")}</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>

            {/* Job Status */}
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {t("jobStatus")}
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("status")}:</span>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("priority")}:</span>
                    <Badge className={getPriorityColor(job.priority)}>
                      {job.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("public")}:</span>
                    <span
                      className={
                        job.isPublic ? "text-green-600" : "text-red-600"
                      }
                    >
                      {job.isPublic ? t("yes") : t("no")}
                    </span>
                  </div>
                  {job.progress && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("progress")}:</span>
                      <span>{job.progress.percentage}%</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
