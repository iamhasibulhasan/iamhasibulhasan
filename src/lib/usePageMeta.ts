import { useEffect } from "react";
import { pageUrl, type PageMeta } from "@/lib/seo";

/** Sets (or adds) a <meta> by its name or property. */
function setMeta(key: "name" | "property", id: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${id}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(key, id);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/**
 * The page's head for the route on screen: title, description, canonical link,
 * robots, link-preview tags and its own structured data. The build already
 * serves each route's HTML with these (vite/seo-pages.ts); this keeps them
 * right as the visitor moves between pages without a reload.
 */
export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    const url = meta.path ? pageUrl(meta.path) : null;
    document.title = meta.title;
    setMeta("name", "description", meta.description);
    setMeta("name", "robots", meta.noindex ? "noindex, follow" : "index, follow");
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);

    // A page with no address of its own (not found) has no canonical link.
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (url) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = url;
      setMeta("property", "og:url", url);
      setMeta("name", "twitter:url", url);
    } else {
      canonical?.remove();
    }

    let data = document.getElementById("page-ld");
    if (meta.jsonLd) {
      if (!data) {
        data = document.createElement("script");
        data.id = "page-ld";
        data.setAttribute("type", "application/ld+json");
        document.head.appendChild(data);
      }
      data.textContent = JSON.stringify(meta.jsonLd);
    } else {
      data?.remove();
    }
  }, [meta]);
}
