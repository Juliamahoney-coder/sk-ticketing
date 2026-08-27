import { TicketPriority, TicketStatus } from "@/app/generated/prisma/client";

// Central mapping of ticket enums to display label + badge/text tone, so
// list and detail pages render status/priority identically instead of
// each re-deriving label/color logic.

export const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: "Offen",
  [TicketStatus.IN_PROGRESS]: "In Bearbeitung",
  [TicketStatus.CLOSED]: "Geschlossen",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: "Niedrig",
  [TicketPriority.MEDIUM]: "Mittel",
  [TicketPriority.HIGH]: "Hoch",
  [TicketPriority.URGENT]: "Dringend",
};

export type BadgeVariant = "badgeAccent" | "badgeWarning" | "badgeSuccess" | "badgeNeutral";
export type PriorityVariant = "priorityLow" | "priorityMedium" | "priorityHigh" | "priorityUrgent";

export function statusBadgeVariant(status: TicketStatus): BadgeVariant {
  switch (status) {
    case TicketStatus.OPEN:
      return "badgeAccent";
    case TicketStatus.IN_PROGRESS:
      return "badgeWarning";
    case TicketStatus.CLOSED:
      return "badgeSuccess";
  }
}

export function priorityVariant(priority: TicketPriority): PriorityVariant {
  switch (priority) {
    case TicketPriority.LOW:
      return "priorityLow";
    case TicketPriority.MEDIUM:
      return "priorityMedium";
    case TicketPriority.HIGH:
      return "priorityHigh";
    case TicketPriority.URGENT:
      return "priorityUrgent";
  }
}
