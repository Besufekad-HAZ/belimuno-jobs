"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle,
  Newspaper,
  Calendar,
  ExternalLink,
  UserPlus,
  Search,
  Handshake,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";
import { jobsAPI, workerAPI, publicAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Hero from "@/components/sections/Hero";
import Badge from "@/components/ui/Badge";
import { useTranslations } from "next-intl";
import TrustedBySection from "@/components/sections/TrustedBySection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import RegionsSection from "@/components/sections/RegionsSection";
import { DEFAULT_UPLOADS_BASE, resolveAssetUrl } from "@/lib/assets";

type StoredUser = { role: string } | null;

type Stats = {
  totalUsers?: number;
  totalJobs?: number;
  completedJobs?: number;
} | null;

type FeaturedJob = {
  _id: string;
  title: string;
  description: string;
  category: string;
  deadline?: string;
  budget?: number;
};

type JobsForYouJob = {
  _id: string;
  title: string;
  description: string;
  category: string;
  deadline?: string | Date;
  budget?: number;
  priority?: string;
  requiredSkills?: string[];
  createdAt?: string | Date;
  workType?: string;
  location?: string;
  applications?: unknown[];
};

type Category = {
  _id: string;
  count: number;
};

type NewsArticle = {
  _id: string;
  id?: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  category: string;
  image?: string;
  imageUrl?: string;
  readTime?: string;
  author?: string;
  status?: string;
};

type ResolvedNewsImageProps = {
  news: NewsArticle;
  className?: string;
  sizes?: string;
  fallback: React.ReactNode;
};

const ResolvedNewsImage: React.FC<ResolvedNewsImageProps> = ({
  news,
  className,
  sizes = "33vw",
  fallback,
}) => {
  const [src, setSrc] = useState<string | undefined>(() =>
    resolveAssetUrl(news.imageUrl || news.image, DEFAULT_UPLOADS_BASE),
  );

  useEffect(() => {
    setSrc(resolveAssetUrl(news.imageUrl || news.image, DEFAULT_UPLOADS_BASE));
  }, [news.imageUrl, news.image]);

  if (!src) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={news.title}
      fill
      sizes={sizes}
      className={className}
      onError={() => setSrc(undefined)}
    />
  );
};

const categoryIcons: Record<string, React.ElementType> = {
  Technology: Briefcase,
  Design: Sparkles,
  Marketing: TrendingUp,
  default: Briefcase,
};

