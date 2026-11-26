import type { CaseStudySlug } from "@/data/case-studies";

/**
 * Everything the site says about Hasibul, in one place. Drafted from his
 * résumé: nothing here goes beyond what it states.
 */
export const personalInfo = {
  /** The name as the site and search results show it; the hero splits it around the guide. */
  name: "Hasibul Hasan",
  fullName: "Md. Hasibul Hasan",
  role: "Software Engineer",
  tagline: "I build scalable, reliable software with .NET Core, from microservices to enterprise systems.",
  focus: "Open to Software Engineer roles building .NET Core services, APIs and enterprise systems.",
  location: "Dhaka, Bangladesh",
  email: "mdhasibulhasan.dev@gmail.com",
  phone: "+88 01747979703",
  linkedin: "https://www.linkedin.com/in/iam-hasibulhasan/",
  github: "https://github.com/iamhasibulhasan",
  nuget: "https://www.nuget.org/profiles/iamhasibulhasan",
  leetcode: "https://leetcode.com/iamhasibul/",
  hackerrank: "https://www.hackerrank.com/Hasibul",
  resumeUrl: "/Md_Hasibul_Hasan_CV.pdf",
  photoUrl: "/profile.png",
};

/** `href` points each number at the part of the site that backs it. */
export const stats = [
  // `short`: the label in the phone hero's one-row strip (two lines at most in ~70px).
  { value: 4.5, suffix: "+", label: "Years experience", short: "Years", href: "#experience" },
  { value: 4, suffix: "", label: "Major projects", short: "Projects", href: "/work" },
  { value: 2, suffix: "", label: "Publications", short: "Publications", href: "#about" },
  { value: 3, suffix: "", label: "Companies", short: "Companies", href: "#experience" },
];

export interface Highlight {
  /** The figure or name, shown large. */
  metric: string;
  /** What it counts. */
  label: string;
  /** One sentence of supporting detail. */
  detail: string;
}

export const about = {
  summary:
    "Software Engineer with 4.5+ years of experience building scalable software solutions. I specialise in .NET Core and Entity Framework Core, and I bring strong problem-solving, leadership, teamwork and stakeholder collaboration to every project. Based in Dhaka, Bangladesh.",
  highlights: [
    {
      metric: "4.5+",
      label: "Years building software",
      detail: "Across three companies since 2021, from associate engineer to software engineer, working in .NET Core and Entity Framework Core.",
    },
    {
      metric: "Inventory",
      label: "Service owned at Cartup",
      detail: "Built and maintains the Inventory service, the full inventory system of Cartup's microservice-based e-commerce platform.",
    },
    {
      metric: "PatronusR",
      label: "Open source on NuGet",
      detail: "A .NET library for request/response, commands and queries, built on C# generic variance.",
    },
    {
      metric: "95.26%",
      label: "Classification accuracy",
      detail: "Published research: a Capsule Network classifying bone cancer from MRI and CT images with limited data reached 95.26% accuracy.",
    },
  ] satisfies Highlight[],
};

export const recognition = {
  title: "Published research in medical imaging",
  detail:
    "“An Expedition to Intelligent Diagnosis of Bone Cancer and Its Direction from Capsule Network” (2022), by Md. Hasibul Hasan.",
  reason:
    "The study applied a Capsule Network to bone cancer classification from MRI and CT images. With limited data, it reached 95.26% accuracy.",
};

export const certificates = [{ title: "Certified in HTML5, CSS3, JS", org: "Coursera" }];

export const languages = [
  { name: "Bangla", level: "Native / Bilingual" },
  { name: "English", level: "Conversational" },
];

/** A bullet is plain text, or text paired with the case study that backs it. */
export type ExperienceBullet = string | { text: string; study: CaseStudySlug };

/** Reads the display text regardless of which bullet shape it is. */
export function bulletText(bullet: ExperienceBullet): string {
  return typeof bullet === "string" ? bullet : bullet.text;
}

/** The case-study slug a bullet links to, if it has one. */
export function bulletStudySlug(bullet: ExperienceBullet): CaseStudySlug | undefined {
  return typeof bullet === "string" ? undefined : bullet.study;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  type: "work" | "education";
  summary: string;
  bullets: ExperienceBullet[];
}

