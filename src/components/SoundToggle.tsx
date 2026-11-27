import { useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toggleGuideSound, useGuideSound, type GuideSound } from "@/lib/guide/voice";
import { cn } from "@/lib/utils";

/**
 * Sound on and off, from the navbar. Until the browser lets the page make a
 * sound (the visitor's first click, tap or key), it shows muted, and a tap on
 * it starts the sound: that tap is what the browser waits for.
 */
export function SoundToggle({ className }: { className?: string }) {
  const sound = useGuideSound();
  const playing = sound === "on";
  // What it showed when pressed (see toggleGuideSound): a first press starts the
  // sound on its way to the click.
  const seen = useRef<GuideSound | null>(null);
  const remember = () => {
    seen.current = sound;
  };
  const label = playing ? "Turn sound off" : "Turn sound on";
  return (
    <button
      type="button"
      onPointerDown={remember}
      onKeyDown={remember}
      onClick={() => {
        toggleGuideSound(seen.current ?? sound);
        seen.current = null;
      }}
      aria-label={label}
      aria-pressed={playing}
      title={label}
      className={cn(
        "flex items-center justify-center rounded-lg transition-all duration-300 active:scale-95",
        playing ? "text-primary-text hover:bg-foreground/10" : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
        className,
      )}
    >
      {playing ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
    </button>
  );
}
