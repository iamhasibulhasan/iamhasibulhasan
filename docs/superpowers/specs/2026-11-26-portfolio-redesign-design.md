# Portfolio redesign: the reference look, Hasibul's content

Date: 2026-11-26
Status: design, awaiting approval

## Intent

Hasibul wants his portfolio (this repo, Vite + React) to look like
Nikunj Khitha's portfolio, all of it: https://github.com/Nikunj2003/My-Next-Js-Portfolio-v2
(live at https://nikunj.codenex.dev). The look is the point. The stack stays
Vite + React 19 + Tailwind v4 + framer-motion. The content, name, photo and
branding stay Hasibul's.

The reference is MIT licensed (LICENSE: "Copyright (c) 2026 Nikunj Khitha").
We adapt its code directly and keep the notice.

**Reference snapshot:** commit `0e6265a0fe0801cbbe587fb62ff9de6fbc09dd3b`
(2026-11-19). Clone it somewhere outside the repo
(`git clone https://github.com/Nikunj2003/My-Next-Js-Portfolio-v2 && git checkout 0e6265a`).
Treat it as read-only source to copy from. Do not run its scripts or install
its dependencies. All reference paths below are relative to that clone.

## Goals

- **Visual match.** Next to the reference, the site reads as the same design
  in both themes, on desktop and on phones. That means:
  - the navy and teal palette, the Sora display face and the glass tiers;
  - spotlight cards, the sticky side panels and the scroll-filled timeline;
  - Lenis smooth scroll, the 2px scroll-progress bar, the WebGL fluid cursor;
  - the ⌘K command palette, the floating glass navbar, the footer card;
  - the orchestrated hero intro.
- **A guide character of Hasibul's own.** It sits between his first and last
  name in the hero and wakes in the intro. It docks into a socket beside each
  section as you scroll and lands in the footer. It shows scripted tips and
  runs a scripted "Take a tour". It is decorative only.
- **Case-study pages** at `/work` and `/work/:slug` for his 4 projects,
  drafted from his resume data.
- **Still a static site.** It builds with `vite build` and has no server.

## Non-goals

- **No AI chat.** Nothing from "Nex" chat comes over: `/api/chat`, NexChat,
  "Ask about this", NexSection, "Check a role's fit", chat availability, or
  the "Ask Nex" groups in the command palette.
- **No server-side contact delivery.** No Resend and no API routes.
- **No Next.js migration.**
- **None of the current site's own features.** The settings panel (accent,
  font, cursor style), the fixed photo sidebar, the typewriter, the tech
  marquee and the NavDock all go. The reference has none of them.

## Anti-goals (failure even if it "works")

- **Anything of Nikunj's left behind:**
  - his name, text, case studies or screenshots;
  - his logo or `card.png`;
  - the Nex character definition (`src/assets/guide/guide.avatar.json`);
  - comments that describe his site or career.
- **Invented facts.** No metric, team size, result or design decision may
  appear that Hasibul's data doesn't support. A thin section beats a made-up
  one.
- **Chat leftovers.** No dead "Ask…" buttons, tips that say "ask me…", empty
  sockets wired to nothing, or `#nex` links.
- **Uncredited third-party assets.** The Icons8 cursor PNGs are not copied
  (the reference uses them without the credit Icons8 requires). Use the
  normal OS cursor.

## Constraints

- **Stack:** React 19, Vite 8, Tailwind v4 (`@tailwindcss/vite`),
  framer-motion 13 (the reference uses 12, so check any API it relies on),
  lucide-react, TypeScript.
- **Dev server port:** use 3000 (`server.port` in `vite.config.ts`). Port
  5173 falls in a Windows-reserved range on this machine.
- **Accessibility and motion handling from the reference stay intact:**
  - `prefers-reduced-motion` handling and `MotionConfig reducedMotion="user"`;
  - the fluid cursor runs only on fine pointers, at ≥1280px and without
    reduced motion;
  - skip link, focus traps and visible focus rings.
- **Hosting:** Netlify (`netlify.toml` on `master`: build `npm run build`,
  publish `dist`, Node 22). The canonical URL in `master`'s meta tags,
  JSON-LD and sitemap is `https://hasibul-hasan.netlify.app`. The site is
  served from the domain root.
