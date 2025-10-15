"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Trash2,
  ArrowLeft,
  UploadCloud,
  Edit3,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { adminAPI } from "@/lib/api";
import { getStoredUser, hasRole } from "@/lib/auth";
import { toast } from "@/components/ui/sonner";

interface NewsArticle {
  _id?: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  category: string;
  imageUrl?: string;
  image?: string;
  readTime?: string;
  author?: string;
  status?: "draft" | "published" | "archived";
  createdAt?: string;
  updatedAt?: string;
}

type NewsFormState = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  image: string;
};

const emptyNewsForm: NewsFormState = {
  title: "",
  excerpt: "",
  content: "",
  category: "",
  author: "",
  image: "",
};

const MAX_NEWS_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB cap to keep news assets lightweight

const categorySuggestions = [
  "Company News",
  "Industry Updates",
  "Job Market Trends",
  "Success Stories",
  "Platform Updates",
  "Community",
  "Announcements",
  "Tips & Advice",
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "success";
    case "draft":
      return "warning";
    case "archived":
      return "gray";
    default:
      return "blue";
  }
};

const ManageNewsPage: React.FC = () => {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(
    null,
  );
  const [form, setForm] = useState<NewsFormState>(emptyNewsForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsArticle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const hasFetchedRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const resetImageState = useCallback(() => {
    setImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setImageUploadError(null);
    setUploadingImage(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }, [imageInputRef]);

  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const sortedNews = useMemo(
    () =>
      [...newsArticles].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }),
    [newsArticles],
  );

  const fetchNewsArticles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getNews({
        limit: 50,
        sort: "-date",
      });

      const articles = response.data?.data || [];
      setNewsArticles(articles);
      setBanner((prev) => (prev?.type === "error" ? null : prev));
    } catch (error) {
      console.error("Failed to load news articles:", error);
      setNewsArticles([]);
      setBanner({
        type: "error",
        message: "We couldn't load news articles. Please try again shortly.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenModal = (article?: NewsArticle) => {
    if (article) {
      setEditingArticle(article);
      setForm({
        title: article.title,
        excerpt: article.excerpt,
        content: article.content || "",
        category: article.category,
        author: article.author || "",
        image: article.imageUrl || article.image || "",
      });
    } else {
      setEditingArticle(null);
      setForm(emptyNewsForm);
    }
    setFormErrors({});
    setFormMessage(null);
    resetImageState();
    setShowModal(true);
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingArticle(null);
    setForm(emptyNewsForm);
    setFormErrors({});
    setFormMessage(null);
    resetImageState();
  };

  const handleInputChange = (field: keyof NewsFormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSelectImage = () => {
    setImageUploadError(null);
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageUploadError("Please choose an image file (PNG or JPG).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_NEWS_IMAGE_SIZE) {
      setImageUploadError("Images must be 1MB or smaller.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageUploadError(null);
    setUploadingImage(true);
    setImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return objectUrl;
    });

    try {
      const response = await adminAPI.uploadTeamPhoto(file);
      const uploadedUrl =
        (response.data?.data?.url as string | undefined) ??
        (response.data?.url as string | undefined);

      if (uploadedUrl) {
        // Store the uploaded URL in a temporary state for form submission
        setForm((prev) => ({ ...prev, image: uploadedUrl }));
        toast.success("Article image uploaded.");
      } else {
        setImageUploadError(
          "Upload finished but no URL was returned. Please try again.",
        );
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      setImageUploadError(
        "We couldn't upload that image. Please try a different file.",
      );
      setImagePreview((prev) => {
        if (prev && prev.startsWith("blob:")) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const previewSource = imagePreview;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors: Record<string, string> = {};

    if (!form.title.trim()) {
      errors.title = "Please add a title for the news article.";
    }
    if (!form.excerpt.trim()) {
      errors.excerpt = "Please add an excerpt or summary.";
    }
    if (!form.category.trim()) {
      errors.category = "Please select a category.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormMessage(null);

      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content.trim() || undefined,
        category: form.category.trim(),
        author: form.author.trim() || undefined,
        image: form.image.trim() || undefined,
        status: "draft" as const, // Default to draft
      };

      if (editingArticle) {
        await adminAPI.updateNews(editingArticle._id!, payload);
        toast.success("News article updated successfully");
      } else {
        await adminAPI.createNews(payload);
        toast.success("News article created successfully");
      }

      await fetchNewsArticles();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save news article:", error);
      const apiMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      setFormMessage({
        type: "error",
        message:
          apiMessage ||
          "We couldn't save this news article right now. Please retry in a moment.",
      });
      toast.error("Unable to save news article");
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (article: NewsArticle) => {
    if (!article._id) return;
    setDeleteTarget(article);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !deleteTarget._id) return;
    setDeleting(true);
    try {
      await adminAPI.deleteNews(deleteTarget._id);
      setNewsArticles((prev) => prev.filter((a) => a._id !== deleteTarget._id));
      toast.success("News article deleted successfully");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete news article:", error);
      toast.error("Unable to delete this news article right now.");
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["admin_hr"])) {
      router.push("/login");
      return;
    }

    if (hasFetchedRef.current) {
      return;
    }

    hasFetchedRef.current = true;
    fetchNewsArticles();
  }, [fetchNewsArticles, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage News</h1>
            <p className="text-gray-600 max-w-3xl mt-2">
              Create and manage news articles for the platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => router.push("/admin/hr/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button
              variant="primary"
              className="flex items-center justify-center gap-2"
              onClick={() => handleOpenModal()}
            >
              <Plus className="h-4 w-4" />
              Add News Article
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                News Articles
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage all news articles published on the platform
              </p>
            </div>

            {banner && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${banner.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
              >
                {banner.message}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`news-skeleton-${index}`}
                    className="flex flex-col rounded-2xl border border-blue-100 bg-white/70 p-4 animate-pulse"
                  >
                    <div className="h-32 w-full rounded-lg bg-blue-100 mb-3" />
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-blue-100" />
                      <div className="h-3 w-3/4 rounded bg-blue-50" />
                      <div className="h-3 w-1/2 rounded bg-blue-50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedNews.map((article) => {
                  const image = article.imageUrl || article.image;
                  return (
                    <div
                      key={article._id || `${article.title}-${article.date}`}
                      className="group relative flex flex-col rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    >
                      {image && (
                        <div className="relative h-32 w-full overflow-hidden rounded-lg mb-3">
                          <Image
                            src={image}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge
                            variant={getStatusColor(article.status || "draft")}
                            size="sm"
                          >
                            {article.status || "draft"}
                          </Badge>
                          <Badge variant="blue" size="sm">
                            {article.category}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(article.date)}
                          </div>
                          {article.readTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.readTime}
                            </div>
                          )}
                          {article.author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {article.author}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleOpenModal(article)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => requestDelete(article)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No news articles yet
                </h3>
                <p className="mt-2 text-sm text-gray-600 max-w-xl mx-auto">
                  Start by creating your first news article to keep your users
                  informed about platform updates and industry news.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-4"
                  onClick={() => handleOpenModal()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add News Article
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingArticle ? "Edit News Article" : "Create News Article"}
        size="lg"
      >
        {formMessage && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${formMessage.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {formMessage.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              ref={firstFieldRef}
              label="Title"
              value={form.title}
              onChange={(event) =>
                handleInputChange("title")(event.target.value)
              }
              placeholder="e.g. New Platform Features Launch"
              error={formErrors.title}
              required
            />
            <div>
              <Input
                label="Category"
                value={form.category}
                onChange={(event) =>
                  handleInputChange("category")(event.target.value)
                }
                placeholder="e.g. Company News"
                error={formErrors.category}
                list="news-categories"
                required
              />
              <datalist id="news-categories">
                {categorySuggestions.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <Input
              label="Author (optional)"
              value={form.author}
              onChange={(event) =>
                handleInputChange("author")(event.target.value)
              }
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Excerpt
            </label>
            <textarea
              value={form.excerpt}
              onChange={(event) =>
                handleInputChange("excerpt")(event.target.value)
              }
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief summary of the article..."
              required
            />
            {formErrors.excerpt && (
              <p className="mt-1 text-sm text-red-600">{formErrors.excerpt}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Content
            </label>
            <textarea
              value={form.content}
              onChange={(event) =>
                handleInputChange("content")(event.target.value)
              }
              rows={8}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full article content..."
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              Article Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-blue-100 bg-blue-50 flex items-center justify-center">
                {previewSource ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSource}
                    alt="Article preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold uppercase tracking-wide text-blue-700">
                    IMG
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center gap-2"
                  onClick={handleSelectImage}
                  loading={uploadingImage}
                  disabled={uploadingImage}
                >
                  <UploadCloud className="h-4 w-4" />
                  {uploadingImage ? "Uploading..." : "Upload image"}
                </Button>
                <p className="text-xs text-gray-500">
                  PNG or JPG up to 1MB. We&apos;ll host it for you.
                </p>
                {imageUploadError && (
                  <p className="text-xs text-red-600">{imageUploadError}</p>
                )}
              </div>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="min-w-[110px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="min-w-[150px]"
            >
              <Plus className="h-4 w-4" />
              {editingArticle ? "Update Article" : "Create Article"}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={deleting ? () => {} : cancelDelete}
        title={deleteTarget ? `Delete "${deleteTarget.title}"?` : "Confirm"}
        size="sm"
        preventCloseOnOutsideClick={deleting}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently delete the news article. This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              type="button"
              onClick={deleting ? undefined : cancelDelete}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={confirmDelete}
              loading={deleting}
              disabled={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageNewsPage;
