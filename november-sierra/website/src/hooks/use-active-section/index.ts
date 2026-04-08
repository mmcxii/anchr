"use client";

import { SECTIONS, type SectionId } from "@/lib/constants";
import * as React from "react";

export function useActiveSection(): SectionId {
  //* State
  const [active, setActive] = React.useState<SectionId>("hero");

  //* Effects
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => {
            return entry.isIntersecting;
          })
          .sort((a, b) => {
            return b.intersectionRatio - a.intersectionRatio;
          });

        if (visible.length > 0) {
          setActive(visible[0].target.id as SectionId);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    SECTIONS.forEach((id) => {
      const element = document.getElementById(id);
      if (element != null) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return active;
}
