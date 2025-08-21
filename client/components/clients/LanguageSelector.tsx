"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const locale = useLocale();
  const router = useRouter();

  // Map language codes to their full names
  const languages = {
    en: "English",
    am: "Amharic",
    om: "Oromo",
    ti: "Tigrinya",
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    router.push(`/${newLocale}`);
  };

  return (
    <div className="relative">
      <div
        className="flex items-center bg-[#fff] text-[#6B6B6B] px-2 py-1 rounded-lg cursor-pointer"
        onClick={toggleDropdown}
      >
        <span>{languages[locale as keyof typeof languages]}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="ml-2 h-[18px] w-[18px] border rounded-full"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {isOpen && (
        <ul className="absolute mt-2 w-[100px] bg-gray-800 text-white rounded-lg shadow-lg">
          {Object.entries(languages).map(([code, name]) => (
            <li
              key={code}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => handleLanguageChange(code)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