/** Oldest first: the timeline tells the story in order, ending at the current role. */
export const experiences: Experience[] = [
  {
    company: "Bagoan K.C.V.N High School, Kushtia",
    role: "Secondary School Certificate",
    period: "2013",
    type: "education",
    summary: "",
    bullets: [],
  },
  {
    company: "Ideal College, Dhanmondi",
    role: "Higher Secondary Certificate",
    period: "2015",
    type: "education",
    summary: "",
    bullets: [],
  },
  {
    company: "American International University-Bangladesh",
    role: "BSc in Computer Science & Engineering",
    period: "2017 – 2021",
    type: "education",
    summary: "Published research on bone cancer diagnosis with Capsule Networks.",
    bullets: [],
  },
  {
    company: "Mass Data Ltd.",
    role: "Associate Software Engineer",
    period: "Nov 2021 – Nov 2022",
    type: "work",
    summary: "Worked on a complete ERP solution for diverse industries.",
    bullets: [
      {
        text: "Worked on an ERP for garments, steel and accessories businesses, with a range of analytical reports in RDLC.",
        study: "erp-system",
      },
    ],
  },
  {
    company: "ERA Infotech Ltd.",
    role: "Trainee Software Engineer",
    period: "Nov 2022 – Jul 2023",
    type: "work",
    summary: "Developed key modules of People Hub, an HR and payroll system.",
    bullets: [
      {
        text: "Developed the Employee, Leave, Performance and Training management modules, streamlining workforce management processes.",
        study: "people-hub",
      },
    ],
  },
  {
    company: "Cartup Ltd. (a concern of US Bangla Group)",
    role: "Software Engineer",
    period: "Jul 2023 – Present",
    type: "work",
    summary: "Building and maintaining backend systems for a microservice-based e-commerce platform and a land property platform.",
    bullets: [
      {
        text: "Built and maintain the Inventory service, the full inventory system of the Cartup e-commerce platform, on .NET Core, EF Core and SQL Server.",
        study: "cartup-inventory",
      },
      {
        text: "Working on a platform for buying and selling land property, with a .NET Core API, PostgreSQL and Tailwind CSS.",
        study: "us-bangla-land-platform",
      },
    ],
  },
];

export interface Project {
  slug: string;
  /** Featured projects get a full card in the stacked deck; the rest render in the compact list. */
  featured?: boolean;
  title: string;
  category: string;
  summary: string;
  /** What came of it; omitted when the résumé doesn't say. */
  impact?: string;
  role?: string;
  timeline?: string;
  tech: string[];
  /** Screenshots, 16:10. Only projects with real ones get a card in the deck. */
  images: string[];
  github?: string;
  live?: string;
  /** The case study that covers this project, if one does. */
  study?: CaseStudySlug;
}

const shots = (slug: string, ...names: string[]) => names.map((name) => `/images/projects/${slug}/${name}.jpg`);

/**
 * Featured projects (real screenshots, a live link) make the stacked deck;
 * the rest are compact tiles. Screenshots of the live sites, captured Nov 2026.
 */
