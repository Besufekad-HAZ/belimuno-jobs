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

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-1 bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-3">Belimuno Jobs</h3>
          <p className="text-blue-100 text-sm leading-6">
            HR outsourcing and recruiting partner connecting talent with
            opportunities across Ethiopia since 2011. We help businesses scale
            with flexible, high-quality workforce solutions.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-blue-100 text-sm">
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link href="/jobs" className="hover:text-white">
                Jobs
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-blue-100 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5" /> Addis Ababa, Ethiopia
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a
                href="tel:+251118697880"
                className="hover:text-white transition-colors"
              >
                +251 0118 69 78 80
              </a>
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
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Follow Us</h4>
          <div className="flex items-center gap-3 text-blue-100">
            <a href="#" className="hover:text-white" aria-label="Facebook">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-white" aria-label="LinkedIn">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="hover:text-white" aria-label="Twitter">
              <Twitter className="h-5 w-5" />
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
