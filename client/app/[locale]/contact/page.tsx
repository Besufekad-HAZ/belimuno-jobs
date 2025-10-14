"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { contactAPI } from "@/lib/api";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/sonner";
import { MessageSquare, User, Mail, Phone, Globe, MapPin } from "lucide-react";

const ContactPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const t = useTranslations("ContactPage");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await contactAPI.submit({ name, email, phone, subject, message });
      toast.success(t("form.status.success"));
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
      setStatus("idle");
    } catch {
      toast.error(t("form.status.error"));
      setStatus("idle");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-4xl font-bold">{t("hero.title")}</h1>
          <p className="text-blue-100 mt-2 max-w-3xl">{t("hero.subtitle")}</p>
        </div>
      </div>

      <section className="relative py-16">
        <div className="absolute inset-0">
          <div className="mx-auto h-full max-w-6xl rounded-[3rem] bg-gradient-to-br from-cyan-100/40 via-transparent to-blue-100/40 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="relative overflow-hidden border-0 bg-white/90 shadow-2xl ring-1 ring-cyan-100/60 backdrop-blur supports-[backdrop-filter]:bg-white/75">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-50 via-transparent to-blue-100" />
            <div className="relative">
              <div className="flex flex-col gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-lg shadow-cyan-500/40">
                    <MessageSquare className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {t("form.title")}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {t("form.subtitle")}
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label={t("form.fields.name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="rounded-xl border-transparent bg-white/80 shadow-inner focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/80"
                  />
                  <Input
                    label={t("form.fields.email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl border-transparent bg-white/80 shadow-inner focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/80"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    label={t("form.fields.phone")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl border-transparent bg-white/80 shadow-inner focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/80"
                  />
                  <Input
                    label={t("form.fields.subject")}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="rounded-xl border-transparent bg-white/80 shadow-inner focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t("form.fields.message")}
                  </label>
                  <div className="relative">
                    <textarea
                      className="w-full rounded-2xl border border-transparent bg-white/80 px-4 py-3 text-gray-900 shadow-inner transition duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/80"
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-2xl bg-gradient-to-t from-cyan-100/40 to-transparent"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="submit"
                    size="lg"
                    loading={status === "sending"}
                    className="w-full sm:w-auto shadow-lg shadow-cyan-500/30"
                  >
                    {status === "sending"
                      ? t("form.button.sending")
                      : t("form.button.send")}
                  </Button>
                  <p className="text-sm text-slate-500">{t("form.helper")}</p>
                </div>
              </form>
            </div>
          </Card>
          <div className="space-y-6">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-800 via-blue-700 to-cyan-600 text-white shadow-xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent)] opacity-80" />
              <div className="relative">
                <h2 className="text-2xl font-semibold mb-4">
                  {t("office.title")}
                </h2>
                <p className="text-blue-50 leading-relaxed">
                  {t("office.address")}
                </p>
                <div className="mt-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
                      <Mail className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                        {t("office.contact.email")}
                      </p>
                      <a
                        href="mailto:info@belimunojobs.com"
                        className="text-base font-medium text-white/90 hover:text-white"
                      >
                        info@belimunojobs.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
                      <Globe className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                        {t("office.contact.website")}
                      </p>
                      <a
                        href="https://www.belimunojobs.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-medium text-white/90 hover:text-white"
                      >
                        www.belimunojobs.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
                      <User className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                        {t("office.contact.pobox")}
                      </p>
                      <p className="text-base font-medium text-white/90">
                        100144, Addis Ababa
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
                      <Phone className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                        {t("office.contact.phone")}
                      </p>
                      <div className="mt-2 grid grid-cols-1 gap-2 text-base font-medium text-white/90">
                        {[
                          "+251 930 014 332",
                          "+251 978 009 084",
                          "+251 935 402 673",
                          "+251 913 064 948",
                        ].map((phoneNumber) => (
                          <a
                            key={phoneNumber}
                            href={`tel:${phoneNumber.replace(/\s/g, "")}`}
                            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm transition hover:bg-white/20"
                          >
                            <Phone className="h-4 w-4 opacity-80" />
                            <span>{phoneNumber}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="relative overflow-hidden border-0 bg-white/90 shadow-xl ring-1 ring-cyan-100/60 backdrop-blur supports-[backdrop-filter]:bg-white/75">
              <div className="relative">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {t("office.map.title")}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {t("office.map.subtitle")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 overflow-hidden rounded-2xl border border-cyan-100 shadow-inner">
                  <iframe
                    title="Belimuno Human Resource Outsourcing Solution"
                    src="https://maps.google.com/maps?q=Belimuno%20Human%20Resource%20Outsourcing%20Solution%2C%20Djibuti%20St%2C%20Addis%20Ababa&z=16&output=embed"
                    loading="lazy"
                    className="h-72 w-full border-0"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
