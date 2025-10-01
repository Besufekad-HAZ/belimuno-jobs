"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Plus, Trash2, User, Briefcase, GraduationCap, Award, Phone, Mail, MapPin, Save, Download, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string; // Moved from registration form
  address: string; // Used for location, moved from registration form
  summary: string; // Used for bio, moved from registration form
  workerSkills: string[]; // Moved from registration form
  workerExperience: string; // Moved from registration form
  workerHourlyRate: number; // Moved from registration form
  portfolio: string; // Portfolio link
  dateOfBirth: string; // Date of birth
  gender: string; // Gender
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string | undefined;
  current: boolean;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | undefined;
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
  detailedSkills: Skill[]; // This remains for detailed skill entries
}

interface EnhancedCVBuilderProps {
  onSave: (cvData: CVData) => Promise<void>;
  onDownload: (cvData: CVData) => void;
  initialData?: Partial<CVData>;
  saving?: boolean;
}

const EnhancedCVBuilder: React.FC<EnhancedCVBuilderProps> = ({
  onSave,
  onDownload,
  initialData,
  saving = false
}) => {
  const [cvData, setCVData] = useState<CVData>({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      summary: "",
      workerSkills: [],
      workerExperience: "",
      workerHourlyRate: 0,
      portfolio: "",
      dateOfBirth: "",
      gender: "",
    },
    education: [],
    experience: [],
    detailedSkills: [],
  });

  const [activeTab, setActiveTab] = useState<"personal" | "education" | "experience" | "skills" | "preview">("personal");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCVData(prev => ({
        ...prev,
        ...initialData,
        personalInfo: { ...prev.personalInfo, ...initialData.personalInfo },
      }));
    }
  }, [initialData]);

  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    let totalFields = 0;
    let completedFields = 0;

    // Personal Info (9 fields, all required)
    const personalInfoFields = [
      cvData.personalInfo.fullName,
      cvData.personalInfo.email,
      cvData.personalInfo.phone,
      cvData.personalInfo.address,
      cvData.personalInfo.summary,
      cvData.personalInfo.workerExperience,
      cvData.personalInfo.workerHourlyRate > 0,
      cvData.personalInfo.dateOfBirth,
      cvData.personalInfo.gender,
    ];
    totalFields += personalInfoFields.length;
    completedFields += personalInfoFields.filter(Boolean).length;

    // Education (at least 1 entry with required fields)
    totalFields += 1;
    if (cvData.education.length > 0) {
      const validEducation = cvData.education.some(edu =>
        edu.institution && edu.degree && edu.startDate
      );
      if (validEducation) completedFields += 1;
    }

    // Experience (at least 1 entry with required fields)
    totalFields += 1;
    if (cvData.experience.length > 0) {
      const validExperience = cvData.experience.some(exp =>
        exp.company && exp.position && exp.startDate
      );
      if (validExperience) completedFields += 1;
    }

    // Skills (at least 3 detailed skill entries)
    totalFields += 1;
    if (cvData.detailedSkills.length >= 3) {
      const validSkills = cvData.detailedSkills.filter(skill => skill.name && skill.name.trim() !== "").length;
      if (validSkills >= 3) completedFields += 1;
    }

    return Math.round((completedFields / totalFields) * 100);
  };

  const validateRequiredFields = () => {
    const newErrors: Record<string, string> = {};

    // Validate personal info
    if (!cvData.personalInfo.fullName.trim()) {
      newErrors["personalInfo.fullName"] = "Full name is required";
    }
    if (!cvData.personalInfo.email.trim()) {
      newErrors["personalInfo.email"] = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cvData.personalInfo.email)) {
      newErrors["personalInfo.email"] = "Please enter a valid email address";
    }
    if (!cvData.personalInfo.phone.trim()) {
      newErrors["personalInfo.phone"] = "Phone number is required";
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(cvData.personalInfo.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors["personalInfo.phone"] = "Please enter a valid phone number";
    }
    if (!cvData.personalInfo.address.trim()) {
      newErrors["personalInfo.address"] = "Address is required";
    }
    if (!cvData.personalInfo.summary.trim()) {
      newErrors["personalInfo.summary"] = "Professional summary (Bio) is required";
    } else if (cvData.personalInfo.summary.length > 500) {
      newErrors["personalInfo.summary"] = "Professional summary must be 500 characters or less";
    }
    if (!cvData.personalInfo.workerExperience.trim()) {
      newErrors["personalInfo.workerExperience"] = "Years of experience is required";
    }
    if (cvData.personalInfo.workerHourlyRate <= 0) {
      newErrors["personalInfo.workerHourlyRate"] = "Hourly rate must be greater than 0";
    }
    if (!cvData.personalInfo.dateOfBirth.trim()) {
      newErrors["personalInfo.dateOfBirth"] = "Date of birth is required";
    } else {
      const birthDate = new Date(cvData.personalInfo.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        newErrors["personalInfo.dateOfBirth"] = "You must be at least 18 years old";
      }
    }
    if (!cvData.personalInfo.gender.trim()) {
      newErrors["personalInfo.gender"] = "Gender is required";
    }
    
    // Validate portfolio URL if provided
    if (cvData.personalInfo.portfolio.trim() && !/^https?:\/\/.+/.test(cvData.personalInfo.portfolio)) {
      newErrors["personalInfo.portfolio"] = "Please enter a valid URL (must start with http:// or https://)";
    }

    // Validate at least one education entry if any exist
    if (cvData.education.length > 0 && !cvData.education.some(edu => edu.institution && edu.degree && edu.startDate)) {
      newErrors["education"] = "At least one complete education entry is required if you have education entries.";
    }

    // Validate at least one experience entry if any exist
    if (cvData.experience.length > 0 && !cvData.experience.some(exp => exp.company && exp.position && exp.startDate)) {
      newErrors["experience"] = "At least one complete experience entry is required if you have experience entries.";
    }

    // Validate at least 3 skills if any exist
    if (cvData.detailedSkills.length > 0 && cvData.detailedSkills.filter(skill => skill.name.trim() !== "").length < 3) {
      newErrors["skills"] = "Please add at least 3 detailed skills or leave this section empty if you don't want to use it.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const isValid = validateRequiredFields();
    if (!isValid) {
      // Show specific error messages
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const firstError = errorFields[0];
        const fieldName = firstError.replace('personalInfo.', '');
        const displayName = {
          'fullName': 'Full Name',
          'email': 'Email',
          'phone': 'Phone Number',
          'address': 'Address',
          'summary': 'Professional Summary',
          'workerExperience': 'Years of Experience',
          'workerHourlyRate': 'Hourly Rate',
          'dateOfBirth': 'Date of Birth',
          'gender': 'Gender',
          'portfolio': 'Portfolio Link'
        }[fieldName] || fieldName;
        toast.error(`Please fix the ${displayName} field`);
      } else {
        toast.error("Please fill in all required fields");
      }
      setActiveTab("personal");
      return;
    }

    try {
      await onSave(cvData);
      toast.success("CV saved successfully!");
    } catch {
      toast.error("Failed to save CV. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!validateRequiredFields()) {
      toast.error("Please complete all required fields before downloading");
      return;
    }
    onDownload(cvData);
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      current: false,
    };
    setCVData(prev => ({
      ...prev,
      education: [...prev.education, newEducation],
    }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.map(edu =>
        edu.id === id ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (id: string) => {
    setCVData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }));
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    setCVData(prev => ({
      ...prev,
      experience: [...prev.experience, newExperience],
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (id: string) => {
    setCVData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id),
    }));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: "",
      level: "Beginner",
    };
    setCVData(prev => ({
      ...prev,
      detailedSkills: [...prev.detailedSkills, newSkill],
    }));
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    setCVData(prev => ({
      ...prev,
      detailedSkills: prev.detailedSkills.map(skill =>
        skill.id === id ? { ...skill, [field]: value } : skill
      ),
    }));
  };

  const removeSkill = (id: string) => {
    setCVData(prev => ({
      ...prev,
      detailedSkills: prev.detailedSkills.filter(skill => skill.id !== id),
    }));
  };

  const completionPercentage = calculateCompletionPercentage();

  const renderPersonalInfo = () => {
    const personalInfoErrors = Object.keys(errors).filter(key => key.startsWith('personalInfo.'));
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h3>
          {personalInfoErrors.length > 0 && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 mr-1" />
              {personalInfoErrors.length} field{personalInfoErrors.length > 1 ? 's' : ''} need{personalInfoErrors.length === 1 ? 's' : ''} attention
            </div>
          )}
        </div>
        
        {personalInfoErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Missing Required Fields:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {personalInfoErrors.map(errorKey => {
                const fieldName = errorKey.replace('personalInfo.', '');
                const displayName = {
                  'fullName': 'Full Name',
                  'email': 'Email',
                  'phone': 'Phone Number',
                  'address': 'Address',
                  'summary': 'Professional Summary',
                  'workerExperience': 'Years of Experience',
                  'workerHourlyRate': 'Hourly Rate',
                  'dateOfBirth': 'Date of Birth',
                  'gender': 'Gender',
                  'portfolio': 'Portfolio Link'
                }[fieldName] || fieldName;
                
                return (
                  <li key={errorKey} className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {displayName}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={cvData.personalInfo.fullName}
            onChange={(e) => {
              setCVData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, fullName: e.target.value }
              }));
              if (errors["personalInfo.fullName"]) {
                setErrors(prev => ({ ...prev, "personalInfo.fullName": "" }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors["personalInfo.fullName"] ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Enter your full name"
          />
          {errors["personalInfo.fullName"] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors["personalInfo.fullName"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={cvData.personalInfo.email}
            onChange={(e) => {
              setCVData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, email: e.target.value }
              }));
              if (errors["personalInfo.email"]) {
                setErrors(prev => ({ ...prev, "personalInfo.email": "" }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors["personalInfo.email"] ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Enter your email"
          />
          {errors["personalInfo.email"] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors["personalInfo.email"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={cvData.personalInfo.phone}
            onChange={(e) => {
              setCVData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, phone: e.target.value }
              }));
              if (errors["personalInfo.phone"]) {
                setErrors(prev => ({ ...prev, "personalInfo.phone": "" }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors["personalInfo.phone"] ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Enter your phone number"
          />
          {errors["personalInfo.phone"] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors["personalInfo.phone"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={cvData.personalInfo.address}
            onChange={(e) => {
              setCVData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, address: e.target.value }
              }));
              if (errors["personalInfo.address"]) {
                setErrors(prev => ({ ...prev, "personalInfo.address": "" }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors["personalInfo.address"] ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="Enter your address"
          />
          {errors["personalInfo.address"] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors["personalInfo.address"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Link
          </label>
          <input
            type="url"
            value={cvData.personalInfo.portfolio}
            onChange={(e) => {
              setCVData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, portfolio: e.target.value }
              }));
              if (errors["personalInfo.portfolio"]) {
                setErrors(prev => ({ ...prev, "personalInfo.portfolio": "" }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors["personalInfo.portfolio"] ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
            placeholder="https://your-portfolio-website.com"
          />
          {errors["personalInfo.portfolio"] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors["personalInfo.portfolio"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={cvData.personalInfo.dateOfBirth}
            onChange={(e) => {
              setCVData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
              }));
              if (errors["personalInfo.dateOfBirth"]) {
                setErrors(prev => ({ ...prev, "personalInfo.dateOfBirth": "" }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors["personalInfo.dateOfBirth"] ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors["personalInfo.dateOfBirth"] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors["personalInfo.dateOfBirth"]}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            value={cvData.personalInfo.gender}
            onChange={(e) => {
              setCVData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, gender: e.target.value }
              }));
              if (errors["personalInfo.gender"]) {
                setErrors(prev => ({ ...prev, "personalInfo.gender": "" }));
              }
            }}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors["personalInfo.gender"] ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
          {errors["personalInfo.gender"] && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors["personalInfo.gender"]}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Summary <span className="text-red-500">*</span>
        </label>
        <textarea
          value={cvData.personalInfo.summary}
          onChange={(e) => {
            setCVData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, summary: e.target.value }
            }));
            if (errors["personalInfo.summary"]) {
              setErrors(prev => ({ ...prev, "personalInfo.summary": "" }));
            }
          }}
          rows={4}
          maxLength={500}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors["personalInfo.summary"] ? "border-red-500 bg-red-50" : "border-gray-300"
          }`}
          placeholder="Brief summary of your professional background and goals"
        />
        <div className="flex justify-between items-center mt-1">
          <div>
            {errors["personalInfo.summary"] && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors["personalInfo.summary"]}
              </p>
            )}
          </div>
          <p className={`text-xs ${cvData.personalInfo.summary.length > 450 ? 'text-orange-500' : 'text-gray-500'}`}>
            {cvData.personalInfo.summary.length}/500 characters
          </p>
        </div>
      </div>

        {/* Worker Specific Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={cvData.personalInfo.workerExperience}
              onChange={(e) => {
                setCVData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, workerExperience: e.target.value }
                }));
                if (errors["personalInfo.workerExperience"]) {
                  setErrors(prev => ({ ...prev, "personalInfo.workerExperience": "" }));
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors["personalInfo.workerExperience"] ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              placeholder="e.g. 5"
            />
            {errors["personalInfo.workerExperience"] && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors["personalInfo.workerExperience"]}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate (ETB) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cvData.personalInfo.workerHourlyRate}
              onChange={(e) => {
                setCVData(prev => ({
                  ...prev,
                  personalInfo: { ...prev.personalInfo, workerHourlyRate: parseFloat(e.target.value) || 0 }
                }));
                if (errors["personalInfo.workerHourlyRate"]) {
                  setErrors(prev => ({ ...prev, "personalInfo.workerHourlyRate": "" }));
                }
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors["personalInfo.workerHourlyRate"] ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              placeholder="e.g. 250"
            />
            {errors["personalInfo.workerHourlyRate"] && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors["personalInfo.workerHourlyRate"]}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEducation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <GraduationCap className="h-5 w-5 mr-2" />
          Education
        </h3>
        <Button onClick={addEducation} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" />
          Add Education
        </Button>
      </div>

      {cvData.education.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No education entries yet</p>
          <Button onClick={addEducation} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Education
          </Button>
        </div>
      )}

      {cvData.education.map((edu) => (
        <Card key={edu.id} className="p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-medium text-gray-900">Education Entry</h4>
            <Button
              onClick={() => removeEducation(edu.id)}
              variant="danger"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={edu.institution}
                onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="University/School name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Bachelor's, Master's, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field of Study
              </label>
              <input
                type="text"
                value={edu.fieldOfStudy}
                onChange={(e) => updateEducation(edu.id, "fieldOfStudy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Computer Science, Business, etc."
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`current-${edu.id}`}
                checked={edu.current}
                onChange={(e) => updateEducation(edu.id, "current", e.target.checked)}
                className="rounded"
              />
              <label htmlFor={`current-${edu.id}`} className="text-sm text-gray-700">
                Currently studying
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={edu.startDate}
                onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {!edu.current && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="month"
                  value={edu.endDate}
                  onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Briefcase className="h-5 w-5 mr-2" />
          Work Experience
        </h3>
        <Button onClick={addExperience} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-1" />
          Add Experience
        </Button>
      </div>

      {cvData.experience.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No work experience entries yet</p>
          <Button onClick={addExperience} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Experience
          </Button>
        </div>
      )}

      {cvData.experience.map((exp) => (
        <Card key={exp.id} className="p-6 border-l-4 border-l-green-500">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-medium text-gray-900">Experience Entry</h4>
            <Button
              onClick={() => removeExperience(exp.id)}
              variant="danger"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exp.company}
                onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exp.position}
                onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Job title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="month"
                value={exp.startDate}
                onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`current-exp-${exp.id}`}
                checked={exp.current}
                onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                className="rounded"
              />
              <label htmlFor={`current-exp-${exp.id}`} className="text-sm text-gray-700">
                Currently working here
              </label>
            </div>
            {!exp.current && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description
            </label>
            <textarea
              value={exp.description}
              onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your responsibilities and achievements"
            />
          </div>
        </Card>
      ))}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Skills
        </h3>
        <Button onClick={addSkill} size="sm" className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-1" />
          Add Skill
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Add at least 3 skills to complete this section. This helps potential clients understand your expertise.
      </p>

      {cvData.detailedSkills.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No skills added yet</p>
          <Button onClick={addSkill} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Skill
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cvData.detailedSkills.map((skill) => (
          <Card key={skill.id} className="p-4 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">Skill</h4>
              <Button
                onClick={() => removeSkill(skill.id)}
                variant="danger"
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. JavaScript, Project Management"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proficiency Level
                </label>
                <select
                  value={skill.level}
                  onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">CV Preview</h3>
      <Card className="p-6 bg-white border-2 border-gray-200">
        {/* Header */}
        <div className="text-center border-b pb-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {cvData.personalInfo.fullName || "Your Name"}
          </h1>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {cvData.personalInfo.email || "your.email@example.com"}
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              {cvData.personalInfo.phone || "+251 XX XXX XXXX"}
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {cvData.personalInfo.address || "Your Address"}
            </div>
          </div>
        </div>

        {/* Summary */}
        {cvData.personalInfo.summary && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2 border-b border-gray-200 pb-1">
              Professional Summary
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              {cvData.personalInfo.summary}
            </p>
          </div>
        )}

        {/* Experience */}
        {cvData.experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
              Work Experience
            </h2>
            <div className="space-y-4">
              {cvData.experience.map((exp) => (
                <div key={exp.id} className="border-l-2 border-blue-200 pl-4">
                  <h3 className="font-semibold text-gray-900">
                    {exp.position || "Position"} at {exp.company || "Company"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {cvData.education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
              Education
            </h2>
            <div className="space-y-3">
              {cvData.education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-green-200 pl-4">
                  <h3 className="font-semibold text-gray-900">
                    {edu.degree || "Degree"} in {edu.fieldOfStudy || "Field of Study"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {edu.institution || "Institution"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {edu.startDate} - {edu.current ? "Present" : edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {cvData.detailedSkills.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
              Skills
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {cvData.detailedSkills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm font-medium text-gray-900">
                    {skill.name || "Skill"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {skill.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const tabs = [
    { id: "personal", label: "Personal Info", icon: User },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "skills", label: "Skills", icon: Award },
    { id: "preview", label: "Preview", icon: null },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Progress Header */}
      <div className="bg-white border-b border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Build Your Professional CV</h1>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleSave}
              loading={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save CV
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Profile Completion</span>
              <span className="font-semibold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  completionPercentage === 100 ? 'bg-green-600' :
                  completionPercentage >= 75 ? 'bg-blue-600' :
                  completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="flex items-center text-sm">
            {completionPercentage === 100 ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-1" />
                Complete
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <AlertCircle className="h-5 w-5 mr-1" />
                {completionPercentage < 50 ? 'Getting Started' :
                 completionPercentage < 75 ? 'Almost There' : 'Nearly Complete'}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "personal" | "education" | "experience" | "skills")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon && <tab.icon className="h-4 w-4 mr-2" />}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === "personal" && renderPersonalInfo()}
        {activeTab === "education" && renderEducation()}
        {activeTab === "experience" && renderExperience()}
        {activeTab === "skills" && renderSkills()}
        {activeTab === "preview" && renderPreview()}
      </div>
    </div>
  );
};

export default EnhancedCVBuilder;
