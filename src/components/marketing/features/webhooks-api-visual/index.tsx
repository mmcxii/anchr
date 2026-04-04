"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { EVENTS } from "./constants";

export const WebhooksApiVisual: React.FC = () => {
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % EVENTS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-5 space-y-1.5">
      {EVENTS.map((item, i) => (
        <div
          className={cn(
            "m-embed-bg-bg m-embed-border flex items-center justify-between rounded-lg px-3 py-2 transition-opacity duration-500",
            {
              "opacity-100": i === activeIdx,
              "opacity-45": i !== activeIdx,
            },
          )}
          key={item.event}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn("size-1.5 rounded-full transition-colors duration-500", {
                "m-accent-bg": i === activeIdx,
                "m-muted-bg-10": i !== activeIdx,
              })}
            />
            <span className="m-muted-70 font-mono text-[11px]">{item.event}</span>
          </div>
          <span className="m-accent-55-color font-mono text-[10px]">{item.status}</span>
        </div>
      ))}
    </div>
  );
};
