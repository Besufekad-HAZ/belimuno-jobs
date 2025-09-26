"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle,
  Newspaper,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { getStoredUser, getRoleDashboardPath } from "@/lib/auth";
import { jobsAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useTranslations } from "next-intl";
import { newsData } from "@/data/news";
import TestimonialsSection from "@/components/sections/TestimonialsSection";

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

export default function Home() {
  const [user, setUser] = useState<StoredUser>(null);
  const [stats, setStats] = useState<Stats>(null);
  const [featuredJobs, setFeaturedJobs] = useState<FeaturedJob[]>([]);

  const router = useRouter();
  const t = useTranslations("Home");

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);

    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      const [statsResponse, jobsResponse] = await Promise.all([
        jobsAPI.getStats(),
        jobsAPI.getAll({ limit: 6, status: "posted" }),
      ]);

      setStats(statsResponse.data);
      setFeaturedJobs(jobsResponse.data.data || []);
    } catch (error) {
      console.error("Failed to fetch public data:", error);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      router.push(getRoleDashboardPath(user.role));
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse-glow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse-glow delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse-glow delay-500"></div>
        </div>

        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 animate-float delay-300">
            <Briefcase className="h-8 w-8 text-blue-400/30" />
          </div>
          <div className="absolute top-32 right-20 animate-float delay-700">
            <Users className="h-6 w-6 text-cyan-400/30" />
          </div>
          <div className="absolute bottom-32 left-20 animate-float delay-1000">
            <TrendingUp className="h-7 w-7 text-orange-400/30" />
          </div>
          <div className="absolute bottom-20 right-10 animate-float delay-500">
            <CheckCircle className="h-6 w-6 text-green-400/30" />
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="text-center">
            {/* Main Heading with Enhanced Animation */}
            <div className="mb-8">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
                <span className="block text-gray-900 animate-fade-in-up">
                  {t("hero.title.part1")}
                </span>
                <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-700 bg-clip-text text-transparent animate-fade-in-up delay-300">
                  {t("hero.title.part2")}
                </span>
              </h1>

              {/* Decorative Line */}
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full animate-fade-in-up delay-500"></div>
            </div>

            {/* Description with Animation */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up delay-700">
              {t("hero.description")}
            </p>

            {/* CTA Buttons with Enhanced Animation */}
            <div className="flex flex-col sm:flex-row sm:flex-nowrap gap-6 justify-center items-center animate-fade-in-up delay-1000">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="group bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-2xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 px-8 py-3 text-lg font-semibold"
              >
                <span className="inline-flex items-center">
                  <span className="mr-3">
                    {user ? t("hero.goToDashboard") : t("hero.register")}
                  </span>
                  <span className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white shadow-sm transition-all duration-300 group-hover:bg-white/30 group-hover:scale-110">
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </span>
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/jobs")}
                className="group border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
              >
                <span className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  {t("hero.browseJobs")}
                </span>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 animate-fade-in-up delay-1200">
              <p className="text-sm text-gray-500 mb-6 font-medium">
                Trusted by thousands of professionals
              </p>
              <div className="flex justify-center items-center space-x-8 opacity-60">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">
                    Verified Companies
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {stats && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">
                {t("stats.title")}
              </h2>
              <p className="text-gray-600 mt-4">{t("stats.subtitle")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Card className="text-center bg-blue-50 border-blue-200">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-blue-900">
                  {stats.totalUsers?.toLocaleString() || "1,000+"}
                </div>
                <div className="text-blue-600 font-medium">
                  {t("stats.activeUsers")}
                </div>
              </Card>
              <Card className="text-center bg-green-50 border-green-200">
                <Briefcase className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-green-900">
                  {stats.totalJobs?.toLocaleString() || "500+"}
                </div>
                <div className="text-green-600 font-medium">
                  {t("stats.jobsPosted")}
                </div>
              </Card>
              <Card className="text-center bg-yellow-50 border-yellow-200">
                <CheckCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-yellow-900">
                  {stats.completedJobs?.toLocaleString() || "300+"}
                </div>
                <div className="text-yellow-600 font-medium">
                  {t("stats.jobsCompleted")}
                </div>
              </Card>
              <Card className="text-center bg-purple-50 border-purple-200">
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-purple-900">95%</div>
                <div className="text-purple-600 font-medium">
                  {t("stats.successRate")}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Featured Jobs */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("featuredJobs.title")}
            </h2>
            <p className="text-gray-600 mt-4">{t("featuredJobs.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <Card key={job._id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {job.title}
                  </h3>
                  <span className="text-green-600 font-bold">
                    ETB {job.budget?.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {job.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="primary" size="sm">
                      {job.category}
                    </Badge>
                    {job.deadline && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Link href={user ? `/jobs/${job._id}` : "/login"}>
                    <Button size="sm" className="shadow-sm">
                      {user ? "Apply Now" : "Login to Apply"}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => router.push("/jobs")}>
              {t("featuredJobs.viewAllJobs")}
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("howItWorks.title")}
            </h2>
            <p className="text-gray-600 mt-4">{t("howItWorks.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("howItWorks.step1.title")}
              </h3>
              <p className="text-gray-600">
                {t("howItWorks.step1.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("howItWorks.step2.title")}
              </h3>
              <p className="text-gray-600">
                {t("howItWorks.step2.description")}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("howItWorks.step3.title")}
              </h3>
              <p className="text-gray-600">
                {t("howItWorks.step3.description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <TestimonialsSection />

      {/* News Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Newspaper className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                {t("news.title")}
              </h2>
            </div>
            <p className="text-gray-600 mt-4">{t("news.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsData.slice(0, 3).map((news) => (
              <Card
                key={news.id}
                className="hover:shadow-lg transition-all duration-300 group overflow-hidden"
              >
                {news.imageUrl ? (
                  // news image
                  <div className="h-48 relative overflow-hidden flex items-center justify-center bg-gray-100">
                    <Image
                      src={news.imageUrl}
                      alt={news.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={false}
                    />
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="secondary" size="sm">
                        {news.category}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 pointer-events-none" />
                  </div>
                ) : (
                  // news image placeholder
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20"></div>
                    <Newspaper className="h-16 w-16 text-blue-400/60" />
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" size="sm">
                        {news.category}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(news.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {news.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {news.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      className="group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-600 transition-all duration-300"
                      onClick={() => router.push(`/news/${news.id}`)}
                    >
                      <span className="flex items-center">
                        {t("news.readMore")}
                        <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300"
              onClick={() => router.push("/news")}
            >
              <Newspaper className="h-5 w-5 mr-2" />
              {t("news.viewAllNews")}
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-50 via-white to-cyan-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-gray-600 mb-8">{t("cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              onClick={() => {
                if (user?.role === "client") {
                  router.push("/client/jobs/new");
                } else {
                  router.push("/login");
                }
              }}
            >
              {t("cta.findWorkers")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-cyan-600 text-cyan-700 hover:bg-cyan-50"
              onClick={() => router.push("/jobs")}
            >
              {t("cta.findWork")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
