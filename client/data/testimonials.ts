export type Testimonial = {
  id: number;
  name: string;
  role: string;
  company: string;
  quote: string;
  highlight: string;
  rating: number;
  avatarGradient: string;
  initials: string;
};

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Hanna Tesfaye",
    role: "HR Director",
    company: "WFP Ethiopia",
    quote:
      "Belimuno scaled our field teams in weeks, not months. The vetting process and onboarding support have been seamless across every region.",
    highlight: "Cut hiring time by 60%",
    rating: 5,
    avatarGradient: "from-blue-500 via-cyan-500 to-blue-600",
    initials: "HT",
  },
  {
    id: 2,
    name: "Samuel Getachew",
    role: "Operations Lead",
    company: "Kalpataru Group",
    quote:
      "Their workforce management dashboards give us real-time visibility into attendance and compliance. It's transformed how our supervisors work.",
    highlight: "Full visibility in one dashboard",
    rating: 5,
    avatarGradient: "from-sky-500 via-blue-500 to-indigo-500",
    initials: "SG",
  },
  {
    id: 3,
    name: "Lulit Abebe",
    role: "Senior Accountant",
    company: "FHI 360",
    quote:
      "Payments are secure and always on schedule. The Belimuno team is responsive and proactive whenever we need to mobilize new talent.",
    highlight: "Reliable payroll + support",
    rating: 5,
    avatarGradient: "from-purple-500 via-violet-500 to-pink-500",
    initials: "LA",
  },
  {
    id: 4,
    name: "Mikiyas Tadesse",
    role: "Security Supervisor",
    company: "Belimuno Workforce",
    quote:
      "As a worker, I can pick shifts that fit my schedule and get paid without delays. The training and gear we receive are top quality.",
    highlight: "Fair shifts & on-time pay",
    rating: 5,
    avatarGradient: "from-amber-500 via-orange-500 to-rose-500",
    initials: "MT",
  },
  {
    id: 5,
    name: "Rediet Mekonnen",
    role: "Facilities Manager",
    company: "Alem Building Group",
    quote:
      "From cleaners to technical crews, Belimuno delivered consistent, professional staff. Our facility uptime has never been higher.",
    highlight: "Consistency we can trust",
    rating: 5,
    avatarGradient: "from-emerald-500 via-green-500 to-teal-500",
    initials: "RM",
  },
  {
    id: 6,
    name: "Yonas Tsegaye",
    role: "Project Manager",
    company: "Dong Fang Electrics",
    quote:
      "We manage large infrastructure projects across Ethiopia. Belimuno is the only partner able to mobilize crews this quickly and safely.",
    highlight: "Rapid deployment across sites",
    rating: 5,
    avatarGradient: "from-cyan-500 via-blue-500 to-purple-500",
    initials: "YT",
  },
];
