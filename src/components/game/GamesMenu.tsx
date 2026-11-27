import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { GAMES, GAME_IDS, type GameId } from "@/components/game/games";
import { guideVisit, type Point } from "@/lib/guide/transit";
import { menuSound } from "@/lib/guide/voice";

/** How long the menu waits after the pointer leaves, so a diagonal move to it doesn't close it. */
const CLOSE_DELAY_MS = 180;

/** What the guide says while the visitor picks. */
const INVITE = "Play any of the games!";
/** What the guide says for a game pointed at: one of its lines, never the one it said last time. */
const lastCheer: Partial<Record<GameId, string>> = {};
const cheer = (id: GameId) => {
  const lines = GAMES[id].cheers.filter((line) => line !== lastCheer[id]);
  const line = lines[Math.floor(Math.random() * lines.length)];
  lastCheer[id] = line;
  return line;
};

/**
 * Until the visitor opens the menu, the gamepad invites them to play (a soft
 * pulse and a buzz, see .game-invite-ring in globals.css). Once opened, it
 * rests for the rest of the visit; a new visit invites again.
 */
const OPENED_KEY = "solvorn-games-opened";
const wasOpened = () => {
  try {
    return sessionStorage.getItem(OPENED_KEY) !== null;
  } catch {
    return false;
  }
};

/**
 * The navbar's gamepad: hovering it (or focusing it, or clicking it on a
 * touch screen) opens a small glass menu of the games, each an icon and its
 * name. The page's guide comes to the cursor while it is open, cheers on the
 * game under the pointer, and goes along into the one that is clicked.
 */
export function GamesMenu({ onPlay }: { onPlay: (id: GameId) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const reduceMotion = useReducedMotion();
  const menuId = useId();
  const [inviting, setInviting] = useState(() => !wasOpened());

  const panelRef = useRef<HTMLUListElement>(null);

  /**
   * Where the guide should be for a cursor at `point`: following it left and
   * right, but kept just under the menu panel so it never covers a game.
   * (Before the panel has rendered, its height is the usual one.)
   */
  const underMenu = (point: Point): Point => {
    const panel = panelRef.current?.getBoundingClientRect();
    const button = buttonRef.current?.getBoundingClientRect();
    const bottom = panel?.bottom ?? (button ? button.bottom + 112 : point.y);
    return { x: point.x - 20, y: Math.max(point.y, bottom - 14) };
  };

  /** Beside the gamepad: where the guide waits when there is no cursor to follow (keyboard, touch). */
  const besideButton = (): Point => {
    const box = buttonRef.current?.getBoundingClientRect();
    return box ? { x: box.left + box.width / 2, y: box.bottom } : { x: window.innerWidth / 2, y: 80 };
  };

  const show = useCallback((at: Point) => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
    setInviting(false);
    try {
      sessionStorage.setItem(OPENED_KEY, "1");
    } catch {
      /* storage unavailable: it just invites again next time */
    }
    guideVisit.summon(underMenu(at), INVITE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(false);
    guideVisit.dismiss();
  }, []);
  const hideSoon = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(close, CLOSE_DELAY_MS);
  }, [close]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Esc closes it, sends the guide home and hands focus back to the gamepad.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      buttonRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const play = (id: GameId) => {
    window.clearTimeout(closeTimer.current);
    // The guide stays by the cursor until the game is on screen, then flies in.
    guideVisit.commit();
    setOpen(false);
    onPlay(id);
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(event) => event.pointerType === "mouse" && show({ x: event.clientX, y: event.clientY })}
      onPointerMove={(event) => event.pointerType === "mouse" && open && guideVisit.follow(underMenu({ x: event.clientX, y: event.clientY }))}
      onPointerLeave={(event) => event.pointerType === "mouse" && hideSoon()}
      onFocus={() => {
        if (!open) show(besideButton());
      }}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) hideSoon();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? close() : show(besideButton()))}
        aria-label="Play a game"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        className={`relative p-2 rounded-lg transition-all duration-300 active:scale-95 ${open ? "bg-primary/10 text-primary-text" : inviting ? "text-primary-text hover:bg-foreground/10" : "text-muted-foreground hover:text-primary-text hover:bg-foreground/10"}`}
      >
        {inviting && (
          <>
            <span aria-hidden="true" className="game-invite-ring" />
            <span aria-hidden="true" className="game-invite-ring" />
          </>
        )}
        <Gamepad2 className={`w-5 h-5 ${inviting ? "game-invite-pad" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            // pt-3 is the bridge between the icon and the panel: the pointer crosses it without leaving.
            className="absolute left-1/2 top-full z-[60] -translate-x-1/2 pt-3"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul ref={panelRef} className="flex gap-2 rounded-2xl border border-foreground/10 p-2 glass-nav shadow-accent-card">
              {GAME_IDS.map((id) => {
                const game = GAMES[id];
                const Icon = game.icon;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => play(id)}
                      onPointerEnter={() => {
                        menuSound(game.sound);
                        guideVisit.cheer(cheer(id));
                      }}
                      onPointerLeave={() => guideVisit.say(INVITE)}
                      // From the keyboard only: a click focuses it too, and has just had its hover.
                      onFocus={(event) => {
                        if (!event.currentTarget.matches(":focus-visible")) return;
                        menuSound(game.sound);
                        guideVisit.cheer(cheer(id));
                      }}
                      className="group flex w-28 flex-col items-center gap-2 rounded-xl px-3 py-3 text-center transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary-text transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="whitespace-nowrap text-xs font-semibold text-foreground">{game.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
