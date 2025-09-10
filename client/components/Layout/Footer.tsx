"use client";

import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Facebook,
  Linkedin,
  Twitter,
  Send,
} from "lucide-react";
import { useTranslations } from "next-intl";

const Footer = () => {
  const year = new Date().getFullYear();
  const t = useTranslations("Footer");

  return (
    <footer className="mt-1 bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-3">{t("brand.name")}</h3>
          <p className="text-blue-100 text-sm leading-6">
            {t("brand.description")}
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t("sections.company")}</h4>
          <ul className="space-y-2 text-blue-100 text-sm">
            <li>
              <Link href="/about" className="hover:text-white">
                {t("links.about")}
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                {t("links.services")}
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:text-white">
                {t("links.jobs")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                {t("links.contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t("sections.contact")}</h4>
          <ul className="space-y-2 text-blue-100 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5" /> {t("contact.address")}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a
                href="mailto:info@belimunojobs.com"
                className="hover:text-white transition-colors"
              >
                info@belimunojobs.com
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <a
                href="https://t.me/belimunojobs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                @belimunojobs
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-1" />
              <div className="flex flex-col space-y-1">
                {[
                  "+251 930 014 332",
                  "+251 978 009 084",
                  "+251 935 402 673",
                  "+251 913 064 948",
                ].map((phone) => (
                  <a
                    key={phone}
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="hover:text-white transition-colors"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">{t("sections.followUs")}</h4>
          <div className="flex items-center gap-3 text-blue-100">
            <a
              href="#"
              className="hover:text-white"
              aria-label={t("social.facebook")}
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="hover:text-white"
              aria-label={t("social.linkedin")}
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="hover:text-white"
              aria-label={t("social.twitter")}
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="https://t.me/belimunojobs"
              target="_blank"
              className="hover:text-white"
              aria-label={t("social.telegram")}
            >
              <Send className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-blue-100 text-sm">
          © {year} Belimuno Recruiting Service. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
