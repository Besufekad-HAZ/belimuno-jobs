"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Quote, Star } from "lucide-react";

import Card from "@/components/ui/Card";
import { testimonials } from "@/data/testimonials";

const SLIDE_INTERVAL = 6500;

function resolveSlidesPerView(width: number, totalItems: number) {
  if (width >= 1280) {
    return Math.min(3, totalItems);
  }
  if (width >= 768) {
    return Math.min(2, totalItems);
  }
  return 1;
}

export default function TestimonialsSection() {
  const t = useTranslations("Home.testimonials");
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  // Arrow mode allows switching between conventional (left=previous, right=next)
  // and inverted (right=previous, left=next) without rewriting button logic.
  // If the user later requests the earlier unconventional mapping, set to 'inverted'.
  const ARROW_MODE: "standard" | "inverted" = "standard";

  useEffect(() => {
    const updateSlidesPerView = () => {
      const width = typeof window !== "undefined" ? window.innerWidth : 0;
      setSlidesPerView(resolveSlidesPerView(width, testimonials.length));
    };

    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);

    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  const groupedTestimonials = useMemo(() => {
    const groups: (typeof testimonials)[] = [];
    const size = Math.max(1, slidesPerView);

    for (let i = 0; i < testimonials.length; i += size) {
      groups.push(testimonials.slice(i, i + size));
    }

    return groups;
  }, [slidesPerView]);

  useEffect(() => {
    setActiveSlide(0);
  }, [slidesPerView]);

  useEffect(() => {
    if (groupedTestimonials.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % groupedTestimonials.length);
    }, SLIDE_INTERVAL);

    return () => clearInterval(timer);
  }, [groupedTestimonials.length]);

  const handlePrev = () => {
    setActiveSlide((prev) =>
      prev === 0 ? groupedTestimonials.length - 1 : prev - 1,
    );
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % groupedTestimonials.length);
  };

  const handleDotClick = (index: number) => {
    setActiveSlide(index);
  };

  if (groupedTestimonials.length === 0) {
    return null;
  }

  const metricsText = t.rich("metrics", {
    count: (chunks) => (
      <span className="font-semibold text-blue-600">{chunks}</span>
    ),
    total: testimonials.length.toString(),
  });

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/60 to-cyan-50 py-20">
      <div
        className="pointer-events-none absolute -left-20 top-24 h-56 w-56 rounded-full bg-gradient-to-br from-blue-300/40 via-cyan-300/40 to-blue-200/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-gradient-to-br from-orange-300/30 via-rose-300/30 to-yellow-200/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-blue-100/70 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-blue-700 shadow-sm">
            {t("eyebrow")}
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-tight text-gray-900 sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="relative">
          {(() => {
            // Determine icon paths and handlers based on ARROW_MODE
            const leftIsPrev = ARROW_MODE === "standard";
            const prevHandler = handlePrev;
            const nextHandler = handleNext;
            const leftButtonHandler = leftIsPrev ? prevHandler : nextHandler;
            const rightButtonHandler = leftIsPrev ? nextHandler : prevHandler;
            const leftIconPath = leftIsPrev
              ? "M15.75 19.5L8.25 12l7.5-7.5" // left arrow
              : "M8.25 4.5l7.5 7.5-7.5 7.5"; // right arrow
            const rightIconPath = leftIsPrev
              ? "M8.25 4.5l7.5 7.5-7.5 7.5" // right arrow
              : "M15.75 19.5L8.25 12l7.5-7.5"; // left arrow
            const leftAria = leftIsPrev
              ? t("controls.previous")
              : t("controls.next");
            const rightAria = leftIsPrev
              ? t("controls.next")
              : t("controls.previous");
            return (
              <>
                <button
                  type="button"
                  onClick={leftButtonHandler}
                  className="absolute left-0 top-1/2 hidden -translate-y-1/2 transform rounded-full border border-blue-200 bg-white/80 p-3 text-blue-700 shadow-lg shadow-blue-200/40 transition hover:-translate-y-1/2 hover:-translate-x-0.5 hover:bg-blue-600 hover:text-white md:flex"
                  aria-label={leftAria}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={leftIconPath}
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={rightButtonHandler}
                  className="absolute right-0 top-1/2 hidden -translate-y-1/2 transform rounded-full border border-blue-200 bg-white/80 p-3 text-blue-700 shadow-lg shadow-blue-200/40 transition hover:-translate-y-1/2 hover:translate-x-0.5 hover:bg-blue-600 hover:text-white md:flex"
                  aria-label={rightAria}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    fill="none"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={rightIconPath}
                    />
                  </svg>
                </button>
              </>
            );
          })()}

          <div className="overflow-hidden px-1 md:px-12">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {groupedTestimonials.map((group, groupIndex) => (
                <div
                  key={`group-${groupIndex}`}
                  className="w-full flex-shrink-0 px-1"
                >
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {group.map((testimonial, cardIndex) => (
                      <div
                        key={testimonial.id}
                        className="testimonial-card h-full"
                        style={{ animationDelay: `${cardIndex * 120}ms` }}
                      >
                        <Card
                          padding="lg"
                          className="relative flex h-full flex-col justify-between overflow-hidden border border-blue-100/70 bg-white/80 backdrop-blur-sm shadow-xl shadow-blue-200/40 transition-transform duration-500 hover:-translate-y-1 hover:shadow-2xl"
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />
                          <Quote className="absolute right-6 top-6 h-10 w-10 text-blue-100" />

                          <div>
                            <p className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                              {testimonial.highlight}
                            </p>
                            <p className="mt-4 text-lg leading-relaxed text-gray-600">
                              &ldquo;{testimonial.quote}&rdquo;
                            </p>
                          </div>

                          <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={clsx(
                                  "relative flex items-center justify-center rounded-full bg-gradient-to-br shadow-inner shadow-blue-900/20 ring-4 ring-white/80",
                                  testimonial.avatarGradient,
                                )}
                                style={{ width: "3.9rem", height: "3rem" }}
                              >
                                <span
                                  className="block text-white font-semibold text-xl md:text-2xl select-none"
                                  style={{
                                    lineHeight: "1",
                                    letterSpacing: "-0.02em",
                                  }}
                                >
                                  {testimonial.initials}
                                </span>
                              </div>
                              <div>
                                <p className="text-lg font-semibold text-gray-900">
                                  {testimonial.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {testimonial.role} &middot;{" "}
                                  {testimonial.company}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={clsx(
                                    "h-4 w-4",
                                    index < testimonial.rating
                                      ? "text-yellow-400 drop-shadow-sm"
                                      : "text-slate-200",
                                  )}
                                  fill={
                                    index < testimonial.rating
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-6">
          <p className="text-sm text-gray-500">{metricsText}</p>
          <div className="flex items-center gap-3">
            {(() => {
              const leftIsPrev = ARROW_MODE === "standard";
              const prevHandler = handlePrev;
              const nextHandler = handleNext;
              const firstBtnHandler = leftIsPrev ? prevHandler : nextHandler; // left side on mobile stack
              const secondBtnHandler = leftIsPrev ? nextHandler : prevHandler;
              const firstIcon = leftIsPrev
                ? "M15.75 19.5L8.25 12l7.5-7.5"
                : "M8.25 4.5l7.5 7.5-7.5 7.5";
              const secondIcon = leftIsPrev
                ? "M8.25 4.5l7.5 7.5-7.5 7.5"
                : "M15.75 19.5L8.25 12l7.5-7.5";
              const firstAria = leftIsPrev
                ? t("controls.previous")
                : t("controls.next");
              const secondAria = leftIsPrev
                ? t("controls.next")
                : t("controls.previous");
              return (
                <>
                  <button
                    type="button"
                    onClick={firstBtnHandler}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-white/80 text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white md:hidden"
                    aria-label={firstAria}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      fill="none"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={firstIcon}
                      />
                    </svg>
                  </button>
                  {/* Dots remain in the middle */}
                  <div className="flex items-center gap-2">
                    {groupedTestimonials.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        type="button"
                        onClick={() => handleDotClick(index)}
                        className={clsx(
                          "h-2.5 rounded-full transition-all duration-500 ease-out",
                          index === activeSlide
                            ? "w-10 bg-blue-600"
                            : "w-3 bg-blue-200 hover:bg-blue-300",
                        )}
                        aria-label={t("controls.goTo", { index: index + 1 })}
                        aria-pressed={index === activeSlide}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={secondBtnHandler}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-200 bg-white/80 text-blue-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white md:hidden"
                    aria-label={secondAria}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      fill="none"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={secondIcon}
                      />
                    </svg>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}
