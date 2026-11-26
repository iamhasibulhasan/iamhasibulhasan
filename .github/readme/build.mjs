// Builds the images used by the profile README (README.md at the repo root).
// Run from the repo root: node .github/readme/build.mjs
// Colours and type follow the portfolio's dark theme.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = dirname(fileURLToPath(import.meta.url));

const C = {
  bg: "#0a0b09",
  card: "#131410",
  raised: "#1a1c16",
  border: "#252720",
  fg: "#f4f5f0",
  muted: "#9b9d90",
  green: "#22c55e",
  light: "#4ade80",
  pale: "#86efac",
  lime: "#bef264",
};

const STYLE = `
  .sans { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Inter, Arial, sans-serif; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace; }
`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svg(name, w, h, body, extraStyle = "") {
  const out = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
<style>${STYLE}${extraStyle}</style>
${body}
</svg>
`;
  writeFileSync(join(OUT, name), out);
  console.log("wrote", name);
}

/** The faint grid used behind the hero and footer, fading out from one corner. */
function grid(id, w, h, cx, cy) {
  return `
<defs>
  <pattern id="${id}-p" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M40 0H0V40" stroke="#ffffff" stroke-opacity="0.05"/>
  </pattern>
  <radialGradient id="${id}-fade" cx="${cx}" cy="${cy}" r="0.9">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="${id}-m"><rect width="${w}" height="${h}" fill="url(#${id}-fade)"/></mask>
</defs>
<rect width="${w}" height="${h}" fill="url(#${id}-p)" mask="url(#${id}-m)"/>`;
}

function glow(id, cx, cy, r, opacity = 0.28) {
  return `
<defs>
  <radialGradient id="${id}" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${C.green}" stop-opacity="${opacity}"/>
    <stop offset="1" stop-color="${C.green}" stop-opacity="0"/>
  </radialGradient>
</defs>
<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})">
  <animate attributeName="opacity" values="0.7;1;0.7" dur="6s" repeatCount="indefinite"/>
</circle>`;
}

/* ---------- Hero ---------- */
{
  const W = 1200, H = 420;
  const code = [
    [["kw", "var "], ["fg", "engineer "], ["mu", "= "], ["kw", "new "], ["ty", "Engineer"]],
    [["mu", "{"]],
    [["fg", "    Name   "], ["mu", "= "], ["st", '"Hasibul Hasan"'], ["mu", ","]],
    [["fg", "    Stack  "], ["mu", "= ["], ["st", '".NET"'], ["mu", ", "], ["st", '"EF Core"'], ["mu", ", "], ["st", '"SQL"'], ["mu", "],"]],
    [["fg", "    Focus  "], ["mu", "= "], ["st", '"Scalable systems"'], ["mu", ","]],
    [["fg", "    OpenTo "], ["mu", "= "], ["ty", "Roles"], ["mu", "."], ["fg", "SoftwareEngineer"]],
    [["mu", "};"]],
  ];
  const colour = { kw: C.green, ty: C.pale, st: C.lime, fg: C.fg, mu: C.muted };
  const codeLines = code
    .map((parts, i) => `<text class="mono" x="784" y="${142 + i * 27}" font-size="14" xml:space="preserve">${parts
      .map(([k, t]) => `<tspan fill="${colour[k]}">${esc(t)}</tspan>`)
      .join("")}</text>`)
    .join("\n");

  svg("hero.svg", W, H, `
<defs>
  <clipPath id="hero-clip"><rect width="${W}" height="${H}" rx="24"/></clipPath>
  <linearGradient id="name" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.light}"/>
    <stop offset="1" stop-color="${C.green}"/>
  </linearGradient>
</defs>
<g clip-path="url(#hero-clip)">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${grid("hero", W, H, 0.85, 0.1)}
  ${glow("hero-glow", 1010, 60, 420)}
  ${glow("hero-glow2", 80, 430, 260, 0.12)}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="23.5" stroke="${C.border}"/>

<!-- status pill -->
<rect x="72" y="64" width="318" height="34" rx="17" fill="${C.green}" fill-opacity="0.08" stroke="${C.green}" stroke-opacity="0.35"/>
<circle cx="94" cy="81" r="9" fill="${C.green}" opacity="0.25">
  <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
</circle>
<circle cx="94" cy="81" r="4" fill="${C.green}"/>
<text class="mono" x="110" y="86" font-size="13" letter-spacing="1.6" fill="${C.light}">OPEN TO SOFTWARE ENGINEER ROLES</text>

