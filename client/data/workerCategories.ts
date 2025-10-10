export type WorkerCategoryDescriptor = {
  label: string;
  keywords: string[];
};

export const WORKER_CATEGORY_DESCRIPTORS: WorkerCategoryDescriptor[] = [
  {
    label: "Technology & Development",
    keywords: [
      "javascript",
      "typescript",
      "react",
      "node",
      "python",
      "django",
      "next",
      "java",
      "c#",
      "php",
      "laravel",
      "sql",
      "nosql",
      "devops",
      "aws",
      "cloud",
      "data",
      "ml",
      "ai",
      "api",
      "fullstack",
      "mobile",
      "flutter",
      "kotlin",
      "swift",
    ],
  },
  {
    label: "Design & Creative",
    keywords: [
      "design",
      "ui",
      "ux",
      "graphic",
      "illustrator",
      "photoshop",
      "figma",
      "branding",
      "logo",
      "creative",
      "animation",
      "video",
    ],
  },
  {
    label: "Marketing & Growth",
    keywords: [
      "marketing",
      "seo",
      "social",
      "campaign",
      "sales",
      "brand",
      "advertising",
      "copy",
      "lead",
      "growth",
      "paid",
    ],
  },
  {
    label: "Writing & Translation",
    keywords: [
      "writing",
      "writer",
      "content",
      "copywriter",
      "editor",
      "proofread",
      "translation",
      "blog",
      "story",
    ],
  },
  {
    label: "Business & Operations",
    keywords: [
      "business",
      "analysis",
      "consult",
      "finance",
      "account",
      "strategy",
      "project",
      "hr",
      "human",
      "operations",
      "management",
    ],
  },
  {
    label: "Construction & Technical Trades",
    keywords: [
      "construction",
      "plumbing",
      "electrical",
      "mechanic",
      "maintenance",
      "welding",
      "repair",
      "carpentry",
      "technician",
    ],
  },
  {
    label: "Logistics & Field Support",
    keywords: [
      "logistics",
      "driver",
      "transport",
      "warehouse",
      "supply",
      "field",
      "support",
      "dispatch",
    ],
  },
  {
    label: "Education & Training",
    keywords: [
      "teach",
      "teacher",
      "tutor",
      "education",
      "trainer",
      "training",
      "curriculum",
      "academic",
    ],
  },
  {
    label: "Healthcare & Wellness",
    keywords: [
      "medical",
      "health",
      "nurse",
      "clinic",
      "care",
      "therapy",
      "wellness",
      "pharma",
    ],
  },
];

export const DEFAULT_WORKER_CATEGORY = "General Talent";

export function classifyWorkerCategory(skills?: string[] | null): string {
  if (!skills || skills.length === 0) {
    return DEFAULT_WORKER_CATEGORY;
  }

  const normalizedSkills = skills.map((skill) => skill.toLowerCase());

  for (const descriptor of WORKER_CATEGORY_DESCRIPTORS) {
    if (
      normalizedSkills.some((skill) =>
        descriptor.keywords.some(
          (keyword) =>
            skill === keyword ||
            skill.includes(keyword) ||
            keyword.includes(skill),
        ),
      )
    ) {
      return descriptor.label;
    }
  }

  return DEFAULT_WORKER_CATEGORY;
}
