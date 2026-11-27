import type { PointerEvent, Ref } from "react";
import { FIELD_CLASS, type Phase } from "@/components/game/shared";
import { cn } from "@/lib/utils";

/** A game's own words for the card between rounds: [title, how to go]. */
export type FieldText = {
  ready: readonly [string, string];
  over: readonly [string, string];
};

type Handler = (event: PointerEvent<HTMLDivElement>) => void;

/**
 * The play area every game uses: the same box in every game (FIELD_CLASS),
 * the canvas filling it, and a small card over it between rounds (ready,
 * paused, game over). It takes keyboard focus, so the keys play at once.
 */
export function GameField({
  surfaceRef,
  canvasRef,
  label,
  phase,
  text,
  score,
  best,
  newBest,
  low = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  surfaceRef: Ref<HTMLDivElement>;
  canvasRef: Ref<HTMLCanvasElement>;
  /** The accessible name: the game and its controls. */
  label: string;
  phase: Phase;
  text: FieldText;
  score: number;
  best: number;
  newBest: boolean;
  /** Keep the card off the middle (where the guide waits): below it before a round, above it after. */
  low?: boolean;
  onPointerDown: Handler;
  onPointerMove?: Handler;
  onPointerUp?: Handler;
}) {
  const card = phase === "ready" || phase === "paused" || phase === "over";
  return (
    <div
      ref={surfaceRef}
      tabIndex={0}
      data-game-surface
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        onPointerDown(event);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "relative w-full cursor-pointer touch-none select-none overflow-hidden rounded-2xl border border-foreground/10 bg-background/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        FIELD_CLASS,
      )}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      {card && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 flex items-center justify-center px-4 text-center",
            !low ? "inset-y-0" : phase === "over" ? "bottom-1/2 top-0" : "bottom-0 top-1/2",
          )}
        >
          <div className="rounded-2xl border border-foreground/10 bg-background/85 px-5 py-3 glass-subtle">
            {phase === "ready" && (
              <>
                <p className="font-display text-xl font-semibold text-foreground">{text.ready[0]}</p>
                <p className="text-sm text-muted-foreground">{text.ready[1]}</p>
              </>
            )}
            {phase === "paused" && (
              <>
                <p className="font-display text-xl font-semibold text-foreground">Paused</p>
                <p className="text-sm text-muted-foreground">Press Space, P or tap to carry on</p>
              </>
            )}
            {phase === "over" && (
              <>
                <p className="font-display text-xl font-semibold text-foreground">{newBest ? "New best!" : text.over[0]}</p>
                <p className="font-mono text-sm text-muted-foreground">
                  Score <span className="font-semibold text-foreground">{score}</span> · Best <span className="font-semibold text-primary-text">{best}</span>
                </p>
                <p className="text-sm text-muted-foreground">{text.over[1]}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
