import { cn } from "@/lib/utils";
import { SIZE_MAP } from "./constants";

export type SiteWordmarkProps = {
  className?: string;
  size?: "lg" | "md" | "sm" | "xl" | "xs";
};

export const SiteWordmark: React.FC<SiteWordmarkProps> = (props) => {
  const { className, size = "md" } = props;

  return (
    <span className={cn("font-bold uppercase", { "m-accent-color": !className }, className, SIZE_MAP[size])}>
      Anchr
    </span>
  );
};
