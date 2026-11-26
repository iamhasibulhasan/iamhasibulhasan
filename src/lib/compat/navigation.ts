import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function usePathname() {
  return useLocation().pathname;
}

export type AppRouter = {
  push: (href: string) => void;
  replace: (href: string) => void;
  back: () => void;
};

export function useRouter(): AppRouter {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate(href),
      replace: (href: string) => navigate(href, { replace: true }),
      back: () => navigate(-1),
    }),
    [navigate],
  );
}
