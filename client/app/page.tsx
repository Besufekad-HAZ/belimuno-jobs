"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Users,
  Briefcase,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { getStoredUser, getRoleDashboardPath } from "@/lib/auth";
import { jobsAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect Talent with
              <span className="bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent">
                {" "}
                Opportunities
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Belimuno Jobs is Ethiopia&apos;s premier HR outsourcing platform,
              connecting skilled workers with businesses across the country.
              Join thousands of professionals building their careers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-800 to-cyan-600 hover:from-blue-900 hover:to-cyan-700 shadow-lg text-white"
              >
                {user ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/jobs")}
                className="border-2 border-blue-800 text-blue-800 hover:bg-gradient-to-r hover:from-blue-800 hover:to-cyan-600 hover:text-white transition-all duration-300"
              >
                Browse Jobs
              </Button>
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
                Platform Statistics
              </h2>
              <p className="text-gray-600 mt-4">
                See the impact we&apos;re making across Ethiopia
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <Card className="text-center bg-blue-50 border-blue-200">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-blue-900">
                  {stats.totalUsers?.toLocaleString() || "1,000+"}
                </div>
                <div className="text-blue-600 font-medium">Active Users</div>
              </Card>
              <Card className="text-center bg-green-50 border-green-200">
                <Briefcase className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-green-900">
                  {stats.totalJobs?.toLocaleString() || "500+"}
                </div>
                <div className="text-green-600 font-medium">Jobs Posted</div>
              </Card>
              <Card className="text-center bg-yellow-50 border-yellow-200">
                <CheckCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-yellow-900">
                  {stats.completedJobs?.toLocaleString() || "300+"}
                </div>
                <div className="text-yellow-600 font-medium">
                  Jobs Completed
                </div>
              </Card>
              <Card className="text-center bg-purple-50 border-purple-200">
                <TrendingUp className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-purple-900">95%</div>
                <div className="text-purple-600 font-medium">Success Rate</div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Featured Jobs */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Featured Jobs</h2>
            <p className="text-gray-600 mt-4">
              Discover exciting opportunities from top employers
            </p>
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
              View All Jobs
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-600 mt-4">Simple steps to get started</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Account
              </h3>
              <p className="text-gray-600">
                Sign up as a worker to find jobs or as a client to post projects
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connect & Work
              </h3>
              <p className="text-gray-600">
                Browse opportunities, submit proposals, and get matched with the
                right projects
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Paid
              </h3>
              <p className="text-gray-600">
                Complete projects and receive secure payments through our
                platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of professionals already using Belimuno Jobs to
            advance their careers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="outline"
              className="bg-white text-blue-800 hover:bg-blue-50 border-2 border-white"
            >
              Find Workers
            </Button>
            <Button
              size="lg"
              className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg"
            >
              Find Work
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
