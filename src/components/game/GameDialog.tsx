import { Fragment, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ComponentType, type LazyExoticComponent, type ReactNode } from "react";
import { GAMES, type GameId } from "@/components/game/games";
import { FIELD_CLASS, type GameProps } from "@/components/game/shared";
import { guideVisit, type Rect } from "@/lib/guide/transit";
import { GUIDE_NAME } from "@/lib/guide/identity";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { RotateCw, X } from "lucide-react";
import { useLenisLock } from "@/hooks/useLenisLock";
import { cn } from "@/lib/utils";

// Each game's code loads the first time it is picked, never with the page.
const VIEWS: Record<GameId, LazyExoticComponent<ComponentType<GameProps>>> = {
  runner: lazy(() => import("@/components/game/RunnerGame")),
  flight: lazy(() => import("@/components/game/FlightGame")),
  trail: lazy(() => import("@/components/game/TrailGame")),
  breaker: lazy(() => import("@/components/game/BreakerGame")),
};

const focusSurface = () =>
  window.setTimeout(() => document.querySelector<HTMLElement>("[data-game-surface]")?.focus({ preventScroll: true }), 60);

/**
 * A phone (a touch screen that is narrow, or short because it is turned
 * sideways): the game takes the whole screen. Desktops and tablets keep the
 * dialog.
 */
const PHONE_QUERY = "(pointer: coarse) and (max-width: 639px), (pointer: coarse) and (max-height: 520px)";
const subscribePhone = (listener: () => void) => {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const usePhonePlay = () => useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);

/**
 * Full screen on a phone: the browser's own bars hide too where it allows a
 * page to (Android; an iPhone keeps them, and the dialog still fills the
 * screen), from opening the game until it closes.
 */
function useFullscreen(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) root.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [on]);
}

/**
 * The play area as large as the screen allows: the field keeps its shape
 * (FIELD_CLASS: 16:9, or 4:3 below `sm`), so it is as wide as fits both the
 * width and the height left under the title.
 */