- **Build on `master`, not on `animated-profile`.** `master` is 12 commits
  ahead of `animated-profile` and has work this design keeps:
  - `netlify.toml`, which deliberately has no SPA catch-all;
  - the Formspree contact form with its `_gotcha` honeypot;
  - SEO meta, Open Graph, Twitter Card, JSON-LD, `robots.txt` and
    `sitemap.xml`;
  - `src/components/LogoMark.tsx` and the matching `public/favicon.svg`;
  - `public/Md_Hasibul_Hasan_CV.pdf`.

  Start a fresh branch from `master`. A stash (`stash@{0}`, "animated-profile
  WIP before revert") holds an earlier, abandoned redesign. Leave it alone.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Adapt the reference code directly: copy components, swap Next-only APIs for Vite ones, strip the chat, swap in Hasibul's data. | Closest match, fastest. The cost is a large codebase (~12–15k lines) in someone else's style. |
| B | Rebuild from scratch in the current code style, using the reference as a visual target. | Leaner and fully owned code, but the fluid cursor, guide movement and intro choreography would take far longer and still only come close. |
| C | Port only the hard engines (fluid, scroll, intro, guide, spotlight, carousel), rewrite the sections. | The sections carry most of the look and are the easy part to port, so this saves little and drifts. |

Hasibul picked **A**: "the full look" is the goal, and the reference code
already is that look.

## Decided by Hasibul

1. The site should look fully like the reference, and the stack does not
   change.
2. **Approach A.**
3. **Guide character:** his own animated character in the hero's center
   spot, decorative, with no AI chat and no server.
4. **Case studies:** Claude drafts all 4 from his resume data, sticking to
   what it says, and gives him a short list of questions to strengthen them
   later. Screenshots get styled placeholder graphics until he adds real
   ones.
5. **Logo stays green.** `master`'s `LogoMark` (green gradient, #22c55e /
   #15803d) and `favicon.svg` are used unchanged, as a deliberate contrast
   against the navy and teal. `LogoMark` replaces the reference's `logo.png`
   in the navbar brand slot and anywhere else the reference shows its logo.

## Claude's calls (Hasibul may correct any)

- **Character name:** "Hex" is a placeholder. Keep the name in one constant
  so a rename is a one-line change.
- **Character design:**
  - Use a new `*.avatar.json` for `@bible-strong/avatar-react` 1.0.1 (MIT).
  - The silhouette must be clearly not Nex's. Nex is a teal sphere with a top
    antenna and two side capsules. Use a different body shape and different
    appendages, from whatever surface types the library supports.
  - Colors stay inside the site's teal palette so it belongs on the page.
- **Theme default:** follow the system preference, as the reference does
  (today's site defaults to dark). The toggle is the reference's Sun/Moon
  `ThemeToggle`.
- **Hero name:** "Hasibul" left, character, "Hasan" right. The visible
  full name in About and the footer is the resume's "Md. Hasibul Hasan". The
  SEO tags keep `master`'s "Hasibul Hasan".
- **Photo:** `public/profile.png` moves into About, in the tile where the
  reference shows its logo.
- **Education:** goes into the Experience timeline as `type: "education"`
  entries, as the reference does. Include AIUB (BSc, CGPA 3.75) and the HSC
  and SSC results.
- **Publications and awards:** About's Recognition card is the research
  paper. PatronusR and the GPA 5 award become About highlights. The
  certificate and languages go in About's text.
- **Contact:** the reference's two-card layout and form fields (name, email,
  reason select of Hiring / Collaboration / Open Source / Other, message).
  - It uses the reference's zod rules and sonner toasts.
  - **Delivery stays on Formspree**, as on `master`: POST to
    `https://formspree.io/f/mjybdbyl`, keep the `_gotcha` honeypot, and send
    `_subject` = `[Portfolio] {reason} inquiry from {name}`. A hosted form
    service is not the "server" this design rules out.
  - Drop the reference's `/api/contact` call, its timing checks and its
    18-second abort. Map Formspree's success and error responses onto the
    reference's toast and field-error states.
  - The left card keeps `master`'s channels: email, WhatsApp (built from
    `profile.phone`), LinkedIn and GitHub, plus the Resume button. All
    socials also appear in the footer.
- **Phone-only business card.** The reference shows a `card.png` above the
  contact panels on phones. Replace it with a card drawn in CSS: `LogoMark`,
  name, role and email on a glass surface. No image file.
