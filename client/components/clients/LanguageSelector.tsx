"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();
  const router = useRouter();

  const languages = {
    en: "English",
    am: "አማርኛ",
    om: "Oromoo",
    ti: "ትግሪኛ",
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    router.push(`/${newLocale}`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center bg-white text-cyan-700 px-2 py-1 rounded-lg cursor-pointer"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="language-menu"
      >
        <span>{languages[locale as keyof typeof languages]}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="ml-2 h-[18px] w-[18px] border rounded-full"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          id="language-menu"
          role="listbox"
          tabIndex={-1}
          className="absolute right-0 mt-2 z-50 min-w-[160px] overflow-hidden rounded-lg bg-blue-900/95 text-white shadow-lg ring-1 ring-white/10 border border-blue-300/20 backdrop-blur-sm divide-y divide-white/10"
        >
          {Object.entries(languages).map(([code, name]) => (
            <li
              key={code}
              role="option"
              tabIndex={0}
              aria-selected={locale === code}
              className="px-4 py-2 hover:bg-white/10 focus:bg-white/10 cursor-pointer focus:outline-none"
              onClick={() => handleLanguageChange(code)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                handleLanguageChange(code)
              }
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
