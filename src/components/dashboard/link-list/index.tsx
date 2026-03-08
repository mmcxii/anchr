"use client";

import { deleteLink } from "@/app/(dashboard)/dashboard/actions";
import { LinkForm } from "@/components/dashboard/link-form";
import type { linksTable } from "@/lib/db/schema/link";
import { ExternalLink, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

export type LinkItem = typeof linksTable.$inferSelect;

export type LinkListProps = {
  links: LinkItem[];
};

export const LinkList: React.FC<LinkListProps> = (props) => {
  const { links } = props;

  //* State
  const { t } = useTranslation();
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<null | string>(null);
  const [deletingId, setDeletingId] = React.useState<null | string>(null);

  //* Handlers
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteLink(id);
    setDeletingId(null);
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  const handleEditSuccess = () => {
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-lg font-semibold">{t("links")}</h1>
        {!showAddForm && (
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            onClick={() => setShowAddForm(true)}
            type="button"
          >
            <Plus className="size-4" />
            {t("addLink")}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && <LinkForm onCancel={() => setShowAddForm(false)} onSuccess={handleAddSuccess} />}

      {/* Empty state */}
      {links.length === 0 && !showAddForm && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <div className="bg-muted flex size-14 items-center justify-center rounded-full">
            <Link2 className="text-muted-foreground size-6" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">{t("noLinksYet")}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t("addLinksToGetStarted")}</p>
          </div>
        </div>
      )}

      {/* Link list */}
      {links.length > 0 && (
        <ul className="flex flex-col gap-2">
          {links.map((link) => {
            if (editingId === link.id) {
              return (
                <li key={link.id}>
                  <LinkForm
                    defaultValues={{ id: link.id, title: link.title, url: link.url }}
                    onCancel={() => setEditingId(null)}
                    onSuccess={handleEditSuccess}
                  />
                </li>
              );
            }

            return (
              <li className="bg-card border-border flex items-center gap-4 rounded-lg border px-4 py-3" key={link.id}>
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
                  <button
                    aria-label={t("editLink")}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-2 transition-colors"
                    onClick={() => setEditingId(link.id)}
                    type="button"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label={t("deleteLink")}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-2 transition-colors disabled:opacity-50"
                    disabled={deletingId === link.id}
                    onClick={() => handleDelete(link.id)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