- **SEO:** keep `master`'s `index.html` head as it is (title, description,
  keywords, Open Graph, Twitter Card, JSON-LD, all using "Hasibul Hasan" and
  `hasibul-hasan.netlify.app`).
  - Update only the theme-color and any colors that no longer match.
  - Add a per-route `document.title` for `/work` and each study.
  - Add `/work` and each `/work/:slug` to `public/sitemap.xml`.
- **Projects section:**
  - Keep the PillarRow, then 3 featured case-study cards, then the stacked
    "Built and shipped" deck of the 4 projects with placeholder art.
  - "Also built" holds PatronusR (NuGet) and the research paper.
  - A pillar with no case study links to the nearest real evidence (NuGet,
    the paper) instead of opening chat.
- **Router:** `react-router-dom` with `BrowserRouter`.
- **Fonts:** `@fontsource-variable/sora` (OFL) for the display face, an npm
  package rather than a copied file. Body text uses the reference's system
  stack.
- **Credits** go in `THIRD_PARTY_NOTICES.md` only, **not `README.md`**. This
  repo's README is Hasibul's public GitHub profile page. The file holds:
  - the reference's MIT notice (Nikunj Khitha);
  - the MIT notice of Pavel Dobryakov's WebGL-Fluid-Simulation, which the
    reference's `useFluidCursor.tsx` is derived from without credit;
  - a line for Sora (OFL, via Fontsource).

  Keep a short `/*! … @license MIT */` banner at the top of the main ported
  files (fluid cursor, guide companion), so the notice also survives into
  the built bundle.

## Content plan

All copy is drafted from `src/data/resume.ts` and `README.md` only. Section
by section:

- **Hero:**
  - role "Software Engineer" and the existing tagline;
  - availability pill "Available for new opportunities";
  - 4 figures, each linking to its proof: 4.5+ years experience
    (`#experience`), 4 major projects (`/work`), 2 publications (`#about`),
    3 companies (`#experience`).
  - Hero actions: "Let's talk" (`#contact`), "Take a tour", "Resume".
- **Thesis and pillars** (`src/data/thesis.ts` equivalent):
  - one thesis line plus 4 pillars, drafted around what the record shows:
    microservice backends (Cartup), enterprise systems (ERP), business
    workflow apps (People Hub, Land platform) and open-source .NET (PatronusR);
  - each pillar links to a study or to external proof.
- **About:**
  - the summary;
  - highlights, each a figure plus a label plus one supported sentence:
    4.5+ years, 3 companies, 95.26% accuracy (the capsule-network paper),
    PatronusR published on NuGet, CGPA 3.75, GPA 5.00 award;
  - the Recognition card;
  - the photo.
- **Experience:**
  - 3 jobs: Cartup, ERA Infotech, Mass Data;
  - each job's bullets come from its projects' descriptions, and a bullet
    links to its case study where one exists;
  - education entries as above.
- **Skills:**
  - the 4 existing groups, each with a one-line description;
  - `skillEvidence` links a chip to the study that uses it (e.g. ".NET Core"
    → Cartup).
- **Case studies:** Cartup inventory service, US Bangla Land asset platform,
  People Hub (HR & payroll), ERP. Keep the reference's `CaseStudy` shape.
  - Fill `title`, `employer`, `period`, `oneLiner`, `summary`, `problem`
    (only what the description states), `stack`, `ownership`,
    `ownershipSummary`, `tags`, `pillars`, `kind` and `theme` (re-themed to
    his work).
  - `diagram: null` for all 4, since the architecture isn't known.
  - Leave `decisions`, `constraints`, `results` and `sections` empty unless
    the resume supports an entry.
  - **The page must hide any empty section cleanly:** no empty headings, TOC
    entries, grids or "How these were measured" blocks.
- **Tips, tour and hero lines:**
  - rewrite the scripted copy (`tips.ts`, `hero-lines.ts`, `paths.ts`) for
    Hasibul, with nothing that invites asking a question;
  - tour paths: recruiter, hiring manager and engineer (drop founder unless
    it fits).
- **Footer:** a sign-off in Sora, social links (GitHub, LinkedIn, NuGet,
  LeetCode, email), the character's landing slot and "Explore" links.
- **Resume link:** `profile.cvUrl` → `/Md_Hasibul_Hasan_CV.pdf`, which
  exists on `master`.

