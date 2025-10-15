"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Newspaper, Share2, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useTranslations } from "next-intl";
import { publicAPI } from "@/lib/api";
import { DEFAULT_UPLOADS_BASE, resolveAssetUrl } from "@/lib/assets";

interface NewsDetailPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

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
  sizes = "80vw",
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

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const router = useRouter();
  const t = useTranslations("Home");

  const unwrappedParams = React.use(params);
  const [news, setNews] = useState<NewsArticle | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (unwrappedParams.id) {
      fetchNewsArticle(unwrappedParams.id);
      fetchRelatedNews();
    }
  }, [unwrappedParams.id]);

  const fetchNewsArticle = async (id: string) => {
    try {
      setLoading(true);
      const response = await publicAPI.getNewsArticle(id);
      const article = response.data.data || response.data;
      setNews({
        ...article,
        id: article._id,
        imageUrl: article.image || article.imageUrl,
      });
    } catch (error) {
      console.error("Failed to fetch news article:", error);
      setNews(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedNews = async () => {
    try {
      const response = await publicAPI.getNews({
        status: "published",
        limit: 3,
        sort: "-date",
      });
      const articles = response.data.data || [];
      setRelatedNews(
        articles.map((article: NewsArticle) => ({
          ...article,
          id: article._id,
          imageUrl: article.image || article.imageUrl,
        })),
      );
    } catch (error) {
      console.error("Failed to fetch related news:", error);
      setRelatedNews([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            News Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The news article you are looking for does not exist.
          </p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: news.title,
        text: news.excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("NewsDetail.backButton")}
            </Button>

            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t("NewsDetail.shareButton")}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-100 to-cyan-100">
            <ResolvedNewsImage
              news={news}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
              fallback={
                <div className="flex items-center justify-center h-full">
                  <Newspaper className="h-24 w-24 text-blue-400/60" />
                </div>
              }
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />

            {/* Category Badge */}
            <div className="absolute top-6 left-6">
              <Badge variant="secondary" size="lg">
                {news.category}
              </Badge>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-8 md:p-12">
            {/* Article Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {news.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(news.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {news.readTime}
                </div>

                <div className="flex items-center">
                  <span className="font-medium">By {news.author}</span>
                </div>
              </div>

              <p className="text-xl text-gray-700 leading-relaxed">
                {news.excerpt}
              </p>
            </header>

            {/* Article Body */}
            {news.content && (
              <div
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            )}

            {/* Article Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex items-center"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t("NewsDetail.shareButton")}
                  </Button>
                </div>

                <div className="flex items-center space-x-4">
                  <Link href="/">
                    <Button variant="outline" className="flex items-center">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t("NewsDetail.backToHome")}
                    </Button>
                  </Link>

                  <Link href="/news">
                    <Button className="flex items-center">
                      <Newspaper className="h-4 w-4 mr-2" />
                      {t("NewsDetail.viewAllNews")}
                    </Button>
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t("NewsDetail.relatedNews")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedNews
                .filter((item) => item.id !== news.id)
                .slice(0, 2)
                .map((article) => (
                  <div
                    key={article.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/news/${article.id}`)}
                  >
                    <Card className="h-full">
                      <div className="h-48 relative overflow-hidden">
                        <ResolvedNewsImage
                          news={article}
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          fallback={
                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-100 to-cyan-100">
                              <Newspaper className="h-12 w-12 text-blue-400/60" />
                            </div>
                          }
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" size="sm">
                            {article.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="h-4 w-4 mr-2" />
                          {new Date(article.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {article.title}
                        </h3>

                        <p className="text-gray-600 text-sm line-clamp-3">
                          {article.excerpt}
                        </p>
                      </div>
                    </Card>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
