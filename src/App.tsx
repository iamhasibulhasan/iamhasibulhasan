import { Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { SettingsProvider } from "@/lib/settings";
import CustomCursor from "@/components/CustomCursor";
import dynamic from "@/lib/compat/dynamic";
import { Toaster } from "@/components/ui/sonner";
import { SmoothScroll } from "@/components/SmoothScroll";
import ScrollProgress from "@/components/ScrollProgress";
import { QuietBoundary } from "@/components/QuietBoundary";
import { GuideCompanionMount } from "@/components/guide/GuideCompanionMount";
import { GuideTransit } from "@/components/guide/GuideTransit";
import HomePage from "@/pages/HomePage";

// The other pages are their own chunks, so the homepage doesn't download them.
const WorkIndex = dynamic(() => import("@/pages/WorkIndex"));
const CaseStudyPage = dynamic(() => import("@/pages/CaseStudyPage"));
const NotFound = dynamic(() => import("@/pages/NotFound"));

// Background layer on every route. Self-gates on a fine pointer, >=1280px and reduced motion.
const FluidCursor = dynamic(() => import("@/components/FluidCursor"));
const CommandPalette = dynamic(() => import("@/components/CommandPalette"));
// After a minute with no input: the site blurs and the guide naps (GuideSleepScreen).
const GuideSleepScreen = dynamic(() => import("@/components/guide/GuideSleepScreen"));

export default function App() {
  return (
    <SettingsProvider>
      {/*
        reducedMotion="user" makes framer-motion honour prefers-reduced-motion for
        every animation in the tree, so a component that forgets to check the
        preference itself still behaves.
      */}
      <MotionConfig reducedMotion="user">
        <a
          href="#main-content"
          data-focus-target="true"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <FluidCursor />
          <CustomCursor />
          {/* Inside SmoothScroll so it can subscribe to the Lenis instance. */}
          <ScrollProgress />
          <QuietBoundary name="Page">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/work" element={<WorkIndex />} />
              <Route path="/work/:slug" element={<CaseStudyPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </QuietBoundary>
          <QuietBoundary name="Guide">
            <GuideCompanionMount />
          </QuietBoundary>
          <QuietBoundary name="Sleep screen">
            <GuideSleepScreen />
          </QuietBoundary>
          <QuietBoundary name="Command palette">
            <CommandPalette />
          </QuietBoundary>
        </SmoothScroll>
        <GuideTransit />
        <Toaster />
      </MotionConfig>
    </SettingsProvider>
  );
}