<!-- name -->
<text class="sans" x="68" y="196" font-size="78" font-weight="700" letter-spacing="-2" fill="${C.fg}">Hasibul <tspan fill="url(#name)">Hasan</tspan></text>

<!-- tagline -->
<text class="sans" x="72" y="250" font-size="24" fill="${C.muted}">Software Engineer building scalable backend</text>
<text class="sans" x="72" y="284" font-size="24" fill="${C.muted}">systems with <tspan fill="${C.fg}" font-weight="600">.NET Core</tspan> and <tspan fill="${C.fg}" font-weight="600">EF Core</tspan>.</text>

<!-- meta -->
<g class="mono" font-size="13" letter-spacing="1.4" fill="${C.muted}">
  <text x="72" y="356">DHAKA, BANGLADESH</text>
  <text x="250" y="356" fill="${C.border}">/</text>
  <text x="272" y="356">SOFTWARE ENGINEER</text>
  <text x="434" y="356" fill="${C.border}">/</text>
  <text x="456" y="356" fill="${C.light}">4.5+ YEARS</text>
</g>

<!-- code window -->
<g>
  <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur="7s" repeatCount="indefinite"/>
  <rect x="752" y="64" width="384" height="292" rx="16" fill="${C.card}" stroke="${C.border}"/>
  <path d="M752 104H1136" stroke="${C.border}"/>
  <circle cx="776" cy="84" r="5.5" fill="#3a3d33"/>
  <circle cx="796" cy="84" r="5.5" fill="#3a3d33"/>
  <circle cx="816" cy="84" r="5.5" fill="${C.green}"/>
  <text class="mono" x="1112" y="88" font-size="12" fill="${C.muted}" text-anchor="end">Engineer.cs</text>
  ${codeLines}
  <rect x="806" y="${142 + 6 * 27 + 6}" width="8" height="2" fill="${C.green}">
    <animate attributeName="opacity" values="1;0;1" dur="1.1s" repeatCount="indefinite"/>
  </rect>
</g>
`);
}

/* ---------- Buttons ---------- */
// Small pills, sized to their label.
function button(name, label, primary) {
  const h = 34;
  const w = Math.round(label.length * 7.6 + 36);
  svg(name, w, h, `
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${(h - 1) / 2}" fill="${primary ? C.green : C.card}" stroke="${primary ? C.green : "#2f3229"}"/>
<text class="sans" x="${w / 2}" y="22" font-size="13" font-weight="600" fill="${primary ? C.bg : C.fg}" text-anchor="middle">${esc(label)}</text>
`);
}
button("btn-portfolio.svg", "Portfolio ↗", true);
button("btn-cv.svg", "Download CV ↓", false);
button("btn-linkedin.svg", "LinkedIn ↗", false);
button("btn-email.svg", "Email me →", false);

/* ---------- Stats strip ---------- */
{
  const W = 1200, H = 150;
  const stats = [
    ["4.5+", "YEARS OF EXPERIENCE"],
    ["4", "CASE STUDIES"],
    ["1", "LIBRARY ON NUGET"],
    ["95.26%", "RESEARCH MODEL ACCURACY"],
  ];
  const cell = W / stats.length;
  svg("stats.svg", W, H, `
<defs>
  <linearGradient id="num" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.light}"/>
    <stop offset="1" stop-color="${C.green}"/>
  </linearGradient>
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20" fill="${C.card}" stroke="${C.border}"/>
${stats
  .map(([n, l], i) => `
<text class="sans" x="${cell * i + cell / 2}" y="78" font-size="46" font-weight="700" letter-spacing="-1" fill="url(#num)" text-anchor="middle">${esc(n)}</text>
<text class="mono" x="${cell * i + cell / 2}" y="110" font-size="12" letter-spacing="1.6" fill="${C.muted}" text-anchor="middle">${esc(l)}</text>
${i ? `<path d="M${cell * i} 36V114" stroke="${C.border}"/>` : ""}`)
  .join("")}
`);
}

/* ---------- Section headers ---------- */
// Title text follows the viewer's colour scheme so it reads on GitHub's light and dark themes.
function section(name, number, label, title) {
  const W = 1200, H = 84;
  svg(name, W, H, `
<defs>
  <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${C.green}" stop-opacity="0.7"/>
    <stop offset="1" stop-color="${C.green}" stop-opacity="0"/>
  </linearGradient>
