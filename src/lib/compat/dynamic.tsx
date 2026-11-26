import { Suspense, lazy, type ComponentType, type ReactNode } from "react";

type Options = { ssr?: boolean; loading?: () => ReactNode };

/** A lazily loaded component, rendered inside its own Suspense boundary. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function dynamic<P extends object>(loader: () => Promise<{ default: ComponentType<P> }>, options: Options = {}) {
  const Lazy = lazy(loader);
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={options.loading ? options.loading() : null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
