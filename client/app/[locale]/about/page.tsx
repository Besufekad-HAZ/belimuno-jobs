"use client";

import React from "react";
import { Users, Target, Eye, Heart, Award } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useTranslations } from "next-intl";

const AboutPage: React.FC = () => {
  const t = useTranslations("AboutPage");

  const teamMembers = [
    {
      name: "Managing Director",
      department: "Management",
      role: "ANALYST ASSETS",
    },
    {
      name: "Human Resource Department Head",
      department: "HR",
      role: "ELIAS KETEMA",
    },
    {
      name: "Manpower Supply Division",
      department: "Operations",
      role: "SENAIT AYALEW",
    },
    {
      name: "Outsourced Service Management Dept",
      department: "Operations",
      role: "FIRST TADESSE",
    },
    { name: "Finance Division", department: "Finance", role: "MAMDOUH ABEBE" },
    {
      name: "Other Crew Division",
      department: "Operations",
      role: "C.T. ALEMAYEHU MESFASH",
    },
    {
      name: "Admin & Finance Department",
      department: "Administration",
      role: "HONEYWEST TEKA",
    },
  ];

  const values = [
    {
      title: "Adhocracy",
      description:
        "Our flexible management system enables us hire tailored to fit workforce",
      color: "bg-blue-50 border-blue-200 text-blue-800",
    },
    {
      title: "Reliability",
      description: "We always strive to keep what we promised",
      color: "bg-green-50 border-green-200 text-green-800",
    },
    {
      title: "Trustworthy",
      description: "We are devoted to be your trusted partners",
      color: "bg-purple-50 border-purple-200 text-purple-800",
    },
    {
      title: "Integrity",
      description:
        "We promise only what we deliver and we can deliver on every promise",
      color: "bg-indigo-50 border-indigo-200 text-indigo-800",
    },
    {
      title: "Specialty",
      description:
        "We are seasoned professionals continuously educating ourselves, ready for future challenges",
      color: "bg-cyan-50 border-cyan-200 text-cyan-800",
    },
    {
      title: "Technicality",
      description:
        "We believe every challenge has unique solution and technically deal with each accordingly",
      color: "bg-orange-50 border-orange-200 text-orange-800",
    },
    {
      title: "Incorruptibility",
      description: "Never involved and will never in fraudulent acts",
      color: "bg-red-50 border-red-200 text-red-800",
    },
    {
      title: "Creativity",
      description:
        "We are always looking for new ways to enhance our customers' satisfaction",
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">{t("hero.title")}</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 text-lg px-6 py-2"
              >
                {t("hero.motto")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("executiveSummary.title")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto"></div>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 p-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              {t("executiveSummary.content.part1")}
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mt-4">
              {t("executiveSummary.content.part2")}
            </p>
          </Card>
        </div>
      </section>

      {/* Vision, Mission, Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Vision */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 text-center p-8">
              <Eye className="h-16 w-16 text-purple-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-purple-900 mb-4">
                {t("visionMissionValues.vision.title")}
              </h3>
              <p className="text-gray-700">
                {t("visionMissionValues.vision.content")}
              </p>
            </Card>

            {/* Mission */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 text-center p-8">
              <Target className="h-16 w-16 text-blue-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-blue-900 mb-4">
                {t("visionMissionValues.mission.title")}
              </h3>
              <p className="text-gray-700">
                {t("visionMissionValues.mission.content")}
              </p>
            </Card>

            {/* Values */}
            <Card className="bg-gradient-to-br from-cyan-50 to-green-50 border-cyan-200 text-center p-8">
              <Heart className="h-16 w-16 text-cyan-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-cyan-900 mb-4">
                {t("visionMissionValues.values.title")}
              </h3>
              <p className="text-gray-700">
                {t("visionMissionValues.values.content")}
              </p>
            </Card>
          </div>

          {/* Detailed Values */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              {t("visionMissionValues.values.sectionTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map((value, index) => (
                <Card key={index} className={`${value.color} p-4`}>
                  <h4 className="font-bold mb-2">
                    {t(`visionMissionValues.values.${index + 1}.title`)}
                  </h4>
                  <p className="text-sm">
                    {t(`visionMissionValues.values.${index + 1}.description`)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-16 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("services.title")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              <Users
                className="h-12 w-12 text-blue-600 mx-auto mb-4"
                key="users"
              />,
              <Award
                className="h-12 w-12 text-cyan-600 mx-auto mb-4"
                key="award"
              />,
              <Target
                className="h-12 w-12 text-purple-600 mx-auto mb-4"
                key="target"
              />,
            ].map((icon, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-center">
                  {icon}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t(`services.${index + 1}.title`)}
                  </h3>
                  <p className="text-gray-600">
                    {t(`services.${index + 1}.description`)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("team.title")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("team.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <Badge variant="primary" className="mb-2">
                    {member.department}
                  </Badge>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Clients */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t("clients.title")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600">{t("clients.description")}</p>
          </div>

          <div className="text-center">
            <Link href="/clients">
              <Button>{t("clients.viewButton")}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full translate-x-48 translate-y-48"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-cyan-100 font-medium mb-10 leading-relaxed max-w-3xl mx-auto">
            {t("cta.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link href="/contact">
              <Button className="bg-white text-blue-800 hover:bg-cyan-50 hover:scale-105 transition-all duration-300 px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-white/20 !text-black">
                {t("cta.buttons.contact")}
              </Button>
            </Link>
            <Link href="/jobs">
              <Button className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-800 hover:scale-105 transition-all duration-300 px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-white/20">
                {t("cta.buttons.jobs")}
              </Button>
            </Link>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <a
              href="mailto:info@belimunojobs.com"
              className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                📧
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">
                  {t("cta.contact.email.title")}
                </p>
                <p className="text-cyan-200 text-sm">info@belimunojobs.com</p>
              </div>
            </a>

            <a
              href="https://t.me/belimunojobs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                📱
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">
                  {t("cta.contact.telegram.title")}
                </p>
                <p className="text-cyan-200 text-sm">@belimunojobs</p>
              </div>
            </a>

            <a
              href="tel:+251118697880"
              className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                📞
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">
                  {t("cta.contact.phone.title")}
                </p>
                <p className="text-cyan-200 text-sm">+251 118 69 78 80</p>
              </div>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
