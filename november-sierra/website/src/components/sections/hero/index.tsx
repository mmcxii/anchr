"use client";

import { ANIMATION_PHASES, TAGLINE_WORDS, type AnimationPhase } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import * as React from "react";

export const Hero: React.FC = () => {
  //* State
  const [phase, setPhase] = React.useState<AnimationPhase>("ns");

  //* Variables
  const phaseIndex = ANIMATION_PHASES.indexOf(phase);
  const barsVisible = phaseIndex >= 1;
  const nameRevealed = phaseIndex >= 2;
  const taglineVisible = phaseIndex >= 3;
  const scrollVisible = phaseIndex >= 4;

  //* Effects
  React.useEffect(() => {
    const timers = [
      setTimeout(() => {
        setPhase("bars");
      }, 800),
      setTimeout(() => {
        setPhase("full-name");
      }, 1600),
      setTimeout(() => {
        setPhase("tagline");
      }, 2800),
      setTimeout(() => {
        setPhase("complete");
      }, 4200),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <section className="relative flex h-dvh items-center justify-center overflow-hidden" id="hero">
      {/* Ken Burns background */}
      <div className="absolute inset-0">
        <div className="ken-burns absolute inset-0 bg-[url('/images/hero-forest.jpg')] bg-cover bg-center" />
        <div className="bg-ns-hero-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-4 text-center">
        {/* Top bar */}
        <div
          className={cn(
            "wordmark-bar bg-ns-text-heading mb-4 h-px",
            { "opacity-0": !barsVisible, "opacity-100": barsVisible },
            { "w-8": !nameRevealed, "w-full": nameRevealed },
          )}
        />

        {/* Wordmark */}
        <h1 className="text-ns-text-heading relative font-serif text-[clamp(2rem,6vw,4.5rem)] tracking-widest whitespace-nowrap">
          <span className="inline-block overflow-hidden">
            <span>{"N"}</span>
            <span
              className={cn("wordmark-letters", {
                "max-w-0 opacity-0": !nameRevealed,
                "max-w-[10em] opacity-100": nameRevealed,
              })}
            >
              {"OVEMBER"}
            </span>
          </span>
          <span className={cn("wordmark-spacer", { "w-[0.1em]": !nameRevealed, "w-[0.3em]": nameRevealed })} />
          <span className="inline-block overflow-hidden">
            <span>{"S"}</span>
            <span
              className={cn("wordmark-letters", {
                "max-w-0 opacity-0": !nameRevealed,
                "max-w-[10em] opacity-100": nameRevealed,
              })}
            >
              {"IERRA"}
            </span>
          </span>
        </h1>

        {/* Bottom bar */}
        <div
          className={cn(
            "wordmark-bar bg-ns-text-heading mt-4 h-px",
            { "opacity-0": !barsVisible, "opacity-100": barsVisible },
            { "w-8": !nameRevealed, "w-full": nameRevealed },
          )}
        />

        {/* Tagline */}
        <div className="mt-8 flex gap-3 font-serif">
          {TAGLINE_WORDS.map((word, i) => {
            return (
              <span
                className={cn("text-ns-text text-lg tracking-wide italic transition-all duration-500 md:text-xl", {
                  "-translate-y-2 opacity-0": !taglineVisible,
                  "translate-y-0 opacity-100": taglineVisible,
                })}
                key={word}
                style={{ transitionDelay: `${i * 0.4}s` }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        aria-label="Scroll to about section"
        className={cn(
          "pulse-arrow text-ns-text absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500",
          { "opacity-0": !scrollVisible, "opacity-100": scrollVisible },
        )}
        href="#about"
      >
        <ChevronDown size={32} />
      </a>
    </section>
  );
};
