"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getStoredUser, hasRole } from "@/lib/auth";
import { clientAPI } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  priority: string;
  location: string;
  workType: string;
  status: string;
  tags: string[];
  requiredSkills: string[];
  region: string | { _id: string; name: string };
}

const UpdateJobPage: React.FC = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    deadline: "",
    requirements: [""],
    skills: [""],
    priority: "medium",
    location: "",
    workType: "remote",
  });
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState("");
  const [jobStatus, setJobStatus] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  // Check if a field is restricted from updates based on job status
  const isFieldRestricted = (fieldName: string): boolean => {
    const restrictedFields = ["budget", "deadline", "skills"];
    return (
      (jobStatus === "assigned" || jobStatus === "in_progress") &&
      restrictedFields.includes(fieldName)
    );
  };

  // Fetch existing job data
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const response = await clientAPI.getJob(jobId);
        const job = response.data.data.job as Job;
        console.log(job);

        // Store the job status
        setJobStatus(job.status || "");

        // Format the date to YYYY-MM-DD for the date input
        const formattedDate = job.deadline
          ? new Date(job.deadline).toISOString().split("T")[0]
          : "";

        setFormData({
          title: job.title || "",
          description: job.description || "",
          category: job.category || "",
          budget: job.budget?.toString() || "",
          deadline: formattedDate,
          requirements: job.tags?.length ? job.tags : [""],
          skills: job.requiredSkills?.length ? job.requiredSkills : [""],
          priority: job.priority || "medium",
          location: job.location || "",
          workType: job.workType || "remote",
        });
      } catch (error) {
        if (typeof error === "object" && error && "response" in error) {
          const axiosErr = error as {
            response?: { data?: { message?: string } };
          };
          setError(axiosErr.response?.data?.message || "Failed to fetch job");
        } else {
          setError("Failed to fetch job");
        }
        router.push("/client/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, router]);

  React.useEffect(() => {
    const user = getStoredUser();
    if (!user || !hasRole(user, ["client"])) {
      router.push("/login");
      return;
    }
  }, [router]);

  const categories = [
    "Web Development",
    "Mobile Development",
    "Design",
    "Writing",
    "Marketing",
    "Data Entry",
    "Customer Service",
    "Sales",
    "Consulting",
    "Other",
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleArrayChange = (
    index: number,
    value: string,
    field: "requirements" | "skills",
  ) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData({
      ...formData,
      [field]: updatedArray,
    });
  };

  const addArrayItem = (field: "requirements" | "skills") => {
    setFormData({
      ...formData,
      [field]: [...formData[field], ""],
    });
  };

  const removeArrayItem = (index: number, field: "requirements" | "skills") => {
    const updatedArray = formData[field].filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [field]: updatedArray,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Check for restricted field updates
      if (jobStatus === "assigned" || jobStatus === "in_progress") {
        const restrictedFields = ["budget", "deadline", "skills"];

        // Get current job data for comparison
        const response = await clientAPI.getJob(jobId);
        const currentJob = response.data.data.job as Job;

        const hasRestrictedUpdates = restrictedFields.some((field) => {
          if (field === "skills") {
            const currentSkills = currentJob.requiredSkills || [];
            const newSkills = formData.skills.filter((skill) => skill.trim());
            return JSON.stringify(currentSkills) !== JSON.stringify(newSkills);
          } else if (field === "budget") {
            return currentJob.budget?.toString() !== formData.budget;
          } else if (field === "deadline") {
            const currentDate = new Date(currentJob.deadline)
              .toISOString()
              .split("T")[0];
            return currentDate !== formData.deadline;
          }
          return false;
        });

        if (hasRestrictedUpdates) {
          setError(
            "Cannot update budget, deadline, or required skills for assigned jobs",
          );
          setLoading(false);
          return;
        }
      }

      const user = getStoredUser();
      // Support region being either a populated object or an id string
      const regionId = (() => {
        if (!user) return undefined;
        if (typeof user.region === "string") return user.region;
        if (user.region && typeof user.region === "object") {
          const maybeObj = user.region as unknown as { _id?: string };
          return maybeObj._id;
        }
        return undefined;
      })();
      if (!regionId) {
        setError(
          "Your account has no region assigned. Please contact support or update your profile.",
        );
        setLoading(false);
        return;
      }
      const jobData = {
        // Map frontend form fields to backend schema expectations
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: parseFloat(formData.budget),
        deadline: new Date(formData.deadline),
        priority: formData.priority,
        location: formData.location,
        workType: formData.workType,
        // Backend expects 'requiredSkills'
        requiredSkills: formData.skills.filter((skill) => skill.trim()),
        // Provide region from user context
        region: regionId,
        // Immediately post the job (instead of leaving as draft)
        status: "posted",
        // Keep requirements as tags if we want (map to tags) or drop if not used
        tags: formData.requirements.filter((req) => req.trim()),
      };

      await clientAPI.updateJob(jobId, jobData);
      toast.success("Job updated successfully");
      router.push("/client/dashboard");
    } catch (error: unknown) {
      if (typeof error === "object" && error && "response" in error) {
        const axiosErr = error as {
          response?: { data?: { message?: string } };
        };
        setError(axiosErr.response?.data?.message || "Failed to update job");
      } else {
        setError("Failed to update job");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Update Job</h1>
          <p className="text-gray-600 mt-2">Update your job posting details</p>
        </div>

        <Card>
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Loading job details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Basic Information
                </h3>

                <Input
                  label="Job Title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Build a React Website"
                />

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Job Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    required
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your project in detail..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Budget (ETB)"
                    name="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="0.00"
                    disabled={isFieldRestricted("budget")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Deadline"
                    name="deadline"
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isFieldRestricted("deadline")}
                  />

                  <div>
                    <label
                      htmlFor="priority"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="workType"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Work Type
                    </label>
                    <select
                      id="workType"
                      name="workType"
                      value={formData.workType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="remote">Remote</option>
                      <option value="onsite">On-site</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <Input
                  label="Location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Addis Ababa, Ethiopia"
                />
                {/* Region (derived from user) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    disabled
                    value={(() => {
                      const u = getStoredUser();
                      if (!u) return "Not set";
                      if (typeof u.region === "string") return "Assigned";
                      return u.region?.name || "Assigned";
                    })()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700 placeholder-gray-400 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Region is taken from your account and required to post a
                    job.
                  </p>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Requirements
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Requirements
                  </label>
                  {formData.requirements.map((requirement, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) =>
                          handleArrayChange(
                            index,
                            e.target.value,
                            "requirements",
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter a requirement..."
                      />
                      {formData.requirements.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem(index, "requirements")}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayItem("requirements")}
                  >
                    Add Requirement
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </label>
                  {formData.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <input
                        type="text"
                        value={skill}
                        onChange={(e) =>
                          handleArrayChange(index, e.target.value, "skills")
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter a required skill..."
                        disabled={isFieldRestricted("skills")}
                      />
                      {formData.skills.length > 1 &&
                        !isFieldRestricted("skills") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem(index, "skills")}
                          >
                            Remove
                          </Button>
                        )}
                    </div>
                  ))}
                  {!isFieldRestricted("skills") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("skills")}
                    >
                      Add Skill
                    </Button>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/client/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={loading}>
                  Update Job
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default UpdateJobPage;
