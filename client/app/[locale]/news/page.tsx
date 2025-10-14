"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Newspaper, ExternalLink } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useTranslations } from "next-intl";
import { newsData } from "@/data/news";
import { resolveAssetUrl } from "@/lib/assets";

export default function NewsPage() {
  const router = useRouter();
  const t = useTranslations("Home");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("NewsDetail.backButton")}
            </Button>
            <div className="flex items-center">
              <Newspaper className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                {t("news.title")}
              </h1>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t("news.title")}
          </h2>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            {t("news.subtitle")}
          </p>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsData.map((news) => {
            const imageSrc = news.imageUrl
              ? (resolveAssetUrl(news.imageUrl) ?? news.imageUrl)
              : undefined;

            return (
              <Card
                key={news.id}
                className="hover:shadow-lg transition-all duration-300 group overflow-hidden"
              >
                {imageSrc ? (
                  // News image
                  <div className="h-48 relative overflow-hidden flex items-center justify-center bg-gray-100">
                    <Image
                      src={imageSrc}
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
                  // News image placeholder
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
            );
          })}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t("NewsDetail.backToHome")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
