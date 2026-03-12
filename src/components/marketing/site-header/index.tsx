import { SiteBrandmark } from "@/components/marketing/site-brandmark";
import Link from "next/link";

export const SiteHeader: React.FC = () => {
  return (
    <header className="relative z-10 px-6 py-6">
      <div className="mx-auto max-w-6xl">
        <Link className="group inline-flex items-center" href="/">
          <SiteBrandmark className="transition-opacity group-hover:opacity-75" size="sm" />
        </Link>
      </div>
    </header>
  );
};
