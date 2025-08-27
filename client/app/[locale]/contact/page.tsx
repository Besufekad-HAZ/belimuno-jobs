"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { contactAPI } from "@/lib/api";
import { useTranslations } from "next-intl";

const ContactPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const t = useTranslations("ContactPage");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await contactAPI.submit({ name, email, phone, subject, message });
      setStatus("sent");
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus("error");
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

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("form.title")}
            </h2>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("form.fields.name")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label={t("form.fields.email")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Input
                label={t("form.fields.phone")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label={t("form.fields.subject")}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("form.fields.message")}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending"
                    ? t("form.button.sending")
                    : t("form.button.send")}
                </Button>
                {status === "sent" && (
                  <span className="text-green-600 text-sm">
                    {t("form.status.success")}
                  </span>
                )}
                {status === "error" && (
                  <span className="text-red-600 text-sm">
                    {t("form.status.error")}
                  </span>
                )}
              </div>
            </form>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("office.title")}
            </h2>
            <p className="text-gray-700">{t("office.address")}</p>
            <div className="mt-4 text-gray-700 space-y-1">
              <p>{t("office.contact.email")}: info@belimunojobs.com</p>
              <p>{t("office.contact.phone")}: +251 0118 69 78 80</p>
              <p>{t("office.contact.pobox")}: 100144, Addis Ababa</p>
              <p>{t("office.contact.website")}: www.belimunojobs.com</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
