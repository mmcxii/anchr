"use client";

import type { LinkItem } from "@/components/dashboard/link-list";
import { IconButton } from "@/components/ui/icon-button";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type SortableLinkCardProps = {
  link: LinkItem;
  onDelete: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
};

export const SortableLinkCard: React.FC<SortableLinkCardProps> = (props) => {
  const { link, onDelete, onEdit } = props;

  //* State
  const { t } = useTranslation();
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });

  //* Variables
  const style: React.CSSProperties = {
    opacity: isDragging != null ? 0.5 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      className="bg-card border-border flex items-center gap-2 rounded-lg border px-2 py-3"
      ref={setNodeRef}
      // eslint-disable-next-line anchr/no-inline-style -- dnd-kit requires dynamic transform/transition via inline style
      style={style}
    >
      <button
        aria-label={t("reorder")}
        className="text-muted-foreground hover:text-foreground shrink-0 cursor-grab touch-none p-1 active:cursor-grabbing"
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-card-foreground truncate text-sm font-medium">{link.title}</p>
        <a
          className="text-muted-foreground flex items-center gap-1 truncate text-xs hover:underline"
          href={link.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-3 shrink-0" />
          {link.url}
        </a>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <IconButton aria-label={t("editLink")} onClick={() => onEdit(link)}>
          <Pencil className="size-4" />
        </IconButton>
        <IconButton aria-label={t("deleteLink")} onClick={() => onDelete(link)} variant="destructive">
          <Trash2 className="size-4" />
        </IconButton>
      </div>
    </li>
  );
};
