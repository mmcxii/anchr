"use client";

import {
  addFirstLink,
  checkUsernameAvailability,
  completeOnboarding,
  updateTheme,
  updateUsername,
} from "@/app/onboarding/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UsernameValues, usernameSchema } from "@/lib/schemas/username";
import { cn } from "@/lib/utils";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Check, ExternalLink, Loader2, Palette, PartyPopper, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type OnboardingFormProps = {
  defaultUsername: string;
};

const STEPS = ["username", "link", "theme", "complete"] as const;
type Step = (typeof STEPS)[number];

const THEMES = [
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

export const OnboardingForm: React.FC<OnboardingFormProps> = (props) => {
  const { defaultUsername } = props;

  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedTheme, setSelectedTheme] = React.useState("minimal");
  const [linkTitle, setLinkTitle] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkError, setLinkError] = React.useState<null | string>(null);

  // Username form
  const usernameForm = useForm<UsernameValues>({
    defaultValues: { username: defaultUsername },
    mode: "onChange",
    resolver: standardSchemaResolver(usernameSchema),
  });
  const [availability, setAvailability] = React.useState<"available" | "checking" | "idle" | "taken">("idle");

  //* Refs
  const debounceRef = React.useRef<null | ReturnType<typeof setTimeout>>(null);

  //* Variables
  const currentStep: Step = STEPS.includes(stepParam as Step) ? (stepParam as Step) : "username";
  const stepIndex = STEPS.indexOf(currentStep);
  const username = usernameForm.watch("username");
  const hasValidationError = !!usernameForm.formState.errors.username;

  //* Handlers
  const goToStep = (step: Step) => {
    router.push(`/onboarding?step=${step}`);
  };

  const handleUsernameSubmit = async (data: UsernameValues) => {
    const result = await updateUsername(data.username);

    if (result.success) {
      goToStep("link");
    } else if (result.error) {
      usernameForm.setError("root", { message: t(result.error) });
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    if (!linkTitle.trim() || !linkUrl.trim()) {
      setLinkError(t("somethingWentWrongPleaseTryAgain"));
      return;
    }

    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    setSubmitting(true);
    const result = await addFirstLink(linkTitle.trim(), url);
    setSubmitting(false);

    if (result.success) {
      goToStep("theme");
    } else {
      setLinkError(t("somethingWentWrongPleaseTryAgain"));
    }
  };

  const handleThemeSubmit = async () => {
    setSubmitting(true);
    await updateTheme(selectedTheme);
    await completeOnboarding();
    setSubmitting(false);
    goToStep("complete");
  };

  const handleSkipLink = async () => {
    goToStep("theme");
  };

  const handleSkipTheme = async () => {
    setSubmitting(true);
    await completeOnboarding();
    setSubmitting(false);
    goToStep("complete");
  };

  //* Effects
  React.useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (hasValidationError || username.length < 3) {
      setAvailability("idle");
      return;
    }

    setAvailability("checking");

    debounceRef.current = setTimeout(async () => {
      const result = await checkUsernameAvailability(username);
      setAvailability(result.available ? "available" : "taken");
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [username, hasValidationError]);

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      {/* Progress indicator */}
      {currentStep !== "complete" && (
        <div className="flex items-center justify-center gap-2">
          {STEPS.slice(0, 3).map((step, i) => (
            <div
              className={cn("h-1.5 w-12 rounded-full transition-colors", {
                "bg-muted": i > stepIndex,
                "bg-primary": i <= stepIndex,
              })}
              key={step}
            />
          ))}
        </div>
      )}

      {/* Step 1: Username */}
      {currentStep === "username" && (
        <>
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">{t("chooseYourUsername")}</h1>
            <p className="text-muted-foreground text-sm">{t("thisWillBeYourUniqueAnchrUrl")}</p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={usernameForm.handleSubmit(handleUsernameSubmit)}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">{t("username")}</Label>
              <div className="relative">
                <Input
                  autoComplete="username"
                  autoFocus
                  disabled={usernameForm.formState.isSubmitting}
                  id="username"
                  placeholder="your_username"
                  {...usernameForm.register("username")}
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {availability === "checking" && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
                  {availability === "available" && <Check className="size-4 text-emerald-500" />}
                  {availability === "taken" && <X className="size-4 text-red-500" />}
                </div>
              </div>
              {usernameForm.formState.errors.username && (
                <p className="text-destructive text-xs">{usernameForm.formState.errors.username.message}</p>
              )}
              {availability === "taken" && !hasValidationError && (
                <p className="text-destructive text-xs">{t("thisUsernameIsAlreadyTaken")}</p>
              )}
              {availability === "available" && !hasValidationError && (
                <p className="text-xs text-emerald-500">{t("usernameIsAvailable")}</p>
              )}
              <p className="text-muted-foreground text-xs">anchr.to/{username || "username"}</p>
            </div>

            {usernameForm.formState.errors.root && (
              <p className="text-destructive text-center text-xs">{usernameForm.formState.errors.root.message}</p>
            )}

            <button
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
              disabled={usernameForm.formState.isSubmitting || availability !== "available"}
              type="submit"
            >
              {usernameForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
            </button>
          </form>
        </>
      )}

      {/* Step 2: Add first link */}
      {currentStep === "link" && (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <ExternalLink className="text-muted-foreground size-8" />
            <h1 className="text-2xl font-semibold tracking-tight">{t("addYourFirstLink")}</h1>
            <p className="text-muted-foreground text-sm">{t("whatShouldVisitorsSeFirst")}</p>
          </div>

          <form className="flex flex-col gap-6" onSubmit={handleLinkSubmit}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="linkTitle">{t("title")}</Label>
                <Input
                  autoFocus
                  disabled={submitting}
                  id="linkTitle"
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="My Website"
                  value={linkTitle}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="linkUrl">{t("url")}</Label>
                <Input
                  disabled={submitting}
                  id="linkUrl"
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                  value={linkUrl}
                />
              </div>
            </div>

            {linkError && <p className="text-destructive text-center text-xs">{linkError}</p>}

            <div className="flex flex-col gap-2">
              <button
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
                disabled={submitting || !linkTitle.trim() || !linkUrl.trim()}
                type="submit"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
              </button>
              <button
                className="text-muted-foreground hover:text-foreground inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
                disabled={submitting}
                onClick={handleSkipLink}
                type="button"
              >
                {t("skip")}
              </button>
            </div>
          </form>
        </>
      )}

      {/* Step 3: Pick a theme */}
      {currentStep === "theme" && (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <Palette className="text-muted-foreground size-8" />
            <h1 className="text-2xl font-semibold tracking-tight">{t("pickATheme")}</h1>
            <p className="text-muted-foreground text-sm">{t("youCanAlwaysChangeThisLater")}</p>
          </div>

          <div className="flex flex-col gap-3">
            {THEMES.map((theme) => (
              <button
                className={cn("flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors", {
                  "border-border hover:border-muted-foreground/40": selectedTheme !== theme.id,
                  "border-primary": selectedTheme === theme.id,
                })}
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                type="button"
              >
                <div
                  className={cn("flex size-10 shrink-0 items-center justify-center rounded-md border", theme.boxClass)}
                >
                  <span className={cn("text-xs font-bold", theme.letterClass)}>A</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{theme.label}</span>
                </div>
                {selectedTheme === theme.id && <Check className="text-primary ml-auto size-4" />}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
              disabled={submitting}
              onClick={handleThemeSubmit}
              type="button"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
            </button>
            <button
              className="text-muted-foreground hover:text-foreground inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
              disabled={submitting}
              onClick={handleSkipTheme}
              type="button"
            >
              {t("skip")}
            </button>
          </div>
        </>
      )}

      {/* Step 4: Complete */}
      {currentStep === "complete" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <PartyPopper className="text-primary size-12" />
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("yourPageIsLive")}</h1>
            <p className="text-muted-foreground text-sm">{t("youreAllSetStartSharingYourPage")}</p>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Link
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
              href="/dashboard"
            >
              {t("goToDashboard")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
