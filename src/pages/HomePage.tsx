import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import CaseStudyCard from "@/components/CaseStudyCard";
import { caseStudies, featuredCaseStudies } from "@/data/case-studies";
import SkillsSection from "@/components/SkillsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function HomePage() {
  useDocumentTitle(null);
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection
          caseStudyCount={caseStudies.length}
          featured={featuredCaseStudies.map((study) => (
            <div key={study.slug} className="h-full">
              {/* h4: the group label above this row is an h3. */}
              <CaseStudyCard study={study} headingLevel="h4" />
            </div>
          ))}
        />
        <SkillsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
