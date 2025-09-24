"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasRole } from "@/lib/auth";
import { workerAPI, jobsAPI } from "@/lib/api";
import EnhancedCVBuilder from "@/components/ui/EnhancedCVBuilder";
import LoadingPage from "@/components/Layout/LoadingPage";
import { toast } from "@/components/ui/sonner";
import jsPDF from "jspdf";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Briefcase, Calendar, MapPin, Eye } from "lucide-react";

const CVBuilderPage: React.FC = () => {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialCVData, setInitialCVData] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user || !hasRole(user, ["worker"])) {
      router.push("/login");
      return;
    }

    loadExistingCV();
    loadAvailableJobs();
  }, [user, router]);

  const loadAvailableJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await jobsAPI.getAll({ limit: 5 }); // Get only 5 jobs for sidebar
      setAvailableJobs(response.data?.data?.jobs || response.data?.jobs || []);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setJobsLoading(false);
    }
  };

  const loadExistingCV = async () => {
    try {
      setLoading(true);
      const response = await workerAPI.getProfile();
      const profile = response.data.data;
      const workerProfile = response.data.data.workerProfile; // Fetch workerProfile
      
      if (profile.cv?.data) {
        const cvData = typeof profile.cv.data === 'string' 
          ? JSON.parse(profile.cv.data) 
          : profile.cv.data;
        setInitialCVData(cvData);
      } else {
        // Initialize with user's basic info
        setInitialCVData({
          personalInfo: {
            fullName: user.name || "",
            email: user.email || "",
            phone: profile.phone || "",
            address: profile.address?.city ? `${profile.address.city}, ${profile.address.country || 'Ethiopia'}` : "",
            summary: profile.bio || "",
            workerSkills: profile.skills || [],
            workerExperience: profile.experience || "",
            workerHourlyRate: profile.hourlyRate || 0,
          },
          // Preserve existing education, experience, and detailed skills if available
          education: (workerProfile?.education || []).map((edu: any) => ({
            id: edu._id || Date.now().toString(),
            institution: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.field,
            startDate: edu.startDate,
            endDate: edu.endDate,
            current: false, // Assuming 'current' status needs to be re-evaluated or handled differently
          })),
          experience: (workerProfile?.workHistory || []).map((exp: any) => ({
            id: exp._id || Date.now().toString(),
            company: exp.company,
            position: exp.title,
            startDate: exp.startDate,
            endDate: exp.endDate,
            current: false, // Assuming 'current' status needs to be re-evaluated or handled differently
            description: exp.description,
          })),
          detailedSkills: (profile.detailedSkills || []).map((skill: any) => ({
            id: skill._id || Date.now().toString(),
            name: skill.name,
            level: skill.level || "Beginner",
          })),
        });
      }
    } catch (error) {
      console.error("Failed to load CV data:", error);
      toast.error("Failed to load existing CV data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCV = async (cvData: any) => {
    try {
      setSaving(true);

      const profileUpdate: Record<string, any> = {
        phone: cvData.personalInfo.phone,
        address: {
          city: cvData.personalInfo.address.split(',')[0]?.trim() || "",
          country: cvData.personalInfo.address.split(',')[1]?.trim() || "Ethiopia",
        },
        bio: cvData.personalInfo.summary,
        skills: cvData.personalInfo.workerSkills,
        experience: cvData.personalInfo.workerExperience,
        hourlyRate: cvData.personalInfo.workerHourlyRate,
        // Also include structured CV data
        cv: {
          data: JSON.stringify(cvData),
          mimeType: "application/json",
          name: `${cvData.personalInfo.fullName.replace(/\s+/g, '_')}_CV.json`,
        }
      };

      // Add workerProfile specific fields
      const workerProfileUpdate: Record<string, any> = {
        education: cvData.education.map(edu => ({
          school: edu.institution,
          degree: edu.degree,
          field: edu.fieldOfStudy,
          startDate: edu.startDate,
          endDate: edu.current ? null : edu.endDate,
          description: "", // Description is not in CV builder Education, can be added if needed
        })),
        workHistory: cvData.experience.map(exp => ({
          company: exp.company,
          title: exp.position,
          startDate: exp.startDate,
          endDate: exp.current ? null : exp.endDate,
          description: exp.description,
        })),
        // Detailed skills are stored separately in cvData.detailedSkills, not workerProfile.skills
      };

      await workerAPI.updateProfile({ profile: profileUpdate, workerProfile: workerProfileUpdate });
      toast.success("CV saved successfully!");
    } catch (error) {
      console.error("Failed to save CV:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = (cvData: any) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;
      const margin = 20;
      const lineHeight = 6;

      // Helper function to add text with word wrapping
      const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        
        // Check if we need a new page
        if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(lines, margin, yPosition);
        yPosition += lines.length * lineHeight + 3;
      };

      // Header
      addText(cvData.personalInfo.fullName || "Professional CV", 20, true);
      
      // Contact Info
      const contactInfo = [
        cvData.personalInfo.email && `Email: ${cvData.personalInfo.email}`,
        cvData.personalInfo.phone && `Phone: ${cvData.personalInfo.phone}`,
        cvData.personalInfo.address && `Address: ${cvData.personalInfo.address}`,
      ].filter(Boolean).join(" | ");
      
      if (contactInfo) {
        addText(contactInfo, 10);
        yPosition += 5;
      }

      // Worker Specific Info
      if (cvData.personalInfo.workerExperience || cvData.personalInfo.workerHourlyRate > 0) {
        addText("WORKER DETAILS", 14, true);
        if (cvData.personalInfo.workerExperience) {
          addText(`Experience: ${cvData.personalInfo.workerExperience} Years`);
        }
        if (cvData.personalInfo.workerHourlyRate > 0) {
          addText(`Hourly Rate: ETB ${cvData.personalInfo.workerHourlyRate}`);
        }
        yPosition += 5;
      }

      // Professional Summary
      if (cvData.personalInfo.summary) {
        addText("PROFESSIONAL SUMMARY", 14, true);
        addText(cvData.personalInfo.summary);
        yPosition += 5;
      }

      // Main Skills (from workerSkills array in personalInfo)
      if (cvData.personalInfo.workerSkills && cvData.personalInfo.workerSkills.length > 0) {
        addText("KEY SKILLS", 14, true);
        addText(cvData.personalInfo.workerSkills.join(", "), 10);
        yPosition += 5;
      }

      // Work Experience
      if (cvData.experience && cvData.experience.length > 0) {
        addText("WORK EXPERIENCE", 14, true);
        
        cvData.experience.forEach((exp: any) => {
          const title = `${exp.position || 'Position'} at ${exp.company || 'Company'}`;
          const dates = `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}`;
          
          addText(title, 12, true);
          addText(dates, 10);
          
          if (exp.description) {
            addText(exp.description);
          }
          yPosition += 3;
        });
        yPosition += 5;
      }

      // Education
      if (cvData.education && cvData.education.length > 0) {
        addText("EDUCATION", 14, true);
        
        cvData.education.forEach((edu: any) => {
          const degree = `${edu.degree || 'Degree'}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}`;
          const school = edu.institution || 'Institution';
          const dates = `${edu.startDate || ''} - ${edu.current ? 'Present' : edu.endDate || ''}`;
          
          addText(degree, 12, true);
          addText(school, 10);
          addText(dates, 10);
          yPosition += 3;
        });
        yPosition += 5;
      }

      // Skills
      if (cvData.skills && cvData.skills.length > 0) {
        addText("SKILLS", 14, true);
        
        const skillsByLevel = cvData.skills.reduce((acc: any, skill: any) => {
          if (!acc[skill.level]) acc[skill.level] = [];
          acc[skill.level].push(skill.name);
          return acc;
        }, {});

        Object.entries(skillsByLevel).forEach(([level, skills]: [string, any]) => {
          addText(`${level}: ${skills.join(', ')}`, 10);
        });
      }

      // Save the PDF
      const fileName = `${cvData.personalInfo.fullName?.replace(/\s+/g, '_') || 'Professional'}_CV.pdf`;
      pdf.save(fileName);
      
      toast.success("CV downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!user || !hasRole(user, ["worker"])) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* CV Builder - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <EnhancedCVBuilder
              onSave={handleSaveCV}
              onDownload={handleDownloadPDF}
              initialData={initialCVData}
              saving={saving}
            />
          </div>
          
          {/* Jobs Sidebar - Takes up 1 column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Available Jobs
              </h3>
              
              {jobsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : availableJobs.length > 0 ? (
                <div className="space-y-4">
                  {availableJobs.slice(0, 5).map((job: any) => (
                    <div key={job._id} className="border-b border-gray-100 pb-3 last:border-b-0">
                      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {job.title}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Due: {new Date(job.deadline).toLocaleDateString()}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          ETB {job.budget?.toLocaleString()}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => window.open(`/jobs/${job._id}`, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t border-gray-100">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open('/jobs', '_blank')}
                    >
                      See More Jobs
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No jobs available</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVBuilderPage;
