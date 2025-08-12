import { Users, ShieldCheck, Briefcase, GraduationCap, Building2, Wrench } from 'lucide-react';

export type ServiceItem = {
  title: string;
  description: string;
  icon: any; // lucide-react icon component
};

export const SERVICES: ServiceItem[] = [
  {
    title: 'Manpower Supply',
    description:
      'Professional and non‑professional staffing with a deep candidate network and rigorous vetting.',
    icon: Users,
  },
  {
    title: 'Manpower Outsourcing',
    description:
      'End‑to‑end outsourcing of cleaners, security guards, construction and fleet crews, with supervision.',
    icon: ShieldCheck,
  },
  {
    title: 'Recruitment for Employers',
    description:
      'Targeted hiring campaigns, assessments and onboarding coordination for local and international firms.',
    icon: Briefcase,
  },
  {
    title: 'HR Consultancy',
    description:
      'Policies, org design, compensation reviews, performance systems and compliance advisory.',
    icon: Building2,
  },
  {
    title: 'Training & Development',
    description:
      'Soft skills and technical trainings for security, cleaning, HSE, site operations and customer service.',
    icon: GraduationCap,
  },
  {
    title: 'Project-based Crews',
    description:
      'Rapid mobilization of skilled labor for construction, logistics and facilities management projects.',
    icon: Wrench,
  },
];


