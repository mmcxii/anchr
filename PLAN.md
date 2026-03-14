# ANC-41: Add Bulk Link Actions

## Overview

Add multi-select capability to the link list with a bulk action bar for delete, hide, and show operations.

## Files

| File                                                    | Action                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/components/ui/checkbox/index.tsx`                  | **Create** — Radix UI checkbox component                                        |
| `src/app/(dashboard)/dashboard/actions.ts`              | **Edit** — Add `bulkDeleteLinks` and `bulkUpdateVisibility` server actions      |
| `src/components/dashboard/sortable-link-card/index.tsx` | **Edit** — Add checkbox with selection state                                    |
| `src/components/dashboard/link-list/index.tsx`          | **Edit** — Add selection state, select-all, bulk action bar, bulk delete dialog |
| `src/lib/i18n/locales/en-US.json`                       | **Edit** — Add translation keys                                                 |

## Changes

### 1. Create Checkbox component

New `src/components/ui/checkbox/index.tsx` using `@radix-ui/react-checkbox` with a check icon from lucide. Follows existing UI component patterns (cva, cn, data-slot).

### 2. Server actions (`actions.ts`)

**`bulkDeleteLinks(ids: string[])`**

- Auth + ownership check (verify all IDs belong to user via `inArray`)
- Delete all matching links in one query
- Revalidate `/dashboard`

**`bulkUpdateVisibility(ids: string[], visible: boolean)`**

- Auth + ownership check
- Set `visible` to the provided value for all matching links
- Revalidate `/dashboard`

Both follow the existing pattern: auth guard → ownership verification → single query → revalidate → return `ActionResult`.

### 3. SortableLinkCard updates

Add two new optional props:

- `isSelected?: boolean`
- `onSelect?: (link: LinkItem) => void`

When `onSelect` is provided, render a checkbox before the drag handle. The checkbox `checked` state is driven by `isSelected`. Clicking the checkbox calls `onSelect(link)`. Add a selected visual state (e.g. `ring-2 ring-primary/30`).

### 4. LinkList updates

**Selection state:**

- `selectedIds: Set<string>` — tracks which links are selected
- Selection clears on any successful bulk action or when dialog closes

**Header changes:**

- When links exist, add a "Select all" checkbox to the left of the h1
- Checkbox is indeterminate when some (but not all) links are selected, checked when all are selected

**Bulk action bar:**

- Shown when `selectedIds.size > 0`, replaces or overlays the header area
- Shows: selected count, "Delete" button (destructive), "Hide" button, "Show" button, and a "Deselect all" / X button
- Animated in/out with a simple transition

**Bulk delete dialog:**

- Reuses existing dialog pattern (like single delete)
- Message interpolates the count: "Are you sure you want to delete {{count}} links? This action cannot be undone."
- On confirm: call `bulkDeleteLinks(ids)`, optimistically remove from `orderedLinks`, clear selection, show toast

**Bulk hide/show:**

- Call `bulkUpdateVisibility(ids, false)` or `bulkUpdateVisibility(ids, true)`
- Optimistic update on `orderedLinks`
- Toast on success, revert on error
- Clear selection after action

### 5. Translation keys

```
selectAll → "Select all"
deselectAll → "Deselect all"
{{count}}Selected → "{{count}} selected"
deleteSelected → "Delete selected"
hideSelected → "Hide selected"
showSelected → "Show selected"
areYouSureYouWantToDelete{{count}}LinksThisActionCannotBeUndone → "Are you sure you want to delete {{count}} links? This action cannot be undone."
{{count}}LinksDeleted → "{{count}} links deleted."
{{count}}LinksHidden → "{{count}} links hidden."
{{count}}LinksVisible → "{{count}} links visible."
```

## Dependencies

- `@radix-ui/react-checkbox` — needs to be installed
