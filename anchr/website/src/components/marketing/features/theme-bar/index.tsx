import { useStyleRef } from "../use-style-ref";

export type ThemeBarProps = { accent: string; opacity: number };

export const ThemeBar: React.FC<ThemeBarProps> = (props) => {
  const { accent, opacity } = props;

  //* Refs
  const ref = useStyleRef({ background: accent, opacity: String(opacity) });

  return <div className="h-1 rounded-sm" ref={ref} />;
};
