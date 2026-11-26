import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link as RouterLink } from "react-router-dom";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  /** Accepted for parity with the reference's links; routing here never prefetches. */
  prefetch?: boolean;
  scroll?: boolean;
};

/**
 * In-app routes go through the router; `#hash`, external, mail and file links
 * stay plain anchors (SmoothScroll handles `#hash` clicks itself).
 */
const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ href, prefetch: _prefetch, scroll: _scroll, ...rest }, ref) {
  const isRoute = href.startsWith("/") && !href.startsWith("//") && !/\.(pdf|xml|txt|svg|png)$/i.test(href);
  if (!isRoute) return <a ref={ref} href={href} {...rest} />;
  return <RouterLink ref={ref} to={href} {...rest} />;
});

export default Link;
