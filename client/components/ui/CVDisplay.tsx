"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Mail, Phone, MapPin, Calendar, Building, GraduationCap, Award } from "lucide-react";

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  workerSkills: string[];
  workerExperience: string;
  workerHourlyRate: number;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Skill {
  id: string;
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

interface CVData {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  detailedSkills: Skill[];
}

interface CVDisplayProps {
  cvData: CVData;
  className?: string;
}

const CVDisplay: React.FC<CVDisplayProps> = ({ cvData, className = "" }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "-01");
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  };

  const getSkillColor = (level: string) => {
    switch (level) {
      case "Expert":
        return "bg-green-100 text-green-800";
      case "Advanced":
        return "bg-blue-100 text-blue-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Beginner":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={`p-6 bg-white border border-gray-200 ${className}`}>
      {/* Header Section */}
      <div className="text-center border-b border-gray-200 pb-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {cvData.personalInfo.fullName || "Professional CV"}
        </h1>
        <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
          {cvData.personalInfo.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-blue-600" />
              <span>{cvData.personalInfo.email}</span>
            </div>
          )}
          {cvData.personalInfo.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-green-600" />
              <span>{cvData.personalInfo.phone}</span>
            </div>
          )}
          {cvData.personalInfo.address && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-red-600" />
              <span>{cvData.personalInfo.address}</span>
            </div>
          )}
        </div>
        {cvData.personalInfo.workerExperience && (
          <div className="mt-2 flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-2 text-purple-600" />
              <span>Experience: {cvData.personalInfo.workerExperience} Years</span>
            </div>
            {cvData.personalInfo.workerHourlyRate > 0 && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-orange-600" />
                <span>Hourly Rate: ETB {cvData.personalInfo.workerHourlyRate}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Professional Summary */}
      {cvData.personalInfo.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
            <div className="w-1 h-6 bg-blue-600 mr-3"></div>
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg">
            {cvData.personalInfo.summary}
          </p>
        </div>
      )}

      {/* Main Skills (from workerSkills array in personalInfo) */}
      {cvData.personalInfo.workerSkills && cvData.personalInfo.workerSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-yellow-600 mr-3"></div>
            Key Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {cvData.personalInfo.workerSkills.map((skill, index) => (
              <Badge key={index} variant="default" className="bg-yellow-100 text-yellow-800 text-sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {cvData.experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-green-600 mr-3"></div>
            Work Experience
          </h2>
          <div className="space-y-4">
            {cvData.experience.map((exp, index) => (
              <div key={exp.id} className="relative pl-6 pb-4">
                {/* Timeline line */}
                {index < cvData.experience.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-full bg-gray-300"></div>
                )}
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow"></div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 ml-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {exp.position}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Building className="h-4 w-4 mr-2" />
                        <span className="font-medium">{exp.company}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {exp.current ? "Current" : "Past"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  
                  {exp.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {cvData.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-purple-600 mr-3"></div>
            Education
          </h2>
          <div className="space-y-4">
            {cvData.education.map((edu, index) => (
              <div key={edu.id} className="relative pl-6 pb-4">
                {/* Timeline line */}
                {index < cvData.education.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-full bg-gray-300"></div>
                )}
                {/* Timeline dot */}
                <div className="absolute left-0 top-2 w-4 h-4 bg-purple-600 rounded-full border-2 border-white shadow"></div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 ml-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {edu.degree}
                        {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-1">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        <span className="font-medium">{edu.institution}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {edu.current ? "Ongoing" : "Completed"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      {formatDate(edu.startDate)} - {edu.current ? "Present" : formatDate(edu.endDate)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Skills (from skills array) */}
      {cvData.detailedSkills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-orange-600 mr-3"></div>
            Skills & Competencies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cvData.detailedSkills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center">
                  <Award className="h-4 w-4 mr-2 text-orange-600" />
                  <span className="font-medium text-gray-900 text-sm">
                    {skill.name}
                  </span>
                </div>
                <Badge
                  className={`text-xs ${getSkillColor(skill.level)}`}
                  size="sm"
                >
                  {skill.level}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 text-center">
        <p className="text-xs text-gray-500">
          Generated by Belimuno Jobs CV Builder • Professional CV Template
        </p>
      </div>
    </Card>
  );
};

export default CVDisplay;
