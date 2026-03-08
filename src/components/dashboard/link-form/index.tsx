"use client";

import { createLink, updateLink } from "@/app/(dashboard)/dashboard/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type LinkValues, linkSchema } from "@/lib/schemas/link";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type LinkFormProps = {
  defaultValues?: { id: string; title: string; url: string };
  onCancel: () => void;
  onSuccess: () => void;
};

export const LinkForm: React.FC<LinkFormProps> = (props) => {
  const { defaultValues, onCancel, onSuccess } = props;

  //* State
  const { t } = useTranslation();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LinkValues>({
    defaultValues: defaultValues ? { title: defaultValues.title, url: defaultValues.url } : undefined,
    resolver: standardSchemaResolver(linkSchema),
  });

  //* Refs
  const titleRef = React.useRef<null | HTMLInputElement>(null);

  //* Variables
  const isEditing = defaultValues != null;
  const { ref: titleRegisterRef, ...titleRegisterRest } = register("title");

  //* Effects
  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  //* Handlers
  const onSubmit = async (data: LinkValues) => {
    const result = isEditing
      ? await updateLink(defaultValues.id, data.title, data.url)
      : await createLink(data.title, data.url);

    if (!result.success) {
      setError("root", { message: t(result.error ?? "somethingWentWrongPleaseTryAgain") });
      return;
    }

    onSuccess();
  };

  return (
    <form className="bg-card border-border flex flex-col gap-4 rounded-lg border p-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="link-title">{t("title")}</Label>
        <Input
          disabled={isSubmitting}
          id="link-title"
          placeholder={t("title")}
          ref={(el) => {
            titleRegisterRef(el);
            titleRef.current = el;
          }}
          {...titleRegisterRest}
        />
        {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="link-url">{t("url")}</Label>
        <Input disabled={isSubmitting} id="link-url" placeholder="https://" type="url" {...register("url")} />
        {errors.url && <p className="text-destructive text-xs">{errors.url.message}</p>}
      </div>
      {errors.root && <p className="text-destructive text-center text-xs">{errors.root.message}</p>}
      <div className="flex justify-end gap-2">
        <button
          className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm transition-colors"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          {t("cancel")}
        </button>
        <button
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          {isEditing ? t("save") : t("addLink")}
        </button>
      </div>
    </form>
  );
};
