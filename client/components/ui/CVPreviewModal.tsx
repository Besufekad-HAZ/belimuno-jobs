"use client";

import React from "react";
import Modal from "./Modal";
import Card from "./Card";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
} from "lucide-react";
import { User as UserType } from "@/lib/auth";

interface CVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  loading?: boolean;
}

const CVPreviewModal: React.FC<CVPreviewModalProps> = ({
  isOpen,
  onClose,
  user,
  loading = false,
}) => {
  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="CV Preview"
        size="xl"
        contentClassName="flex items-center justify-center min-h-96"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </Modal>
    );
  }

  if (!user) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="CV Preview"
        size="xl"
        contentClassName="flex items-center justify-center min-h-96"
      >
        <div className="text-center">
          <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No CV Available
          </h3>
          <p className="text-gray-600">This user has not uploaded a CV yet.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`CV Preview - ${user.name}`}
      size="xl"
      scrollContent={true}
    >
      <Card className="overflow-hidden bg-white shadow-xl">
        {/* Header with Gradient Background */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-3">
              {user.name || "User Name"}
            </h1>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm opacity-90">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                {user.email || "user@example.com"}
              </div>
              {user.profile?.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {user.profile.phone}
                </div>
              )}
              {user.profile?.address && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {typeof user.profile.address === "string"
                    ? user.profile.address
                    : `${user.profile.address.street || ""} ${user.profile.address.city || ""} ${user.profile.address.region || ""}`.trim()}
                </div>
              )}
            </div>
            {user.profile?.portfolio && (
              <div className="mt-3">
                <a
                  href={
                    Array.isArray(user.profile.portfolio)
                      ? user.profile.portfolio[0]
                      : user.profile.portfolio
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm opacity-90 hover:opacity-100 transition-opacity"
                >
                  <span className="mr-1">🌐</span>
                  Portfolio
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Professional Summary */}
          {user.profile?.bio && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Professional Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {user.profile.bio}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {user.workerProfile?.workHistory &&
            user.workerProfile.workHistory.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                  Work Experience
                </h2>
                <div className="space-y-6">
                  {user.workerProfile.workHistory.map((exp, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 bg-blue-600 rounded-full mt-2"></div>
                          {index <
                            user.workerProfile!.workHistory!.length - 1 && (
                            <div className="absolute left-1.5 top-5 w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent"></div>
                          )}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-6 border-l-4 border-l-blue-600">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {exp.title || "Position"} at{" "}
                            {exp.company || "Company"}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 font-medium">
                            {exp.startDate} - {exp.endDate || "Present"}
                          </p>
                          {exp.description && (
                            <p className="text-gray-700 leading-relaxed">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Education */}
          {user.workerProfile?.education &&
            user.workerProfile.education.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                  Education
                </h2>
                <div className="space-y-4">
                  {user.workerProfile.education.map((edu, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                          {index <
                            user.workerProfile!.education!.length - 1 && (
                            <div className="absolute left-1.5 top-5 w-0.5 h-full bg-gradient-to-b from-green-300 to-transparent"></div>
                          )}
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-6 border-l-4 border-l-green-500">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {edu.degree || "Degree"} in{" "}
                            {edu.field || "Field of Study"}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1 font-medium">
                            {edu.school || "Institution"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {edu.startDate} - {edu.endDate || "Present"}
                          </p>
                          {edu.description && (
                            <p className="text-sm text-gray-700 mt-2">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Skills */}
          {user.profile?.skills && user.profile.skills.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Award className="h-5 w-5 mr-2 text-blue-600" />
                Skills
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.profile.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow"
                  >
                    <span className="font-semibold text-gray-900">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            {user.profile?.experience && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Experience Level
                </h3>
                <p className="text-gray-700">{user.profile.experience} years</p>
              </div>
            )}
            {user.profile?.hourlyRate && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Hourly Rate
                </h3>
                <p className="text-gray-700">{user.profile.hourlyRate} ETB</p>
              </div>
            )}
            {typeof user.workerProfile?.rating === "number" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Rating</h3>
                <p className="text-gray-700 flex items-center">
                  <span className="text-yellow-400 text-lg mr-1">★</span>
                  {user.workerProfile.rating}/5
                </p>
              </div>
            )}
            {typeof user.workerProfile?.completedJobs === "number" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Completed Jobs
                </h3>
                <p className="text-gray-700">
                  {user.workerProfile.completedJobs}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Modal>
  );
};

export default CVPreviewModal;
