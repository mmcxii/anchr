import { SiteBrandmark } from "@/components/marketing/site-brandmark";
import { Container } from "@/components/ui/container";
import { initTranslations } from "@/lib/i18n/server";
import Link from "next/link";

export const SiteHeader: React.FC = async () => {
  const { t } = await initTranslations("en-US");

  return (
    <Container as="header" className="relative z-10 flex items-center justify-between py-6">
      <Link className="group inline-flex items-center" href="/">
        <SiteBrandmark className="transition-opacity group-hover:opacity-75" size="sm" />
      </Link>
      <div className="flex items-center gap-4">
        <Link
          className="border-primary/40 text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground inline-flex h-9 items-center rounded-md border bg-transparent px-4 text-sm font-medium transition-colors"
          href="/sign-in"
        >
          {t("signIn")}
        </Link>
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
          href="/sign-up"
        >
          {t("signUp")}
        </Link>
      </div>
    </Container>
  );
};
