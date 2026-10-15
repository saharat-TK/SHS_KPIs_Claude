import { Badge } from "@/components/ui";

export const DRAFT_BADGE_TITLE =
  "Draft: not in performance records until it is first saved in the KPI editor";

/** The compact "D" shown after a draft KPI's name (LibraryKpi.isDraft). The
 *  letter is hidden from screen readers in favour of the word "draft". */
export function DraftBadge({ title = DRAFT_BADGE_TITLE }: { title?: string }) {
  return (
    <span title={title} className="inline-flex shrink-0 align-middle">
      <Badge tone="warning" className="px-[6px] py-0 leading-[18px]">
        <span aria-hidden>D</span>
        <span className="sr-only">draft</span>
      </Badge>
    </span>
  );
}