A short **questions for Hasibul** list ships with the work, for each
project: the problem in his words, constraints, 2–3 key decisions and the
alternatives he rejected, any measurable result, team size, and what was
his. Also ask for real screenshots.

## How the port works

### What comes over

Global chrome:

- `Navbar`, `Footer`, `ScrollProgress`, `SmoothScroll`
- `FluidCursor` + `hooks/useFluidCursor`
- `CommandPalette`, `ThemeToggle`
- `QuietBoundary`, `ui/*` (button, carousel, collapse, flip-words, select,
  sonner, spotlight-card)

Sections:

- `HeroSection`, `HeroIntro` + `lib/hero-intro.ts`, `HeroRestOffset`,
  `HeroAskButton` (as plain actions)
- `AboutSection`, `ExperienceSection`, `ProjectsSection`, `PillarRow`,
  `CaseStudyCard`, `ProjectImageViewer`, `SkillsSection`, `ContactSection`

Case-study pages:

- `app/work/page.tsx`, `app/work/[slug]/page.tsx`
- `CaseStudyToc`, `case-study/MarginNote`, `case-study/RelatedStudies`
- `diagrams/DiagramFrame`, kept for later even though no study uses a
  diagram yet

Guide (decorative):

- `GuideCompanion`, `GuideCompanionMount`, `GuideHeroAvatar` (caption branch
  only), `GuideAvatar`, `GuideAvatarSlot`, `SectionNexDock` (socket and line
  only), `RouteNexSocket` (socket only), `NexRing`, `NexBubble` (tip and
  tour content only), `TourChooser`, `GuideTourNarrator`
- `lib/guide/*` except `ask-hosts.ts`
- `lib/scroll.ts`, `lib/scroll-lock.ts`, `hooks/useLenisLock`,
  `hooks/use-fine-pointer`, `hooks/use-mobile`

Styles: `globals.css` and the tokens in `tailwind.config.ts`, moved into
Tailwind v4 `@theme`.

Rename `Nex*` identifiers to neutral names (e.g. `GuideRing`, `GuideBubble`,
`SectionGuideDock`).

### What is dropped

- `app/api/*`
- `NexChat`, `NexChatMount`, `NexSection`
- `components/ai/*`, `lib/chat/*`, `lib/nex/*`
- `guide/{AskContent,InPageAskHost,LazyAskContent,FooterAskHost}`; unwrap
  `PanelAskSwap` and `SectionAskRow` at their call sites
- `AskAboutThis` (keep `ReadCaseStudyLink`), `HeroPillarAsk`,
  `ReadingPathAsk`, `useChatAvailability`
- `lib/{ai-config,ai-tools,answer-reveal,chat-contract,chat-storage,nex-knowledge,rate-limit,request-body,llm-url,artifacts,ask-nex}.ts`
- `public/llms*.txt`, the OG-image routes, `lib/seo/*` except a static
  JSON-LD Person block
- In the guide, cut every chat hook:
  - `useChatAvailability`;
  - the click-to-ask in `toggle()` (clicking becomes the "pet" reaction
    only);
  - `askSocketRule` and `openPanel`;
  - `useNexChat` in `NexRing`;
  - the tour narrator's "Ask about this".
- `getProjectAnchor` from `lib/chat/shared` moves to a plain helper
  (`#project-${slug}`).

The current site's `src/components/*`, `src/context/SettingsContext.tsx`,
`src/hooks/*` and `src/index.css` are replaced, with these exceptions:

- `LogoMark.tsx` stays.
- `master`'s Formspree submit logic is carried into the new
  `ContactSection`.

These stay unchanged: `public/profile.png`, `public/favicon.svg`,
`public/Md_Hasibul_Hasan_CV.pdf`, `public/robots.txt`, `README.md` and
`netlify.toml` (apart from the rewrites below). `public/sitemap.xml` gets
the new routes.

### Next.js → Vite replacements