function FitField({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const fit = () => {
      const aspect = window.innerWidth >= 640 ? 16 / 9 : 4 / 3;
      setWidth(Math.floor(Math.min(box.clientWidth, box.clientHeight * aspect)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="flex min-h-0 flex-1 items-center justify-center">
      <div style={{ width: width ?? "100%" }}>{children}</div>
    </div>
  );
}

/** On a phone, one line for touch instead of the keys, and (held upright) a tip to turn it. */
function TouchHint({ game }: { game: GameId }) {
  return (
    <div className="mt-3 flex flex-col items-center gap-1.5 text-center text-xs text-muted-foreground">
      <p className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-foreground/85">{GAMES[game].touch}</span>
        <span className="text-muted-foreground/50">·</span>
        <X className="h-3.5 w-3.5 text-foreground/85" aria-label="close" />
        <span>to exit</span>
      </p>
      <p className="inline-flex items-center gap-1.5 text-muted-foreground/80 landscape:hidden">
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        Turn your phone sideways for a bigger game
      </p>
    </div>
  );
}

const KEYCAP = "rounded border border-foreground/15 bg-foreground/5 px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground/85";

/** Keys as keycaps, a slash between alternatives. */
function Keys({ keys }: { keys: string[] }) {
  return keys.map((key, index) => (
    <Fragment key={key}>
      {index > 0 && <span className="text-muted-foreground/60">/</span>}
      <kbd className={KEYCAP}>{key}</kbd>
    </Fragment>
  ));
}

/**
 * Under the game: how to play it and how to leave. The same two rows for every
 * game, kept short, so the dialog is the same size whichever game is open.
 */
function Manual({ game }: { game: GameId }) {
  const { controls, goal } = GAMES[game];
  return (
    <dl className="mt-4 grid min-h-[12rem] grid-cols-1 content-start gap-x-5 gap-y-1.5 text-xs leading-relaxed text-muted-foreground sm:min-h-0 sm:grid-cols-[auto_1fr] sm:gap-y-2.5">
      <dt className="font-semibold uppercase tracking-wider text-foreground/75">How to play</dt>
      <dd className="space-y-1">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {controls.map((control) => (
            <span key={control.does} className="inline-flex items-center gap-1">
              <Keys keys={control.keys} />
              <span className="ml-0.5">{control.does}</span>
            </span>
          ))}
        </p>
        <p>{goal}</p>
      </dd>
      <dt className="mt-2 font-semibold uppercase tracking-wider text-foreground/75 sm:mt-0">Exit</dt>
      <dd className="flex flex-wrap items-center gap-1">
        <kbd className={KEYCAP}>Esc</kbd>
        <span>or the</span>
        <X className="h-3.5 w-3.5 text-foreground/85" aria-label="close" />
        <span>button. {GUIDE_NAME} flies back home.</span>
      </dd>
    </dl>
  );
}

/**
 * A game from the navbar's menu, in a glass dialog over the page: its name,
 * the play area (the same size for every game), and how to play and leave.
 * Which game it is belongs to the navbar; to play another, close and pick it.
 */
export default function GameDialog({ open, onOpenChange, game }: { open: boolean; onOpenChange: (open: boolean) => void; game: GameId }) {
  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((text: string) => setAnnouncement(text), []);
  const phone = usePhonePlay();
  useFullscreen(open && phone);
  // Hand wheel control back to the browser so the page does not scroll behind the game.
  useLenisLock(open);

  // The page's guide plays the games. Picked from the hover menu, it comes along from
  // beside the cursor as soon as the game is on screen; opened any other way (the
  // phone menu), it flies in from the page on the first start. It goes home on close.
  const [present, setPresent] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;
  const spriteRectRef = useRef<GameProps["spriteRectRef"]["current"]>(null);

  const enter = useCallback(async (target: Rect) => {
    await guideVisit.into(target);
    // Closed while it was on its way: it goes straight back.
    if (!openRef.current) {
      void guideVisit.home(target);
      return;
    }
    setPresent(true);
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (present) {
        const from = spriteRectRef.current?.() ?? null;
        setPresent(false);
        void guideVisit.home(from);
      } else {
        // Closed before it arrived: it heads home from beside the cursor.
        guideVisit.dismiss(true);
      }
      setAnnouncement("");
    }
    onOpenChange(next);
  };

  const current = GAMES[game];
  const Game = VIEWS[game];
  const field = (
    <Suspense fallback={<div className={cn(FIELD_CLASS, "w-full animate-pulse rounded-2xl border border-foreground/10 bg-foreground/5")} />}>
      {open && <Game key={game} onAnnounce={announce} present={present} autoEnter={!present && guideVisit.isVisiting()} onEnter={enter} spriteRectRef={spriteRectRef} />}
    </Suspense>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-black/60 glass-scrim data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          data-lenis-prevent
          // Focus the play area, so Space plays straight away instead of pressing a button.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusSurface();
          }}
          className={cn(
            "z-[120] glass-strong glass-overlay outline-none",
            "data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            phone
              ? // The whole screen, clear of the notch and the system bars.
                "fixed inset-0 flex h-[100dvh] w-full flex-col overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))]"
              : "fixed left-1/2 top-1/2 max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-foreground/10 p-4 shadow-accent-card sm:p-6 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <div className={cn("flex items-center justify-between gap-4", phone ? "mb-2" : "mb-4")}>
            <DialogPrimitive.Title className={cn("truncate font-display font-semibold text-foreground", phone ? "text-lg" : "text-xl")}>{current.title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">{current.blurb}</DialogPrimitive.Description>
            <DialogPrimitive.Close
              aria-label="Close game"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* While a game's code loads, an empty field of the same size holds its place. */}
          {phone ? (
            <>
              <FitField>{field}</FitField>
              <TouchHint game={game} />
            </>
          ) : (
            <>
              {field}
              <Manual game={game} />
            </>
          )}
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