</defs>
<text class="mono" x="2" y="22" font-size="13" letter-spacing="1.8" fill="${C.green}">${number} / ${esc(label)}</text>
<text class="sans title" x="0" y="64" font-size="34" font-weight="700" letter-spacing="-0.5">${esc(title)}</text>
<rect x="0" y="80" width="${W}" height="2" fill="url(#rule)"/>
`, `
  .title { fill: ${C.fg}; }
  @media (prefers-color-scheme: light) { .title { fill: #111310; } }
`);
}
section("section-about.svg", "01", "ABOUT", "A bit about me");
section("section-work.svg", "02", "WORK", "Featured work");
section("section-stack.svg", "03", "STACK", "What I build with");
section("section-activity.svg", "04", "ACTIVITY", "On GitHub");
section("section-wakatime.svg", "05", "CODE TIME", "Where my hours go");

/* ---------- About card ---------- */
{
  const W = 1200, H = 330;
  const intro = [
    "Software Engineer with 4.5+ years of experience",
    "building scalable software. I specialise in",
    ".NET Core and Entity Framework Core, and I bring",
    "problem-solving, leadership, teamwork and",
    "stakeholder collaboration to every project.",
  ];
  const facts = [
    ["ROLE", "Software Engineer", "Backend systems with .NET Core"],
    ["OPEN SOURCE", "PatronusR on NuGet", "A mediator library for .NET"],
    ["RESEARCH", "Bone cancer diagnosis", "Capsule Networks on MRI and CT images"],
    ["LEARNING", "gRPC in .NET", "And performance optimisation"],
  ];
  svg("about.svg", W, H, `
<defs><clipPath id="about-clip"><rect width="${W}" height="${H}" rx="20"/></clipPath></defs>
<g clip-path="url(#about-clip)">
  <rect width="${W}" height="${H}" fill="${C.card}"/>
  ${glow("about-glow", 0, 0, 300, 0.14)}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="19.5" stroke="${C.border}"/>
${intro.map((line, i) => `<text class="sans" x="48" y="${80 + i * 34}" font-size="21" fill="${i < 3 ? C.fg : C.muted}">${esc(line)}</text>`).join("\n")}
<path d="M620 40V290" stroke="${C.border}"/>
${facts
  .map(([k, a, b], i) => {
    const y = 64 + i * 64;
    return `
<rect x="660" y="${y - 12}" width="8" height="8" rx="2" fill="${C.green}"/>
<text class="mono" x="682" y="${y - 4}" font-size="11" letter-spacing="1.6" fill="${C.green}">${k}</text>
<text class="sans" x="682" y="${y + 20}" font-size="18" font-weight="600" fill="${C.fg}">${esc(a)}</text>
<text class="sans" x="682" y="${y + 42}" font-size="15" fill="${C.muted}">${esc(b)}</text>`;
  })
  .join("")}
`);
}

/* ---------- Project cards ---------- */
function card(name, { label, title, lines, tags, link }) {
  const W = 590, H = 270;
  let x = 32;
  const pills = tags
    .map((t) => {
      const w = Math.round(t.length * 7.3 + 24);
      const out = `<rect x="${x}" y="186" width="${w}" height="28" rx="14" fill="${C.raised}" stroke="${C.border}"/>
<text class="mono" x="${x + w / 2}" y="204" font-size="12" fill="${C.muted}" text-anchor="middle">${esc(t)}</text>`;
      x += w + 8;
      return out;
    })
    .join("\n");
  svg(name, W, H, `
<defs><clipPath id="c"><rect width="${W}" height="${H}" rx="20"/></clipPath></defs>
<g clip-path="url(#c)">
  <rect width="${W}" height="${H}" fill="${C.card}"/>
  ${glow("g", W, 0, 220, 0.16)}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="19.5" stroke="${C.border}"/>
<text class="mono" x="32" y="46" font-size="12" letter-spacing="1.6" fill="${C.green}">${esc(label)}</text>
<text class="sans" x="32" y="88" font-size="26" font-weight="700" letter-spacing="-0.3" fill="${C.fg}">${esc(title)}</text>
${lines.map((l, i) => `<text class="sans" x="32" y="${124 + i * 25}" font-size="16" fill="${C.muted}">${esc(l)}</text>`).join("\n")}
${pills}
<text class="sans" x="32" y="246" font-size="15" font-weight="600" fill="${C.light}">${esc(link)}</text>
`);
}

card("work-inventory.svg", {
  label: "E-COMMERCE · MICROSERVICES",
  title: "E-commerce Inventory Service",
  lines: ["The full inventory system of a microservice-based", "e-commerce platform, run as its own service."],
  tags: [".NET Core", "Microservices", "EF Core", "SQL Server"],
  link: "Read the case study  →",
});
card("work-land.svg", {
  label: "PROPERTY · MARKETPLACE",
  title: "Land Asset Platform",
  lines: ["A platform for buying and selling land property,", "backed by a .NET Core API."],
  tags: [".NET Core API", "PostgreSQL", "Tailwind CSS"],
  link: "Read the case study  →",
});
card("work-peoplehub.svg", {
  label: "HR · ENTERPRISE",
  title: "People Hub: HR & Payroll",
  lines: ["Key modules of an HR and payroll system:", "employees, leave, performance and training."],
  tags: [".NET Core MVC", "EF Core", "SQL Server"],
  link: "Read the case study  →",
});
card("work-erp.svg", {
  label: "ERP · ENTERPRISE",
  title: "Enterprise Resource Planning",
  lines: ["A complete ERP for garments, steel and accessories", "businesses, with a range of analytical reports."],
  tags: [".NET Core", "RDLC Reports", "SQL"],
  link: "Read the case study  →",
});
card("work-patronusr.svg", {
  label: "OPEN SOURCE · NUGET",
  title: "PatronusR",
  lines: ["A simple mediator for .NET: request/response,", "commands and queries via C# generic variance."],
  tags: [".NET", "C#", "NuGet"],
  link: "View on NuGet  ↗",
});
card("work-research.svg", {
  label: "RESEARCH PUBLICATION · 2022",
  title: "Bone Cancer Diagnosis",
  lines: ["A Capsule Network that classifies bone cancer", "from MRI and CT images with limited data."],
  tags: ["95.26% accuracy", "Deep learning", "Medical imaging"],
  link: "More on my portfolio  ↗",
});

/* ---------- Tech stack ---------- */
{
  const W = 1200;
  const groups = [
    ["BACKEND", [".NET Core", "C#", "EF Core", "FastEndpoints", "Minimal APIs", "LINQ"]],
    ["ARCHITECTURE", ["Clean Architecture", "Microservices", "REST APIs"]],
    ["DATA", ["SQL Server", "PostgreSQL", "RDLC Reports"]],
    ["FRONTEND", ["JavaScript", "TypeScript", "React", "jQuery", "Tailwind CSS", "Bootstrap", "MUI"]],
    ["TOOLS", ["Git", "Docker", "Visual Studio", "VS Code", "pgAdmin"]],
  ];
  const ROW = 46, TOP = 28;
  const H = TOP * 2 + groups.length * ROW - 14;
  const rows = groups
    .map(([label, items], r) => {
      const y = TOP + r * ROW;
      let x = 200;
      const chips = items
        .map((t) => {
          const w = Math.round(t.length * 7.4 + 30);
          const out = `<rect x="${x}" y="${y}" width="${w}" height="30" rx="15" fill="${C.raised}" stroke="${C.border}"/>
<circle cx="${x + 14}" cy="${y + 15}" r="3" fill="${C.green}"/>
<text class="mono" x="${x + 24}" y="${y + 19.5}" font-size="12" fill="${C.fg}">${esc(t)}</text>`;
          x += w + 8;
          return out;
        })
        .join("\n");
      return `<text class="mono" x="40" y="${y + 19.5}" font-size="11" letter-spacing="1.6" fill="${C.green}">${label}</text>
${r ? `<path d="M40 ${y - 8}H${W - 40}" stroke="${C.border}" stroke-opacity="0.6"/>` : ""}
${chips}`;
    })
    .join("\n");
  svg("stack.svg", W, H, `
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20" fill="${C.card}" stroke="${C.border}"/>
${rows}
`);
}

/* ---------- Footer ---------- */
{
  const W = 1200, H = 260;
  svg("footer.svg", W, H, `
<defs><clipPath id="f"><rect width="${W}" height="${H}" rx="24"/></clipPath></defs>
<g clip-path="url(#f)">
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  ${grid("foot", W, H, 0.5, 1)}
  ${glow("foot-glow", 600, 300, 380, 0.3)}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="23.5" stroke="${C.border}"/>
<text class="mono" x="600" y="70" font-size="13" letter-spacing="2" fill="${C.green}" text-anchor="middle">06 / LET'S TALK</text>
<text class="sans" x="600" y="128" font-size="44" font-weight="700" letter-spacing="-1" fill="${C.fg}" text-anchor="middle">Have a role or a project in mind?</text>
<text class="sans" x="600" y="168" font-size="20" fill="${C.muted}" text-anchor="middle">I'm open to Software Engineer roles building .NET services, APIs and enterprise systems.</text>
<text class="mono" x="600" y="214" font-size="16" fill="${C.light}" text-anchor="middle">mdhasibulhasan.dev@gmail.com  →</text>
`);
}

/* ---------- WakaTime graphs ---------- */
// Built from the public all-time stats. If WakaTime can't be reached, the
// existing graphs are kept as they are.
const WAKATIME_USER = "iamhasibulhasan";
const SERIES = [C.green, C.light, C.pale, C.lime, "#15803d", "#5b5e52"];

const hours = (seconds) => Math.round(seconds / 3600).toLocaleString("en-US");
const shortTime = (text) => text.replace(/ hrs?/, "h").replace(/ mins?/, "m");
const pct = (n) => `${n >= 10 ? n.toFixed(0) : n.toFixed(1)}%`;

/** Card frame shared by the WakaTime graphs: background, glow, label and subtitle. */
function frame(W, H, label, subtitle, id) {
  return `
<defs><clipPath id="${id}-c"><rect width="${W}" height="${H}" rx="20"/></clipPath></defs>
<g clip-path="url(#${id}-c)">
  <rect width="${W}" height="${H}" fill="${C.card}"/>
  ${glow(`${id}-g`, W, 0, 240, 0.14)}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="19.5" stroke="${C.border}"/>
<text class="mono" x="32" y="44" font-size="12" letter-spacing="1.6" fill="${C.green}">${esc(label)}</text>
<text class="sans" x="32" y="70" font-size="14" fill="${C.muted}">${esc(subtitle)}</text>`;
}

/** The top entries of a WakaTime list, with the rest folded into "Other". */
function top(list, n, skip = []) {
  const kept = list.filter((x) => !skip.includes(x.name));
  const head = kept.slice(0, n);
  const rest = kept.slice(n).reduce((sum, x) => sum + x.percent, 0);
  return rest >= 0.5 ? [...head, { name: "Other", percent: rest }] : head;
}

async function wakatime() {
  let data;
  try {
    const res = await fetch(`https://wakatime.com/api/v1/users/${WAKATIME_USER}/stats/all_time`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = (await res.json()).data;
    if (!data?.languages?.length) throw new Error("no public stats");
  } catch (error) {
    console.warn("WakaTime skipped:", error.message);
    return;
  }
  const since = data.human_readable_range.replace(/^since /, "since ");

  // Overview strip: four headline numbers.
  {
    const W = 1200, H = 150;
    const items = [
      [`${hours(data.total_seconds_including_other_language)} hrs`, "TOTAL CODING TIME"],
      [shortTime(data.human_readable_daily_average_including_other_language), "DAILY AVERAGE"],
      [data.days_minus_holidays.toLocaleString("en-US"), "ACTIVE DAYS"],
      [data.languages[0].name, "TOP LANGUAGE"],
    ];
    const cell = W / items.length;
    svg("wakatime-overview.svg", W, H, `
<defs>
  <linearGradient id="wnum" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.light}"/>
    <stop offset="1" stop-color="${C.green}"/>
  </linearGradient>
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="20" fill="${C.card}" stroke="${C.border}"/>
${items
  .map(([n, l], i) => `
<text class="sans" x="${cell * i + cell / 2}" y="76" font-size="40" font-weight="700" letter-spacing="-1" fill="url(#wnum)" text-anchor="middle">${esc(n)}</text>
<text class="mono" x="${cell * i + cell / 2}" y="108" font-size="12" letter-spacing="1.6" fill="${C.muted}" text-anchor="middle">${l}</text>
${i ? `<path d="M${cell * i} 36V114" stroke="${C.border}"/>` : ""}`)
  .join("")}
`);
  }

  // Languages: horizontal bars.
  {
    const W = 590, H = 340;
    const langs = data.languages.filter((l) => !["Binary", "Other", "Unknown Language"].includes(l.name)).slice(0, 6);
    const max = langs[0].percent;
    const BAR_X = 150, BAR_W = 270;
    const rows = langs
      .map((l, i) => {
        const y = 108 + i * 37;
        const w = Math.max(6, (l.percent / max) * BAR_W);
        return `
<text class="sans" x="32" y="${y + 11}" font-size="15" font-weight="600" fill="${C.fg}">${esc(l.name)}</text>
<rect x="${BAR_X}" y="${y}" width="${BAR_W}" height="14" rx="7" fill="${C.raised}"/>
<rect x="${BAR_X}" y="${y}" width="${w.toFixed(1)}" height="14" rx="7" fill="${SERIES[Math.min(i, 4)]}"/>
<text class="mono" x="${W - 32}" y="${y + 11}" font-size="12" fill="${C.muted}" text-anchor="end">${hours(l.total_seconds)}h · ${pct(l.percent)}</text>`;
      })
      .join("");
    svg("wakatime-languages.svg", W, H, `${frame(W, H, "LANGUAGES", `All time, ${since}`, "wl")}${rows}`);
  }

  // Editors: donut with a legend.
  {
    const W = 590, H = 340;
    const eds = top(data.editors, 4, ["Unknown Editor"]);
    const total = eds.reduce((s, e) => s + e.percent, 0);
    const R = 74, CX = 150, CY = 205, CIRC = 2 * Math.PI * R;
    let offset = 0;
    const arcs = eds
      .map((e, i) => {
        const len = (e.percent / total) * CIRC;
        const gap = eds.length > 1 ? 3 : 0;
        const out = `<circle cx="${CX}" cy="${CY}" r="${R}" stroke="${SERIES[i === eds.length - 1 && e.name === "Other" ? 5 : i]}" stroke-width="22" fill="none"
  stroke-dasharray="${Math.max(0, len - gap).toFixed(2)} ${(CIRC - Math.max(0, len - gap)).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${CX} ${CY})"/>`;
        offset += len;
        return out;
      })
      .join("\n");
    const legend = eds
      .map((e, i) => {
        const y = 128 + i * 40;
        const colour = SERIES[i === eds.length - 1 && e.name === "Other" ? 5 : i];
        return `
<rect x="300" y="${y}" width="12" height="12" rx="3" fill="${colour}"/>
<text class="sans" x="322" y="${y + 11}" font-size="15" font-weight="600" fill="${C.fg}">${esc(e.name)}</text>
<text class="mono" x="${W - 32}" y="${y + 11}" font-size="12" fill="${C.muted}" text-anchor="end">${pct(e.percent)}</text>`;
      })
      .join("");
    svg("wakatime-editors.svg", W, H, `${frame(W, H, "EDITORS", "Where the code gets written", "we")}
<circle cx="${CX}" cy="${CY}" r="${R}" stroke="${C.raised}" stroke-width="22" fill="none"/>
${arcs}
<text class="sans" x="${CX}" y="${CY + 4}" font-size="26" font-weight="700" fill="${C.fg}" text-anchor="middle">${pct(eds[0].percent)}</text>
<text class="mono" x="${CX}" y="${CY + 24}" font-size="10" letter-spacing="1.2" fill="${C.muted}" text-anchor="middle">${esc(eds[0].name.toUpperCase())}</text>
${legend}`);
  }

  // Categories: one stacked bar.
  {
    const W = 1200, H = 170;
    const cats = top(data.categories, 4);
    const BX = 32, BW = W - 64, BY = 92;
    let x = BX;
    const parts = cats
      .map((c, i) => {
        const w = (c.percent / 100) * BW;
        const out = `<rect x="${x.toFixed(1)}" y="${BY}" width="${Math.max(0, w - 3).toFixed(1)}" height="16" fill="${SERIES[i]}"/>`;
        x += w;
        return out;
      })
      .join("\n");
    let lx = 32;
    const legend = cats
      .map((c, i) => {
        const label = `${c.name} ${pct(c.percent)}`;
        const out = `<rect x="${lx}" y="132" width="10" height="10" rx="3" fill="${SERIES[i]}"/>
<text class="sans" x="${lx + 18}" y="141" font-size="14" fill="${C.fg}">${esc(c.name)} <tspan class="mono" font-size="12" fill="${C.muted}">${pct(c.percent)}</tspan></text>`;
        lx += Math.round(label.length * 8.2 + 48);
        return out;
      })
      .join("\n");
    svg("wakatime-activity.svg", W, H, `${frame(W, H, "ACTIVITY", "How the time is spent", "wa")}
<defs><clipPath id="bar"><rect x="${BX}" y="${BY}" width="${BW}" height="16" rx="8"/></clipPath></defs>
<g clip-path="url(#bar)">${parts}</g>
${legend}`);
  }
}

await wakatime();