| Next | Vite equivalent |
|---|---|
| `next/link` | `react-router-dom` `Link` for routes; plain `<a>` for `#hash` and external links |
| `next/navigation` `usePathname` / router | `useLocation` / `useNavigate` |
| `next/image` | `<img loading="lazy" decoding="async">` with explicit width/height |
| `next/dynamic` (`ssr:false`) | `React.lazy` + `Suspense` |
| `next/font/local` | `@fontsource-variable/sora` import, exposed as `--font-display` |
| `next/script beforeInteractive` (theme init, `PLAY_SCRIPT`) | inline `<script>` blocks in `index.html` `<head>`, before the module script |
| `next-themes` | a small `ThemeProvider` (class on `<html>`, `localStorage["theme"]`, system default) |
| `metadata` / `generateMetadata` | static meta in `index.html` + a `useDocumentTitle` hook per route |
| `generateStaticParams` | not needed; an unknown slug renders the 404 page |
| `app/not-found.tsx`, `error.tsx` | a catch-all route and an error boundary |

### Routing and static hosting

- **Routes:** `/`, `/work`, `/work/:slug`, `*` (404).
- **Deep links:** add two scoped rewrites to `netlify.toml`, both with
  status 200: `/work` → `/index.html` and `/work/*` → `/index.html`.
  - **No catch-all `/*`.** `master` left it out on purpose so a missing
    static file returns a real 404 rather than the homepage. Keep that rule
    and update the comment to say why the two `/work` rewrites exist.
  - **Do not copy `index.html` to `404.html`.** That would serve study pages
    with HTTP 404 status, so search engines and link previews would treat
    them as errors.
  - An unknown path outside `/work` gets Netlify's plain 404. An unknown
    slug under `/work/` renders the app's 404 page.
- **Scroll on route change:** `SmoothScroll`'s route-change reset uses
  `useLocation`.
- **Hash links:** they keep going through `scrollToHash`. Links to
  `/#section` from `/work` navigate first, then scroll.

### Dependencies

Add:

- Behavior: `lenis`, `react-router-dom`, `cmdk`, `embla-carousel-react`,
  `vaul`, `sonner`, `react-intersection-observer`, `zod`
- UI primitives: `@radix-ui/react-dialog`, `@radix-ui/react-select`,
  `@radix-ui/react-slot`, `class-variance-authority`, `clsx`,
  `tailwind-merge`
- Character: `@bible-strong/avatar-core@1.0.1`,
  `@bible-strong/avatar-react@1.0.1`
- Font and animation: `@fontsource-variable/sora`, plus a Tailwind
  v4-compatible replacement for `tailwindcss-animate` (e.g. `tw-animate-css`)
  if any `animate-in` utilities are used

Do not add: `next`, `next-themes`, `resend`, `@vercel/blob`, `sharp`,
`react-markdown`, `remark-gfm`.

## Success looks like

- `npm run build` (`tsc && vite build`) passes with no type errors.
- Side by side with the live reference at 1440×900 and 390×844, in both
  themes, the layout, spacing, glass, colors and motion match section by
  section.
- **The intro plays on a fresh load at the top**, and any input skips it.
  With reduced motion on, there is no intro, no fluid cursor and no orb
  pulse.
- The character wakes in the hero, docks beside each section, lands in the
  footer, shows scripted tips, and completes each tour path.
- `/work` and every `/work/:slug` load directly by URL and by navigation.
  No study page shows an empty section.
- **Nothing of Nikunj's is left.** Searching the source for `Nikunj`,
  `Khitha`, `Nex`, `ArmorCode`, `codenex`, `/api/` and `ask` (in
  user-facing strings) returns nothing.
- The contact form validates, submits to Formspree, and shows the success
  and error toasts. The honeypot field is present and hidden.
- `netlify.toml` serves `/work` and `/work/:slug` with status 200 and has no
  catch-all. `sitemap.xml` lists the new routes.
- `THIRD_PARTY_NOTICES.md` exists with all three credits. `README.md` is
  unchanged.

## Left to the builder

- The exact character design, within the constraints above.
- File and folder layout under `src/`. Mirroring the reference's
  `components` / `lib` / `data` / `hooks` split is fine.
- The wording of tips, tour narration, pillar claims and case-study drafts,
  within the content plan's no-invention rule.
- The look of the placeholder art: something on-palette that is plainly a
  placeholder, not a fake screenshot.
- How to verify: the reference's `node:test` suites are mostly chat tests.
  Port the few that guard the non-chat logic if useful (scroll and placement
  math). Otherwise verify with the build plus a browser walk-through.
- Whether to keep the reference's long explanatory comments. Keep ones that
  explain real constraints (glass and opacity, reduced motion, measured
  layout). Drop or rewrite ones about Nikunj's site history.
