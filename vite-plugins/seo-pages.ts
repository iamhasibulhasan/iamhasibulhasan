import fs from "node:fs/promises";
import path from "node:path";
import { createServer, type Plugin } from "vite";

/** A page's details, as src/lib/seo.ts gives them (read through Vite, so the app's own code decides). */
type Page = { path: string; title: string; description: string; noindex?: boolean; jsonLd?: object };
type Seo = { SITE_URL: string; PAGES: Page[]; NOT_FOUND_META: Page };

const attr = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The built index.html with one page's head: title, description, robots,
 * canonical link, link-preview tags and its own structured data. Every tag is
 * looked for by name, and a missing one stops the build: a change to
 * index.html can't quietly leave a page with the homepage's details.
 */
function withHead(html: string, page: Page, siteUrl: string) {
  const url = page.path ? `${siteUrl}${page.path === "/" ? "/" : page.path}` : null;
  let out = html;
  const swap = (label: string, pattern: RegExp, replacement: string) => {
    if (!pattern.test(out)) throw new Error(`seo-pages: index.html has no ${label}`);
    out = out.replace(pattern, replacement);
  };
  const meta = (key: string, id: string, value: string) =>
    swap(`${key}="${id}"`, new RegExp(`(<meta\\s+${key}="${id}"\\s+content=")[^"]*(")`), `$1${attr(value)}$2`);

  swap("<title>", /<title>[^<]*<\/title>/, `<title>${xml(page.title)}</title>`);
  meta("name", "description", page.description);
  meta("name", "robots", page.noindex ? "noindex, follow" : "index, follow");
  meta("property", "og:title", page.title);
  meta("property", "og:description", page.description);
  meta("name", "twitter:title", page.title);
  meta("name", "twitter:description", page.description);
  if (url) {
    swap("canonical link", /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
    meta("property", "og:url", url);
    meta("name", "twitter:url", url);
  } else {
    // No address of its own (not found): no canonical link.
    swap("canonical link", /\s*<link rel="canonical" href="[^"]*" \/>/, "");
  }
  if (page.jsonLd) {
    const data = JSON.stringify(page.jsonLd).replace(/</g, "\\u003c");
    out = out.replace("</head>", `  <script type="application/ld+json" id="page-ld">${data}</script>\n  </head>`);
  }
  return out;
}

function sitemap(pages: Page[], siteUrl: string, day: string) {
  const entries = pages
    .filter((page) => page.path && !page.noindex)
    .map((page) => {
      const depth = page.path === "/" ? 0 : page.path.split("/").length - 1;
      const priority = ["1.0", "0.8", "0.7"][Math.min(depth, 2)];
      return `  <url>\n    <loc>${xml(`${siteUrl}${page.path === "/" ? "/" : page.path}`)}</loc>\n    <lastmod>${day}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

/**
 * After the build: an HTML file for every route (dist/work/index.html,
 * dist/work/<slug>/index.html), each with its own head, so search engines and
 * link previews get the right page before any script runs; a 404.html that
 * the hosts serve, with a real 404 status, for any address that isn't a page;
 * and the sitemap, listing every page with the build's date.
 */
export function seoPages(): Plugin {
  let root = process.cwd();
  let outDir = "dist";
  return {
    name: "seo-pages",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const server = await createServer({
        root,
        configFile: false,
        logLevel: "silent",
        appType: "custom",
        server: { middlewareMode: true, hmr: false },
        resolve: { alias: { "@": path.join(root, "src") } },
        optimizeDeps: { noDiscovery: true, include: [] },
      });
      try {
        const seo = (await server.ssrLoadModule("/src/lib/seo.ts")) as Seo;
        const shell = await fs.readFile(path.join(outDir, "index.html"), "utf8");
        for (const page of seo.PAGES) {
          const file = page.path === "/" ? path.join(outDir, "index.html") : path.join(outDir, ...page.path.split("/").filter(Boolean), "index.html");
          await fs.mkdir(path.dirname(file), { recursive: true });
          await fs.writeFile(file, withHead(shell, page, seo.SITE_URL));
        }
        await fs.writeFile(path.join(outDir, "404.html"), withHead(shell, seo.NOT_FOUND_META, seo.SITE_URL));
        await fs.writeFile(path.join(outDir, "sitemap.xml"), sitemap(seo.PAGES, seo.SITE_URL, new Date().toISOString().slice(0, 10)));
      } finally {
        await server.close();
      }
    },
  };
}
