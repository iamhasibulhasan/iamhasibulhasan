import { useEffect } from "react";
import Link from "@/lib/compat/link";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");
  // A page that doesn't exist must not be indexed.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    // id/tabIndex so the global "Skip to content" link has a target here too.
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link href="/" className="text-primary-text underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </main>
  );
}
