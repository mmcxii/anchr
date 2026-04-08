"use client";

import * as React from "react";

export function useSectionReveal(): React.RefObject<null | HTMLDivElement> {
  //* Refs
  const ref = React.useRef<HTMLDivElement>(null);

  //* Effects
  React.useEffect(() => {
    const element = ref.current;
    if (element == null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return ref;
}
