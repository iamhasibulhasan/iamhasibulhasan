import { useEffect } from "react";

/** The homepage's title, as `index.html` declares it for search results and link previews. */
export const SITE_TITLE = "Hasibul Hasan — Software Engineer | .NET Core Developer";

/** Sets the tab title for a route; `null` restores the homepage title. */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} | Hasibul Hasan` : SITE_TITLE;
  }, [title]);
}
