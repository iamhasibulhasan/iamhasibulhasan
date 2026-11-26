import type { ComponentType } from "react";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon, WhatsappIcon } from "@/components/BrandIcons";
import { personalInfo } from "@/data/portfolio";

/** The homepage sections, in page order. Used by the navbar and the footer. */
export const SECTION_LINKS = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#work", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
] as const;

const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

type SocialLink = { icon: ComponentType<{ className?: string }>; label: string; value: string; href: string };

const whatsappHref = `https://wa.me/${personalInfo.phone.replace(/\D/g, "")}`;

/** Ways to reach Hasibul. Used by the contact section and the footer. */
export const SOCIAL_LINKS: SocialLink[] = [
  { icon: Mail, label: "Email", value: personalInfo.email, href: `mailto:${personalInfo.email}` },
  { icon: WhatsappIcon, label: "WhatsApp", value: "Chat on WhatsApp", href: whatsappHref },
  { icon: LinkedinIcon, label: "LinkedIn", value: bare(personalInfo.linkedin), href: personalInfo.linkedin },
  { icon: GithubIcon, label: "GitHub", value: bare(personalInfo.github), href: personalInfo.github },
];
