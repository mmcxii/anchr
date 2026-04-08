"use client";

import { useSectionReveal } from "@/hooks/use-section-reveal";

export const About: React.FC = () => {
  //* Refs
  const ref = useSectionReveal();

  return (
    <section className="flex min-h-[50vh] items-center justify-center px-6 py-24 md:px-12" id="about">
      <div className="section-reveal max-w-2xl text-center" ref={ref}>
        <blockquote className="text-ns-text-heading font-serif text-xl leading-relaxed italic md:text-2xl lg:text-3xl">
          {"I build products with intuitive interfaces designed for people and clean APIs designed for agents."}
        </blockquote>
      </div>
    </section>
  );
};
