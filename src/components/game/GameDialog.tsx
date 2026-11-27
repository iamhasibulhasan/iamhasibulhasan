import { Fragment, lazy, Suspense, useCallback, useRef, useState, type ComponentType, type LazyExoticComponent } from "react";
import { GAMES, type GameId } from "@/components/game/games";
import { FIELD_CLASS, type GameProps } from "@/components/game/shared";
import { guideVisit, type Rect } from "@/lib/guide/transit";
import { GUIDE_NAME } from "@/lib/guide/identity";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
            "fixed left-1/2 top-1/2 z-[120] max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
            "rounded-3xl border border-foreground/10 p-4 glass-strong glass-overlay shadow-accent-card outline-none sm:p-6",
            "data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="truncate font-display text-xl font-semibold text-foreground">{current.title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">{current.blurb}</DialogPrimitive.Description>
            <DialogPrimitive.Close
              aria-label="Close game"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* While a game's code loads, an empty field of the same size holds its place. */}
          <Suspense fallback={<div className={cn(FIELD_CLASS, "w-full animate-pulse rounded-2xl border border-foreground/10 bg-foreground/5")} />}>
            {open && <Game key={game} onAnnounce={announce} present={present} autoEnter={!present && guideVisit.isVisiting()} onEnter={enter} spriteRectRef={spriteRectRef} />}
          </Suspense>

          <Manual game={game} />
          <p className="sr-only" role="status" aria-live="polite">
            {announcement}
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
