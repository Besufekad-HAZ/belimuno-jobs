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
  Star,
  MapPin,
  Newspaper,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { getStoredUser, getRoleDashboardPath } from "@/lib/auth";
import { jobsAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Hero from "@/components/sections/Hero";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useTranslations } from "next-intl";
import { newsData } from "@/data/news";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      {/* Hero Section (professional image + CTAs) */}
      <Hero />

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

      {/* Testimonials Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("testimonials.title")}
            </h2>
            <p className="text-gray-600 mt-4">{t("testimonials.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">
                &ldquo;{t("testimonials.testimonial1.content")}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-gray-900">
                  {t("testimonials.testimonial1.name")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("testimonials.testimonial1.role")}
                </p>
                <p className="text-sm text-blue-600">
                  {t("testimonials.testimonial1.company")}
                </p>
              </div>
            </Card>

            {/* Testimonial 2 */}
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">
                &ldquo;{t("testimonials.testimonial2.content")}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-gray-900">
                  {t("testimonials.testimonial2.name")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("testimonials.testimonial2.role")}
                </p>
                <p className="text-sm text-blue-600">
                  {t("testimonials.testimonial2.company")}
                </p>
              </div>
            </Card>

            {/* Testimonial 3 */}
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p className="text-gray-600 mb-6 italic">
                &ldquo;{t("testimonials.testimonial3.content")}&rdquo;
              </p>
              <div>
                <p className="font-semibold text-gray-900">
                  {t("testimonials.testimonial3.name")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("testimonials.testimonial3.role")}
                </p>
                <p className="text-sm text-blue-600">
                  {t("testimonials.testimonial3.company")}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      {/* <TestimonialsSection /> */}

      {/* Regions Where We Operate */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {t("regions.title")}
            </h2>
            <p className="text-gray-600 mt-4">{t("regions.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Addis Ababa */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("regions.addisAbaba.name")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {t("regions.addisAbaba.description")}
                  </p>
                  <Badge variant="primary" size="sm">
                    {t("regions.addisAbaba.jobs")}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Oromia */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("regions.oromia.name")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {t("regions.oromia.description")}
                  </p>
                  <Badge variant="secondary" size="sm">
                    {t("regions.oromia.jobs")}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Amhara */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("regions.amhara.name")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {t("regions.amhara.description")}
                  </p>
                  <Badge variant="secondary" size="sm">
                    {t("regions.amhara.jobs")}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Tigray */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("regions.tigray.name")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {t("regions.tigray.description")}
                  </p>
                  <Badge variant="secondary" size="sm">
                    {t("regions.tigray.jobs")}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* SNNP */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-indigo-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("regions.snnp.name")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {t("regions.snnp.description")}
                  </p>
                  <Badge variant="secondary" size="sm">
                    {t("regions.snnp.jobs")}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Sidama */}
            <Card className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
              <div className="flex items-start space-x-3">
                <MapPin className="h-6 w-6 text-red-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("regions.sidama.name")}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {t("regions.sidama.description")}
                  </p>
                  <Badge variant="secondary" size="sm">
                    {t("regions.sidama.jobs")}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

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
