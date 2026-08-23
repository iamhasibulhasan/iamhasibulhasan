export const profile = {
  name: "Md. Hasibul Hasan",
  title: "Software Engineer",
  tagline: "I build scalable, reliable software with .NET Core — from microservices to enterprise systems.",
  summary:
    "Software Engineer with 4.5+ years of experience building scalable software solutions. Specialized in .NET Core and Entity Framework Core, with strong problem-solving, leadership, teamwork, and stakeholder collaboration skills.",
  location: "Dhaka, Bangladesh",
  email: "mdhasibulhasan.dev@gmail.com",
  phone: "+88 01747979703",
  cvUrl: "/Md_Hasibul_Hasan_CV.pdf",
  // Drop a portrait photo into public/profile.png and it will automatically replace the placeholder
  // in the sidebar card with the correct full-bleed, grayscale, high-contrast treatment.
  // PNG (not JPG) so the transparent background stays transparent against the card's black backdrop.
  photoUrl: "/profile.png",
  socials: [
    { label: "GitHub", href: "https://github.com/iamhasibulhasan", handle: "iamhasibulhasan" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/iam-hasibulhasan/", handle: "iam-hasibulhasan" },
    { label: "NuGet", href: "https://www.nuget.org/profiles/iamhasibulhasan", handle: "iamhasibulhasan" },
    { label: "LeetCode", href: "https://leetcode.com/iamhasibul/", handle: "iamhasibul" },
    { label: "HackerRank", href: "https://www.hackerrank.com/Hasibul", handle: "Hasibul" },
    { label: "Instagram", href: "https://www.instagram.com/iamtheridu/", handle: "iamtheridu" },
    { label: "Facebook", href: "https://www.facebook.com/iamtheridu/", handle: "iamtheridu" },
    { label: "Portfolio", href: "https://abouthasibul.com/", handle: "abouthasibul.com" },
  ],
  stats: [
    { value: "4.5+", label: "Years Experience" },
    { value: "4", label: "Major Projects" },
    { value: "2", label: "Publications" },
  ],
}

export const experience = [
  {
    company: "Cartup Ltd.",
    note: "Concern of US Bangla Group",
    role: "Software Engineer",
    period: "Jul 2023 – Present",
    location: "Dhaka, Bangladesh",
    current: true,
  },
  {
    company: "ERA Infotech Ltd.",
    note: "",
    role: "Trainee Software Engineer",
    period: "Nov 2022 – Jul 2023",
    location: "Dhaka, Bangladesh",
    current: false,
  },
  {
    company: "Mass Data Ltd.",
    note: "",
    role: "Associate Software Engineer",
    period: "Nov 2021 – Nov 2022",
    location: "Dhaka, Bangladesh",
    current: false,
  },
]

export const projects = [
  {
    name: "Cartup",
    period: "Jul 2023 – Present",
    description:
      "A microservice-based e-Commerce application. Built and maintain the Inventory service — the full inventory system of the platform.",
    tags: [".NET Core", "Microservices", "EF Core", "SQL Server"],
  },
  {
    name: "US Bangla Land Asset Purchase & Sale",
    period: "Jul 2023 – Present",
    description: "Platform for land property buying and selling.",
    tags: [".NET Core API", "PostgreSQL", "Tailwind CSS"],
  },
  {
    name: "People Hub",
    period: "Nov 2022 – Jul 2023",
    description:
      "Developed key modules for an HR and Payroll system — Employee Management, Leave Management, Performance Management, and Training — streamlining workforce management processes.",
    tags: [".NET Core MVC", "EF Core", "SQL Server"],
  },
  {
    name: "Enterprise Resource Planning (ERP)",
    period: "Nov 2021 – Nov 2022",
    description:
      "A complete ERP solution for diverse industries — garments, steel, and accessories — with a range of analytical reports.",
    tags: [".NET Core", "RDLC Reports", "SQL"],
  },
]

export const skillGroups = [
  {
    group: "Backend",
    items: [".NET Core", ".NET Core MVC & API", "FastEndpoints", "Minimal API", "Entity Framework Core", "LINQ / Lambda"],
  },
  {
    group: "Data",
    items: ["SQL Server", "PostgreSQL (pgAdmin 4)", "Structured Query Language"],
  },
  {
    group: "Frontend",
    items: ["jQuery / JavaScript", "Bootstrap", "Tailwind CSS", "MUI"],
  },
  {
    group: "Tools",
    items: ["Visual Studio / VS Code", "Git", "RDLC Reports"],
  },
]

export const publications = [
  {
    title: "Simple patronusr implementation in .NET (NuGet)",
    author: "Md. Hasibul Hasan",
    description: "Supports request/response, commands, and queries via C# generic variance.",
    year: "",
    url: "https://www.nuget.org/packages/PatronusR",
  },
  {
    title: "An Expedition to Intelligent Diagnosis of Bone Cancer and Its Direction from Capsule Network",
    author: "Md. Hasibul Hasan",
    description: "Capsule Network achieves 95.26% accuracy in bone cancer classification from MRI and CT images with limited data.",
    year: "2022",
    url: undefined as string | undefined,
  },
]

export const education = [
  {
    school: "American International University-Bangladesh",
    degree: "Bachelor of Science in Computer Science & Engineering",
    period: "2017 – 2021",
    location: "Dhaka, Bangladesh",
    detail: "CGPA: 3.75 / 4.00",
  },
  {
    school: "Ideal College, Dhanmondi",
    degree: "Higher Secondary School Certificate",
    period: "2015",
    location: "Dhaka, Bangladesh",
    detail: "GPA: 5.00 / 5.00",
  },
  {
    school: "Bagoan K.C.V.N High School",
    degree: "Secondary School Certificate",
    period: "2013",
    location: "Kushtia, Bangladesh",
    detail: "GPA: 5.00 / 5.00",
  },
]

export const awards = [{ title: "GPA 5 Award", org: "Ideal College, Dhanmondi" }]

export const certificates = [{ title: "Certified in HTML5, CSS3, JS", org: "Coursera" }]

export const languages = [
  { name: "Bangla", level: "Native / Bilingual" },
  { name: "English", level: "Conversational" },
]