export default function Home() {
  const [user, setUser] = useState<StoredUser>(null);
  const [stats, setStats] = useState<Stats>(null);
  const [featuredJobs, setFeaturedJobs] = useState<FeaturedJob[]>([]);
  const [jobsForYou, setJobsForYou] = useState<JobsForYouJob[]>([]);
  const [jobsForYouLoading, setJobsForYouLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);

  const router = useRouter();
  const t = useTranslations("Home");

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);

    let isMounted = true;

    const loadNews = async () => {
      try {
        const response = await publicAPI.getNews({
          status: "published",
          limit: 3,
          sort: "-date",
        });
        if (!isMounted) return;
        const articles = response.data.data || [];
        setNewsArticles(
          articles.map((article: NewsArticle) => ({
            ...article,
            id: article._id,
            imageUrl: article.image || article.imageUrl,
          })),
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch news:", error);
        setNewsArticles([]);
      }
    };

    fetchPublicData();
    loadNews();

    if (currentUser?.role === "worker") {
      fetchJobsForYou();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPublicData = async () => {
    try {
      const [statsResponse, jobsResponse] = await Promise.allSettled([
        jobsAPI.getStats(),
        jobsAPI.getAll({ limit: 6, status: "posted" }),
      ]);

      if (statsResponse.status === "fulfilled") {
        setStats(statsResponse.value.data);
        setCategories(statsResponse.value.data?.data?.jobsByCategory || []);
      }
      if (jobsResponse.status === "fulfilled") {
        setFeaturedJobs(jobsResponse.value.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch public data:", error);
    }
  };

  const fetchJobsForYou = async () => {
    try {
      setJobsForYouLoading(true);
      const response = await workerAPI.getJobsForYou({ limit: 6 });
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
  };

  return (
    <div className="min-h-screen">
      <Hero />

      <TrustedBySection />

      {/* Stats Section */}
      {stats && (
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                {t("stats.title")}
              </h2>
              <p className="text-sky-200 mt-4 text-lg">
                {t("stats.subtitle")}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  icon: Users,
                  value: stats.totalUsers?.toLocaleString() || "1,000+",
                  label: t("stats.activeUsers"),
                  color: "from-sky-400 to-cyan-300",
                },
                {
                  icon: Briefcase,
                  value: stats.totalJobs?.toLocaleString() || "500+",
                  label: t("stats.jobsPosted"),
                  color: "from-emerald-400 to-green-300",
                },
                {
                  icon: CheckCircle,
                  value: stats.completedJobs?.toLocaleString() || "300+",
                  label: t("stats.jobsCompleted"),
                  color: "from-amber-400 to-yellow-300",
                },
                {
                  icon: TrendingUp,
                  value: "95%",
                  label: t("stats.successRate"),
                  color: "from-violet-400 to-purple-300",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-sm transition-all duration-500 hover:bg-white/10 hover:-translate-y-1"
                >
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg mb-4`}
                  >
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sky-200 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Jobs */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 mb-4">
                <Briefcase className="h-4 w-4" />
                {t("featuredJobs.title")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {t("featuredJobs.title")}
              </h2>
              <p className="text-slate-600 mt-3 text-lg max-w-xl">
                {t("featuredJobs.subtitle")}
              </p>
            </div>
            <button
              onClick={() => router.push("/jobs")}
              className="group inline-flex items-center gap-2 text-sky-600 font-semibold hover:text-sky-700 transition-colors shrink-0"
            >
              {t("featuredJobs.viewAllJobs")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <div
                key={job._id}
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200"
              >
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="flex items-start justify-between mb-4">
                  <Badge
                    variant="primary"
                    size="sm"
                    className="bg-sky-50 text-sky-700 border-sky-100"
                  >
                    {job.category}
                  </Badge>
                  <span className="text-lg font-bold text-emerald-600">
                    ETB {job.budget?.toLocaleString()}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-sky-700 transition-colors">
                  {job.title}
                </h3>
                <p className="text-slate-500 text-sm mb-5 line-clamp-3 leading-relaxed">
                  {job.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {job.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      Due: {new Date(job.deadline).toLocaleDateString()}
                    </div>
                  )}
                  <Link href={user ? `/jobs/${job._id}` : "/login"}>
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100 hover:text-sky-800">
                      {user ? "Apply Now" : "Login to Apply"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Job Categories */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 mb-4">
              <Sparkles className="h-4 w-4" />
              Browse Categories
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {t("categories.title")}
            </h2>
            <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
              {t("categories.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.length === 0
              ? Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                        <div>
                          <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
                          <div className="h-3 w-16 bg-slate-50 rounded" />
                        </div>
                      </div>
                      <div className="h-7 w-10 bg-sky-50 rounded-lg" />
                    </div>
                  </div>
                ))
              : categories.map((cat, idx) => {
                  const IconComp =
                    categoryIcons[cat._id] || categoryIcons.default;
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        router.push(
                          `/jobs?category=${encodeURIComponent(cat._id)}`,
                        )
                      }
                      className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-sky-200"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 transition-all group-hover:from-sky-100 group-hover:to-blue-100 group-hover:shadow-md">
                            <IconComp className="h-6 w-6 text-sky-600 transition-colors group-hover:text-sky-700" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                              {cat._id}
                            </h3>
                            <p className="text-sm text-slate-500">
                              {cat.count || 0} open positions
                            </p>
                          </div>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-600 transition-all group-hover:bg-sky-600 group-hover:text-white">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => router.push("/jobs")}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-sky-200 bg-white px-8 py-3 font-semibold text-sky-700 transition-all duration-300 hover:bg-sky-50 hover:border-sky-300 hover:shadow-md"
            >
              {t("categories.viewAllCategories")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Jobs for You Section - Only show for workers */}
      {user?.role === "worker" && (
        <>
          {jobsForYouLoading ? (
            <section className="py-20 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 mb-4">
                    <Sparkles className="h-4 w-4" />
                    Personalized
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                    Jobs for You
                  </h2>
                  <p className="text-slate-600 mt-4 text-lg">
                    Personalized job recommendations based on your skills
                  </p>
                </div>
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
                </div>
              </div>
            </section>
          ) : jobsForYou.length > 0 ? (
            <section className="py-20 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 mb-4">
                    <Sparkles className="h-4 w-4" />
                    Personalized
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                    Jobs for You
                  </h2>
                  <p className="text-slate-600 mt-4 text-lg">
                    Personalized job recommendations based on your skills
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {jobsForYou.map((job) => (
                    <div
                      key={job._id}
                      className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200"
                    >
                      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="flex items-start justify-between mb-4">
                        <Badge
                          variant="primary"
                          size="sm"
                          className="bg-sky-50 text-sky-700 border-sky-100"
                        >
                          {job.category}
                        </Badge>
                        <span className="text-lg font-bold text-emerald-600">
                          ETB {job.budget?.toLocaleString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-lg mb-2 line-clamp-2 group-hover:text-sky-700 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-slate-500 text-sm mb-5 line-clamp-3 leading-relaxed">
                        {job.description}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        {job.deadline && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            Due:{" "}
                            {new Date(job.deadline).toLocaleDateString()}
                          </div>
                        )}
                        <Link href={`/jobs/${job._id}`}>
                          <button className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition-all hover:bg-sky-100">
                            View Details
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </>
      )}

      <RegionsSection />

      {/* How It Works */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #0ea5e9 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              {t("howItWorks.title")}
            </h2>
            <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
              {t("howItWorks.subtitle")}
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-300" />
            {[
              {
                icon: UserPlus,
                step: "01",
                title: t("howItWorks.step1.title"),
                desc: t("howItWorks.step1.description"),
                gradient: "from-sky-400 to-cyan-400",
                shadow: "shadow-sky-400/20",
              },
              {
                icon: Search,
                step: "02",
                title: t("howItWorks.step2.title"),
                desc: t("howItWorks.step2.description"),
                gradient: "from-blue-500 to-indigo-500",
                shadow: "shadow-blue-500/20",
              },
              {
                icon: Handshake,
                step: "03",
                title: t("howItWorks.step3.title"),
                desc: t("howItWorks.step3.description"),
                gradient: "from-indigo-500 to-violet-500",
                shadow: "shadow-indigo-500/20",
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="relative z-10 mx-auto mb-6">
                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} shadow-xl ${item.shadow} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                  >
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow-md border border-slate-100">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* News Section */}
      {newsArticles.length > 0 && (
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-700 mb-4">
                <Newspaper className="h-4 w-4" />
                Latest Updates
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {t("news.title")}
              </h2>
              <p className="text-slate-600 mt-3 text-lg">
                {t("news.subtitle")}
              </p>
            </div>
            <button
              onClick={() => router.push("/news")}
              className="group inline-flex items-center gap-2 text-sky-600 font-semibold hover:text-sky-700 transition-colors shrink-0"
            >
              {t("news.viewAllNews")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsArticles.slice(0, 3).map((news) => (
              <article
                key={news.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-sky-200"
              >
                <div className="relative h-52 overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50">
                  <ResolvedNewsImage
                    news={news}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    fallback={
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100">
                        <Newspaper className="h-14 w-14 text-sky-300" />
                      </div>
                    }
                  />
                  <div className="absolute top-4 left-4 z-10">
                    <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm backdrop-blur-sm">
                      {news.category}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center text-sm text-slate-400 mb-3">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {new Date(news.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-sky-700 transition-colors">
                    {news.title}
                  </h3>

                  <p className="text-slate-500 text-sm mb-5 line-clamp-3 leading-relaxed flex-1">
                    {news.excerpt}
                  </p>

                  <button
                    onClick={() => router.push(`/news/${news.id}`)}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700"
                  >
                    {t("news.readMore")}
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800" />
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-sky-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                if (user?.role === "client") {
                  router.push("/client/jobs/new");
                } else {
                  router.push("/login");
                }
              }}
              className="group inline-flex items-center justify-center gap-3 rounded-xl bg-white px-8 py-4 text-base font-semibold text-sky-700 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:bg-sky-50"
            >
              {t("cta.findWorkers")}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => router.push("/jobs")}
              className="inline-flex items-center justify-center gap-3 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 hover:border-white/50"
            >
              <Briefcase className="h-5 w-5" />
              {t("cta.findWork")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
