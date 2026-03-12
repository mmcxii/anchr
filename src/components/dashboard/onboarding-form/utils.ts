export const STEPS = ["username", "link", "theme", "complete"] as const;
export type Step = (typeof STEPS)[number];

export const THEMES = [
  {
    boxClass: "border-brand-gold bg-brand-deep-navy",
    id: "minimal",
    label: "Dark Depths",
    letterClass: "text-brand-gold",
  },
  {
    boxClass: "border-brand-deep-navy bg-brand-cream",
    id: "stateroom",
    label: "Stateroom",
    letterClass: "text-brand-deep-navy",
  },
  { boxClass: "border-[#c49480] bg-[#080606]", id: "obsidian", label: "Obsidian", letterClass: "text-[#c49480]" },
  { boxClass: "border-[#28a070] bg-[#dff5ec]", id: "seafoam", label: "Seafoam", letterClass: "text-[#1a7050]" },
] as const;
