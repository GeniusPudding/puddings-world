"use client";

import { useState } from "react";

/** A record whose grooves turn while its song plays. */
export function Disc({
  spinning,
  className = "",
  vtName,
}: {
  spinning: boolean;
  className?: string;
  /** Set where the disc a card's opening lands. */
  vtName?: string;
}) {
  return (
    <span
      aria-hidden
      data-vt="disc"
      style={vtName ? { viewTransitionName: vtName } : undefined}
      data-spinning={spinning || undefined}
      className={`lyric-disc pointer-events-none block rounded-full ${className}`}
    />
  );
}

/** The detail page's record and player; songs without one yet say so. */
export function LyricPlayer({ audio }: { audio?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="mt-8 flex items-center gap-5">
      <Disc spinning={playing} vtName="musing-disc" className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
      {audio ? (
        <audio
          controls
          preload="none"
          src={audio}
          className="w-full"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      ) : (
        <p className="font-mono text-xs italic text-ink-muted">♪ recording coming soon</p>
      )}
    </div>
  );
}
