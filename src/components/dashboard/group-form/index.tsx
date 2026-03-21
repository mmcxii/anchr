"use client";

import { createGroup, updateGroupTitle } from "@/app/(dashboard)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type GroupValues, groupSchema } from "@/lib/schemas/link-group";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

export type GroupFormProps = {
  defaultValues?: { id: string; title: string };
  onSuccess: () => void;
};

export const GroupForm: React.FC<GroupFormProps> = (props) => {
  const { defaultValues, onSuccess } = props;

  //* State
  const { t } = useTranslation();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<GroupValues>({
    defaultValues: defaultValues != null ? { title: defaultValues.title } : undefined,
    resolver: standardSchemaResolver(groupSchema),
  });

  //* Refs
  const titleRef = React.useRef<null | HTMLInputElement>(null);

  //* Variables
  const isEditing = defaultValues != null;
  const { ref: titleRegisterRef, ...titleRegisterRest } = register("title");

  //* Handlers
  const onSubmit = async (data: GroupValues) => {
    const result = isEditing ? await updateGroupTitle(defaultValues.id, data.title) : await createGroup(data.title);

    if (!result.success) {
      setError("root", { message: t(result.error ?? "somethingWentWrongPleaseTryAgain") });
      return;
    }

    onSuccess();
  };

  //* Effects
  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="group-title">{t("groupName")}</Label>
        <Input
          disabled={isSubmitting}
          id="group-title"
          placeholder={t("groupName")}
          ref={(el) => {
            titleRegisterRef(el);
            titleRef.current = el;
          }}
          {...titleRegisterRest}
        />
        {errors.title?.message != null && <p className="text-destructive text-xs">{t(errors.title.message)}</p>}
      </div>
      {errors.root != null && <p className="text-destructive text-center text-xs">{errors.root.message}</p>}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
        <Button disabled={isSubmitting} type="submit" variant="primary">
          {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
          {t("save")}
        </Button>
      </div>
    </form>
  );
};
