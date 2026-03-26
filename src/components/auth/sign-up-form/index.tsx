"use client";

import { SiteWordmark } from "@/components/marketing/site-wordmark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { type SignUpValues, type VerifyEmailValues, signUpSchema, verifyEmailSchema } from "@/lib/schemas/auth";
import { useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";

export const SignUpForm: React.FC = () => {
  //* State
  const { t } = useTranslation();
  const router = useRouter();
  const { signUp } = useSignUp();
  const [verifying, setVerifying] = React.useState(false);
  const signUpForm = useForm<SignUpValues>({ resolver: standardSchemaResolver(signUpSchema) });
  const verifyForm = useForm<VerifyEmailValues>({ resolver: standardSchemaResolver(verifyEmailSchema) });

  //* Handlers
  const handleClerkError = (form: { setError: (name: "root", error: { message: string }) => void }, err: unknown) => {
    if (isClerkAPIResponseError(err)) {
      for (const e of err.errors) {
        form.setError("root", { message: e.longMessage ?? e.message });
      }
    } else {
      form.setError("root", { message: t("somethingWentWrongPleaseTryAgain") });
    }
  };

  const finalizeSignUp = async () => {
    await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl("/onboarding");
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  };

  const onSignUp = async (data: SignUpValues) => {
    try {
      const { error } = await signUp.password({ emailAddress: data.email, password: data.password });

      if (error != null) {
        signUpForm.setError("root", { message: error.longMessage ?? error.message });
        return;
      }

      await signUp.verifications.sendEmailCode();
      setVerifying(true);
    } catch (err) {
      handleClerkError(signUpForm, err);
    }
  };

  const onVerify = React.useCallback(
    async (data: VerifyEmailValues) => {
      try {
        const { error } = await signUp.verifications.verifyEmailCode({ code: data.code });

        if (error != null) {
          verifyForm.setError("root", { message: error.longMessage ?? error.message });
          verifyForm.setValue("code", "");
          return;
        }

        if (signUp.status === "complete") {
          await finalizeSignUp();
          return;
        }
      } catch (err) {
        handleClerkError(verifyForm, err);
        verifyForm.setValue("code", "");
      }
    },
    [signUp, verifyForm],
  );

  const codeValue = verifyForm.watch("code");

  const handleOtpOnChange = (value: string) => {
    verifyForm.setValue("code", value, { shouldValidate: true });
  };

  const handleResendCode = async () => {
    verifyForm.clearErrors("root");
    try {
      await signUp.verifications.sendEmailCode();
    } catch (err) {
      handleClerkError(verifyForm, err);
    }
  };

  //* Effects
  React.useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref != null) {
      localStorage.setItem("anchr_referral_code", ref);
    }
  }, []);

  React.useEffect(() => {
    if (/^\d{6}$/.test(codeValue) && !verifyForm.formState.isSubmitting) {
      void verifyForm.handleSubmit(onVerify)();
    }
  }, [codeValue, onVerify, verifyForm]);

  if (verifying) {
    return (
      <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="verify" variant="featured">
        <div className="flex flex-col items-center">
          <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
          <SiteWordmark size="xl" />
        </div>
        <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
          <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("checkYourEmail")}</CardTitle>
          <CardDescription className="text-[rgb(var(--m-muted))]">{t("enterTheCodeWeSentToYourEmail")}</CardDescription>
        </CardHeader>
        <CardContent className="flex w-full max-w-sm flex-col items-center pt-6">
          <InputOTP
            autoComplete="one-time-code"
            disabled={verifyForm.formState.isSubmitting}
            maxLength={6}
            onChange={handleOtpOnChange}
            value={codeValue}
          >
            <InputOTPGroup>
              {[0, 1, 2].map((i) => (
                <InputOTPSlot
                  className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))]"
                  index={i}
                  key={i}
                />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator className="text-[rgb(var(--m-muted))]" />
            <InputOTPGroup>
              {[3, 4, 5].map((i) => (
                <InputOTPSlot
                  className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))]"
                  index={i}
                  key={i}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {verifyForm.formState.isSubmitting && (
            <Loader2 className="mt-4 size-4 animate-spin text-[rgb(var(--m-muted))]" />
          )}
          {verifyForm.formState.errors.code != null && (
            <p className="mt-2 text-xs text-[rgb(var(--m-accent))]">{verifyForm.formState.errors.code.message}</p>
          )}
          {verifyForm.formState.errors.root != null && (
            <p className="mt-2 text-center text-xs text-[rgb(var(--m-accent))]">
              {verifyForm.formState.errors.root.message}
            </p>
          )}
          <Button
            className="mt-4 w-full"
            disabled={verifyForm.formState.isSubmitting}
            onClick={handleResendCode}
            type="button"
            variant="tertiary"
          >
            {t("resendCode")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full w-full items-center gap-0 rounded-none pt-8 pb-8" key="sign-up" variant="featured">
      <div className="flex flex-col items-center">
        <span className="tracking-anc-caps-extra text-xs text-[rgb(var(--m-muted))] uppercase">{t("welcomeTo")}</span>
        <SiteWordmark size="xl" />
      </div>
      <CardHeader className="mt-[8vh] w-full max-w-sm items-center text-center">
        <CardTitle className="text-xl text-[rgb(var(--m-text))]">{t("createAnAccount")}</CardTitle>
        <CardDescription className="text-[rgb(var(--m-muted))]">{t("startBuildingYourPage")}</CardDescription>
      </CardHeader>
      <CardContent className="w-full max-w-sm pt-6">
        <form className="flex flex-col gap-4" onSubmit={signUpForm.handleSubmit(onSignUp)}>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="email">
              {t("email")}
            </Label>
            <Input
              autoComplete="email"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={signUpForm.formState.isSubmitting}
              id="email"
              placeholder="you@example.com"
              type="email"
              {...signUpForm.register("email")}
            />
            {signUpForm.formState.errors.email != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{signUpForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-[rgb(var(--m-text))]" htmlFor="password">
              {t("password")}
            </Label>
            <Input
              autoComplete="new-password"
              className="border-[rgb(var(--m-muted))]/20 bg-[var(--m-embed-bg)] text-[rgb(var(--m-text))] placeholder:text-[rgb(var(--m-muted))]/50 focus-visible:border-[rgb(var(--m-accent))]/50 focus-visible:ring-[rgb(var(--m-accent))]/20"
              disabled={signUpForm.formState.isSubmitting}
              id="password"
              type="password"
              {...signUpForm.register("password")}
            />
            {signUpForm.formState.errors.password != null && (
              <p className="text-xs text-[rgb(var(--m-accent))]">{signUpForm.formState.errors.password.message}</p>
            )}
          </div>
          {signUpForm.formState.errors.root != null && (
            <p className="text-center text-xs text-[rgb(var(--m-accent))]">
              {signUpForm.formState.errors.root.message}
            </p>
          )}
          <Button className="w-full" disabled={signUpForm.formState.isSubmitting} type="submit">
            {signUpForm.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : t("continue")}
          </Button>
          <div className="-mt-4" id="clerk-captcha" />
        </form>
      </CardContent>
      <CardFooter className="w-full max-w-sm justify-center pt-6">
        <p className="text-sm text-[rgb(var(--m-muted))]">
          <Trans
            components={{
              1: (
                <Link
                  className="font-medium text-[rgb(var(--m-accent))] underline underline-offset-4"
                  href="/sign-in"
                />
              ),
            }}
            i18nKey="alreadyHaveAnAccountSignIn"
          />
        </p>
      </CardFooter>
    </Card>
  );
};