export const projects: Project[] = [
  {
    slug: "cartup",
    featured: true,
    title: "Cartup",
    category: "Microservice e-commerce",
    summary:
      "An online marketplace in Bangladesh, built as microservices. Built and maintains the Inventory service, the full inventory system of the platform.",
    role: "Inventory service: built and maintained",
    timeline: "Jul 2023 – Present",
    tech: [".NET Core", "Microservices", "EF Core", "SQL Server"],
    // The live storefront. The Inventory service runs behind it.
    images: shots("cartup", "home", "category", "product"),
    live: "https://cartup.com",
    study: "cartup-inventory",
  },
  {
    slug: "renvoice",
    featured: true,
    title: "Renvoice",
    category: "Invoicing SaaS · Renosia Tech",
    summary:
      "Branded invoices, ready in minutes: seven professional layouts, your own logo, brand colour and fonts, and invoices, quotes, receipts and credit notes as clean A4 PDFs. A public demo lets anyone design; saving and downloading come with a subscription.",
    tech: ["React", "Vite", "PDF export"],
    images: shots("renvoice", "editor", "layout", "landing"),
    live: "https://invoice.renosiatech.com",
  },
  {
    slug: "renosia-admin",
    featured: true,
    title: "Renosia Admin",
    category: "Admin dashboard suite · Renosia Tech",
    summary:
      "A customisable admin suite with 60+ pages: analytics, finance and sales dashboards, e-commerce, chat, email, calendar, invoices and every auth screen, with live theming, motion controls and its own documentation.",
    tech: ["React", "Vite", "Theming"],
    images: shots("renosia-admin", "analytics", "sales", "products"),
    live: "https://reno-admin.renosiatech.com",
  },
  {
    slug: "orbivo",
    featured: true,
    title: "Orbivo",
    category: "SaaS & IT website · Renosia Tech",
    summary:
      "A multi-page site for a software, SaaS and IT company: hero, features, process, pricing, portfolio, blog and contact, with a dark mode.",
    tech: ["React", "Vite"],
    images: shots("orbivo", "hero", "pricing", "features"),
    live: "https://orbivo.renosiatech.com",
  },
  {
    slug: "renosia-tech",
    featured: true,
    title: "Renosia Tech",
    category: "Company website",
    summary:
      "The site of Renosia Tech, a software firm building custom AI software, LLM integrations and chatbots, plus websites and apps with .NET, React and WordPress.",
    tech: ["React", "Vite"],
    images: shots("renosia-tech", "home", "services"),
    live: "https://renosiatech.com",
  },
  {
    slug: "us-bangla-land",
    title: "US Bangla Land Asset Purchase & Sale",
    category: "Property platform",
    summary: "A platform for buying and selling land property, on a .NET Core API with PostgreSQL.",
    timeline: "Jul 2023 – Present",
    tech: [".NET Core API", "PostgreSQL", "Tailwind CSS"],
    images: [],
    study: "us-bangla-land-platform",
  },
  {
    slug: "people-hub",
    title: "People Hub",
    category: "HR & payroll",
    summary: "Employee, Leave, Performance and Training modules of an HR and payroll system.",
    role: "Developed four key modules",
    timeline: "Nov 2022 – Jul 2023",
    tech: [".NET Core MVC", "EF Core", "SQL Server"],
    images: [],
    study: "people-hub",
  },
  {
    slug: "erp",
    title: "Enterprise Resource Planning (ERP)",
    category: "Enterprise ERP",
    summary: "A complete ERP for garments, steel and accessories businesses, with a range of analytical reports.",
    timeline: "Nov 2021 – Nov 2022",
    tech: [".NET Core", "RDLC Reports", "SQL"],
    images: [],
    study: "erp-system",
  },
  {
    slug: "patronusr",
    title: "PatronusR",
    category: "Open-source .NET library",
    summary: "A simple mediator implementation for .NET, published on NuGet. Supports request/response, commands and queries via C# generic variance.",
    tech: [".NET", "C#", "NuGet"],
    images: [],
    live: "https://www.nuget.org/packages/PatronusR",
  },
  {
    slug: "bone-cancer-capsnet",
    title: "Bone cancer diagnosis with Capsule Networks",
    category: "Research publication (2022)",
    summary: "A Capsule Network that classifies bone cancer from MRI and CT images with limited data, reaching 95.26% accuracy.",
    tech: ["Capsule Network", "Deep learning", "Medical imaging"],
    images: [],
  },
];

export const skillCategories = [
  {
    title: "Backend & APIs",
    description: "The .NET stack I build services, APIs and enterprise systems with.",
    skills: [".NET Core", "C#", ".NET Core MVC & API", "FastEndpoints", "Minimal API", "Entity Framework Core", "LINQ / Lambda", "Microservices", "Clean Architecture", "REST APIs"],
  },
  {
    title: "Data",
    description: "The databases behind the systems I've built and maintain.",
    skills: ["SQL Server", "PostgreSQL", "SQL", "pgAdmin 4"],
  },
  {
    title: "Frontend",
    description: "What I use when a system needs a user interface on top.",
    skills: ["JavaScript", "jQuery", "React", "Bootstrap", "Tailwind CSS", "MUI"],
  },
  {
    title: "Tools & reporting",
    description: "Day-to-day tooling, and the reporting I deliver business data in.",
    skills: ["Visual Studio", "VS Code", "Git", "RDLC Reports"],
  },
];

/**
 * Where each skill is shown in use: the case study a skill chip links to.
 * Only skills with real evidence on the site appear; the rest stay plain text.
 */
const study = (slug: CaseStudySlug, label: string) => ({ href: `/work/${slug}`, label });
export const skillEvidence: Record<string, { href: string; label: string }> = {
  ".NET Core": study("cartup-inventory", "Cartup Inventory Service"),
  Microservices: study("cartup-inventory", "Cartup Inventory Service"),
  "SQL Server": study("cartup-inventory", "Cartup Inventory Service"),
  "Entity Framework Core": study("people-hub", "People Hub"),
  ".NET Core MVC & API": study("people-hub", "People Hub"),
  PostgreSQL: study("us-bangla-land-platform", "US Bangla Land Asset Platform"),
  "Tailwind CSS": study("us-bangla-land-platform", "US Bangla Land Asset Platform"),
  "RDLC Reports": study("erp-system", "ERP"),
};
