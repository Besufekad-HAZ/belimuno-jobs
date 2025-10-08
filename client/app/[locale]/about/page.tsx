"use client";

import React from "react";
import {
  Users,
  Target,
  Eye,
  Heart,
  Award,
  Mail,
  Send,
  Phone,
  Briefcase,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { DEFAULT_TEAM_MEMBERS } from "@/data/defaultTeamMembers";

const getInitials = (name: string) => {
  return (
    name
      .replace(/\([^)]*\)/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || name.slice(0, 2).toUpperCase()
  );
};

const AboutPage: React.FC = () => {
  const t = useTranslations("AboutPage");

  const teamMembers = DEFAULT_TEAM_MEMBERS;

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
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white">
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
            <div className="w-24 h-1 bg-gradient-primary mx-auto"></div>
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
            <div className="w-24 h-1 bg-gradient-primary mx-auto"></div>
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
      <section className="relative py-24 bg-gradient-to-br from-white via-blue-50/40 to-cyan-50 text-slate-900 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-[22rem] w-[22rem] rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/40" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 flex max-w-4xl flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-1 text-lg font-semibold uppercase tracking-wide text-cyan-700 shadow-lg shadow-cyan-500/15">
              <Users className="h-3.5 w-3.5" />
              {t("team.title")}
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              {t("team.heading")}
            </h2>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              {t("team.lede")}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-cyan-700/80 lg:text-sm">
              {[
                "Administration & Finance",
                "Human Resources",
                "Outsourced Services",
                "Project Delivery",
              ].map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-cyan-100 bg-white px-4 py-1 tracking-[0.18em] uppercase text-cyan-700 shadow-sm"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {(() => {
            const [executiveLead, ...coreTeam] = teamMembers;
            return (
              <>
                {executiveLead && (
                  <div className="relative mb-20 overflow-hidden rounded-[2.5rem] border border-cyan-200 bg-white/90 p-8 md:p-12 backdrop-blur-xl shadow-[0_30px_120px_rgba(136,192,255,0.18)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-transparent to-blue-100" />
                    <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
                      <div className="relative mx-auto mt-4 md:mt-0 md:mx-0">
                        <div className="absolute inset-0 h-40 w-40 rounded-full bg-cyan-300/40 blur-2xl" />
                        {executiveLead.image ? (
                          <div className="relative h-36 w-36 overflow-hidden rounded-full ring-2 ring-cyan-200/70 ring-offset-4 ring-offset-white shadow-xl">
                            <Image
                              src={executiveLead.image}
                              alt={executiveLead.name}
                              fill
                              sizes="128px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="relative h-36 w-36 rounded-full bg-gradient-to-br from-cyan-100 via-blue-100 to-indigo-200 ring-2 ring-cyan-200/70 ring-offset-4 ring-offset-white shadow-xl">
                            <span className="absolute inset-0 flex items-center justify-center text-4xl font-semibold tracking-wide text-slate-800">
                              {getInitials(executiveLead.name)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-center md:text-left">
                        <Badge className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-100/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800">
                          {executiveLead.department}
                        </Badge>
                        <h3 className="mt-4 text-3xl font-semibold text-slate-900">
                          {executiveLead.role}
                        </h3>
                        <p className="mt-2 text-lg font-medium text-slate-700">
                          {executiveLead.name}
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm md:justify-start">
                          {[
                            "Strategic growth",
                            "People-first leadership",
                            "Operational excellence",
                          ].map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-cyan-100 bg-white px-4 py-1 text-cyan-800 shadow-sm"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {coreTeam.map((member, index) => (
                    <div
                      key={`${member.role}-${index}`}
                      className="group relative overflow-hidden rounded-3xl border border-cyan-100 bg-white/80 p-6 backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:border-cyan-300 hover:bg-white shadow-[0_20px_60px_rgba(15,98,254,0.12)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-transparent to-blue-100 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <div className="relative flex flex-col items-center text-center">
                        <div className="relative mb-6 mt-4">
                          <div className="absolute -inset-3 rounded-full bg-cyan-200/40 blur-lg opacity-0 transition-opacity duration-500 group-hover:opacity-70" />
                          {member.image ? (
                            <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-cyan-200/70">
                              <Image
                                src={member.image}
                                alt={member.name}
                                fill
                                sizes="128px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 via-blue-100 to-indigo-200 ring-2 ring-cyan-200/70">
                              <span className="text-3xl font-semibold tracking-normal text-slate-800">
                                {getInitials(member.name)}
                              </span>
                            </div>
                          )}
                        </div>
                        <Badge className="mt-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-cyan-700">
                          {member.department}
                        </Badge>
                        <h4 className="mt-4 text-xl font-semibold text-slate-900">
                          {member.name}
                        </h4>
                        <p className="mt-1 text-sm font-medium uppercase tracking-[0.15em] text-slate-500">
                          {member.role}
                        </p>
                        <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
                        <p className="mt-4 text-sm text-slate-600">
                          Building resilient teams and unforgettable client
                          experiences.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
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
              <Button variant="secondary" size="lg" className="px-8">
                <Users className="h-5 w-5" /> {t("clients.viewButton")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-50 via-white to-cyan-50 text-gray-900 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-gray-600 font-medium mb-10 leading-relaxed max-w-3xl mx-auto">
            {t("cta.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link href="/contact">
              <Button variant="primary" size="lg" className="px-8">
                <Mail className="h-5 w-5" /> {t("cta.buttons.contact")}
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" size="lg" className="px-8">
                <Briefcase className="h-5 w-5" /> {t("cta.buttons.jobs")}
              </Button>
            </Link>
          </div>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <a
              href="mailto:info@belimunojobs.com"
              className="flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 group"
              aria-label="Email Belimuno Jobs"
            >
              <div className="w-10 h-10 bg-blue-50 text-blue-700 border border-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  {t("cta.contact.email.title")}
                </p>
                <p className="text-gray-600 text-sm">info@belimunojobs.com</p>
              </div>
            </a>

            <a
              href="https://t.me/belimunojobs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 group"
              aria-label="Open Belimuno Jobs Telegram"
            >
              <div className="w-10 h-10 bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Send className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  {t("cta.contact.telegram.title")}
                </p>
                <p className="text-gray-600 text-sm">@belimunojobs</p>
              </div>
            </a>

            <div className="flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-lg p-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Phone className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  {t("cta.contact.phone.title")}
                </p>
                {[
                  "+251 930 014 332",
                  "+251 978 009 084",
                  "+251 935 402 673",
                  "+251 913 064 948",
                ].map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="block rounded hover:bg-slate-50 transition-all duration-200"
                    aria-label={`Call Belimuno Jobs at ${phone}`}
                  >
                    <span className="text-gray-600 text-sm">{phone}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
