"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  Bookmark,
  Share2,
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { jobsAPI, workerAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import BackToDashboard from "@/components/ui/BackToDashboard";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";

const JobsPage: React.FC = () => {
  type JobListItem = {
    _id: string;
    title: string;
    description: string;
    category: string;
    deadline: string | Date;
    budget: number;
    priority?: string;
    requiredSkills?: string[];
    createdAt?: string | Date;
    workType?: string;
    location?: string;
    applications?: unknown[];
  };
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [budgetRange, setBudgetRange] = useState({ min: "", max: "" });
  const [user, setUser] = useState<ReturnType<typeof getStoredUser> | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Removed unused saving state to satisfy eslint
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [jobsForYou, setJobsForYou] = useState<JobListItem[]>([]);
  const [jobsForYouLoading, setJobsForYouLoading] = useState(false);
  const t = useTranslations("JobsPage");

  // fetchJobs defined below; initial effect will reference it

  type Filters = {
    search?: string;
    category?: string;
    region?: string;
    budgetMin?: number | string;
    budgetMax?: number | string;
  };
  const fetchJobs = useCallback(async (filters: Filters = {}, pageNum = 1) => {
    try {
      setLoading(true);
      // Map frontend filters to backend params
      const params: Record<string, unknown> = {
        status: "posted",
        page: pageNum,
        limit: 10,
      };
      if (filters.search) params.q = filters.search; // for /search endpoint
      if (filters.category) params.category = filters.category;
      if (filters.region) params.region = filters.region;
      if (filters.budgetMin) params.budgetMin = filters.budgetMin;
      if (filters.budgetMax) params.budgetMax = filters.budgetMax;

      let response;
      if (filters.search) {
        response = await jobsAPI.search(filters.search, params);
      } else {
        response = await jobsAPI.getAll(params);
      }
      const payload = response.data;
      const list = (payload.data || payload.jobs || []) as unknown as Array<
        Record<string, unknown>
      >;
      setJobs(
        list.map((j) => ({
          _id: String(j._id),
          title: String(j.title || ""),
          description: String(j.description || ""),
          category: String(j.category || ""),
          deadline:
            (j.deadline as string | Date | undefined) ||
            new Date().toISOString(),
          budget: Number(j.budget || 0),
          priority: j.priority as string | undefined,
          requiredSkills: j.requiredSkills as string[] | undefined,
          createdAt: j.createdAt as string | Date | undefined,
          workType: j.workType as string | undefined,
          location: j.location as string | undefined,
          applications: j.applications as unknown[] | undefined,
        })),
      );
      setTotalPages(payload.pagination?.pages || 1);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobsForYou = useCallback(async () => {
    if (user?.role !== "worker") return;

    try {
      setJobsForYouLoading(true);
      const response = await workerAPI.getJobsForYou({ limit: 5 });
      const payload = response.data;
      const list = (payload.data || []) as unknown as Array<
        Record<string, unknown>
      >;
      setJobsForYou(
        list.map((j) => ({
          _id: String(j._id),
          title: String(j.title || ""),
          description: String(j.description || ""),
          category: String(j.category || ""),
          deadline:
            (j.deadline as string | Date | undefined) ||
            new Date().toISOString(),
          budget: Number(j.budget || 0),
          priority: j.priority as string | undefined,
          requiredSkills: j.requiredSkills as string[] | undefined,
          createdAt: j.createdAt as string | Date | undefined,
          workType: j.workType as string | undefined,
          location: j.location as string | undefined,
          applications: j.applications as unknown[] | undefined,
        })),
      );
    } catch (error) {
      console.error("Failed to fetch jobs for you:", error);
      setJobsForYou([]);
    } finally {
      setJobsForYouLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    fetchJobs();
    fetchJobsForYou();
    (async () => {
      try {
        if (currentUser?.role === "worker") {
          const res = await workerAPI.getSavedJobs();
          const arr: unknown = res.data?.data || [];
          const ids = new Set(
            (Array.isArray(arr) ? arr : []).map((j) =>
              String((j as { _id?: unknown })._id),
            ),
          );
          setSavedJobIds(ids);
        }
      } catch {}
    })();
  }, [fetchJobs, fetchJobsForYou]);

  const handleSearch = () => {
    const filters: Filters = {};
    if (searchQuery) filters.search = searchQuery;
    if (categoryFilter) filters.category = categoryFilter;
    if (regionFilter) filters.region = regionFilter;
    if (budgetRange.min) filters.budgetMin = parseFloat(budgetRange.min);
    if (budgetRange.max) filters.budgetMax = parseFloat(budgetRange.max);
    setPage(1);
    fetchJobs(filters, 1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setRegionFilter("");
    setBudgetRange({ min: "", max: "" });
    setPage(1);
    fetchJobs({}, 1);
  };

  // Categories are now defined in translations

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <BackToDashboard
            currentRole={user?.role || "worker"}
            variant="breadcrumb"
            className="mb-2"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("header.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            {t("header.subtitle")}
          </p>
        </div>

        {/* Jobs for You Section - Only show for workers with matching jobs */}
        {user?.role === "worker" && jobsForYou.length > 0 && (
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
                  {t("jobsForYou.title")}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {t("jobsForYou.subtitle")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm text-blue-600 font-medium">
                  {jobsForYou.length} {t("jobsForYou.matchingJobs")}
                </span>
              </div>
            </div>

            {jobsForYouLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {jobsForYou.slice(0, 3).map((job) => (
                  <div
                    key={job._id}
                    className="bg-white rounded-lg p-4 border border-blue-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                          <div className="flex items-center">
                            <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            {job.category}
                          </div>
                          {job.location && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              {job.location}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Due: {new Date(job.deadline).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                          {job.description}
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <div className="flex items-center text-green-600 font-bold text-lg">
                          <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                          ETB {job.budget?.toLocaleString()}
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/jobs/${job._id}`}
                            className="inline-block"
                          >
                            <Button variant="outline" size="sm">
                              <span className="text-xs sm:text-sm">
                                {t("job.actions.viewDetails")}
                              </span>
                            </Button>
                          </Link>
                          <Link
                            href={`/jobs/${job._id}/apply`}
                            className="inline-block"
                          >
                            <Button size="sm">
                              <span className="text-xs sm:text-sm">
                                {t("job.actions.applyNow")}
                              </span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {jobsForYou.length > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Scroll to main jobs section
                        document
                          .querySelector(".jobs-main-section")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {t("jobsForYou.viewAll")} ({jobsForYou.length - 3}{" "}
                      {t("jobsForYou.more")})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Search, Filters and Jobs List */}
        <Card className="mb-6 sm:mb-8">
          <div className="p-6">
            {/* Section Title */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {t("searchAndJobs.title")}
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {t("searchAndJobs.subtitle")}
              </p>
            </div>

            <div className="space-y-6">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <Input
                    placeholder={t("search.placeholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearch} className="w-full sm:w-auto">
                  <Search className="h-4 w-4 mr-2" />
                  {t("search.button")}
                </Button>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("search.filters.category.label")}
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">
                      {t("search.filters.category.placeholder")}
                    </option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={t(`categories.${num}`)}>
                        {t(`categories.${num}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label={t("search.filters.region.label")}
                  placeholder={t("search.filters.region.placeholder")}
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                />

                <Input
                  label={t("search.filters.budget.min.label")}
                  type="number"
                  placeholder={t("search.filters.budget.min.placeholder")}
                  value={budgetRange.min}
                  onChange={(e) =>
                    setBudgetRange({ ...budgetRange, min: e.target.value })
                  }
                />

                <Input
                  label={t("search.filters.budget.max.label")}
                  type="number"
                  placeholder={t("search.filters.budget.max.placeholder")}
                  value={budgetRange.max}
                  onChange={(e) =>
                    setBudgetRange({ ...budgetRange, max: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Button
                    variant="outline"
                    onClick={handleSearch}
                    className="w-full sm:w-auto"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {t("search.filters.apply")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full sm:w-auto"
                  >
                    {t("search.filters.clear")}
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
                  {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
                </p>
              </div>

              {/* Jobs List */}
              <div className="jobs-main-section">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
                  </div>
                ) : jobs.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {jobs.map((job) => (
                      <Card
                        key={job._id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                                  {job.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3">
                                  <div className="flex items-center">
                                    <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    {job.category}
                                  </div>
                                  {job.location && (
                                    <div className="flex items-center">
                                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                      {job.location}
                                    </div>
                                  )}
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                    Due:{" "}
                                    {new Date(
                                      job.deadline,
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-left sm:text-right">
                                <div className="flex items-center text-green-600 font-bold text-lg sm:text-xl mb-2">
                                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                                  ETB {job.budget?.toLocaleString()}
                                </div>
                                <span
                                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full ${
                                    job.priority === "urgent"
                                      ? "bg-red-100 text-red-800"
                                      : job.priority === "high"
                                        ? "bg-orange-100 text-orange-800"
                                        : job.priority === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {job.priority} priority
                                </span>
                              </div>
                            </div>

                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {job.description}
                            </p>

                            {/* Skills */}
                            {job.requiredSkills &&
                              job.requiredSkills.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    {t("job.requiredSkills")}
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {job.requiredSkills
                                      .slice(0, 5)
                                      .map((skill: string, index: number) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    {job.requiredSkills.length > 5 && (
                                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        +{job.requiredSkills.length - 5}{" "}
                                        {t("job.moreSkills")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>
                                  {t("job.posted")}{" "}
                                  {job.createdAt
                                    ? new Date(
                                        job.createdAt as string | number | Date,
                                      ).toLocaleDateString()
                                    : "—"}
                                </span>
                                <span>•</span>
                                <span>
                                  {job.applications?.length || 0}{" "}
                                  {t("job.applications")}
                                </span>
                                <span>•</span>
                                <span className="capitalize">
                                  {job.workType}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                                <Link
                                  href={`/jobs/${job._id}`}
                                  className="inline-block w-full sm:w-auto"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                  >
                                    <span className="text-xs sm:text-sm">
                                      {t("job.actions.viewDetails")}
                                    </span>
                                  </Button>
                                </Link>
                                {user && user.role === "worker" && (
                                  <Link
                                    href={`/jobs/${job._id}/apply`}
                                    className="inline-block w-full sm:w-auto"
                                  >
                                    <Button
                                      size="sm"
                                      className="w-full sm:w-auto"
                                    >
                                      <span className="text-xs sm:text-sm">
                                        {t("job.actions.applyNow")}
                                      </span>
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant={
                                    savedJobIds.has(job._id)
                                      ? "outline"
                                      : "ghost"
                                  }
                                  size="sm"
                                  className="w-full sm:w-auto"
                                  onClick={async () => {
                                    if (user?.role !== "worker") return;
                                    // Optimistically update saved jobs set
                                    try {
                                      if (savedJobIds.has(job._id)) {
                                        await workerAPI.unsaveJob(job._id);
                                        const copy = new Set(savedJobIds);
                                        copy.delete(job._id);
                                        setSavedJobIds(copy);
                                      } else {
                                        await workerAPI.saveJob(job._id);
                                        const copy = new Set(savedJobIds);
                                        copy.add(job._id);
                                        setSavedJobIds(copy);
                                      }
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                >
                                  <Bookmark className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />{" "}
                                  <span className="text-xs sm:text-sm">
                                    {savedJobIds.has(job._id)
                                      ? t("job.actions.saved")
                                      : t("job.actions.save")}
                                  </span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    const url = `${window.location.origin}/jobs/${job._id}`;
                                    try {
                                      const shareData: ShareData = {
                                        title: `Belimuno Job: ${job.title}`,
                                        url,
                                      };
                                      if (
                                        "share" in navigator &&
                                        typeof navigator.share === "function"
                                      ) {
                                        await navigator.share(shareData);
                                      } else if (navigator.clipboard) {
                                        await navigator.clipboard.writeText(
                                          url,
                                        );
                                        toast.success(
                                          "Link copied to clipboard",
                                        );
                                      }
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                >
                                  <Share2 className="h-4 w-4 mr-1" />{" "}
                                  {t("job.actions.share")}
                                </Button>
                                {!user && (
                                  <Link href="/login" className="inline-block">
                                    <Button size="sm">
                                      {t("job.actions.loginToApply")}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t("noResults.title")}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t("noResults.description")}
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      {t("noResults.button")}
                    </Button>
                  </Card>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8 space-x-2">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => {
                        const newPage = page - 1;
                        setPage(newPage);
                        fetchJobs(
                          {
                            search: searchQuery || undefined,
                            category: categoryFilter || undefined,
                            region: regionFilter || undefined,
                            budgetMin: budgetRange.min || undefined,
                            budgetMax: budgetRange.max || undefined,
                          },
                          newPage,
                        );
                      }}
                    >
                      {t("pagination.previous")}
                    </Button>
                    <span className="px-4 py-2 text-gray-700">
                      {t("pagination.page")} {page} {t("pagination.of")}{" "}
                      {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page === totalPages}
                      onClick={() => {
                        const newPage = page + 1;
                        setPage(newPage);
                        fetchJobs(
                          {
                            search: searchQuery || undefined,
                            category: categoryFilter || undefined,
                            region: regionFilter || undefined,
                            budgetMin: budgetRange.min || undefined,
                            budgetMax: budgetRange.max || undefined,
                          },
                          newPage,
                        );
                      }}
                    >
                      {t("pagination.next")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default JobsPage;
