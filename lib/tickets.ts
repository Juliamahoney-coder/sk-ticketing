import { Prisma, Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type VisibilityUser = {
  id: string;
  role: Role;
  teamId: string | null;
};

const TICKET_INCLUDE = {
  team: true,
  requester: true,
  owner: true,
} satisfies Prisma.TicketInclude;

/**
 * Central row-level visibility rule for tickets. Every ticket query that
 * serves a user must go through this — do not filter in the UI layer, and
 * do not re-derive this logic per page.
 *
 * REQUESTER: only their own tickets
 * AGENT:     only tickets belonging to their own team
 * ADMIN:     everything
 */
export function ticketVisibilityWhere(
  user: VisibilityUser
): Prisma.TicketWhereInput {
  switch (user.role) {
    case Role.ADMIN:
      return {};
    case Role.AGENT:
      // teamId is a required column, so "" never matches any ticket —
      // an agent with no team of their own correctly sees nothing.
      return { teamId: user.teamId ?? "" };
    case Role.REQUESTER:
      return { requesterId: user.id };
  }
}

export function getVisibleTickets(user: VisibilityUser) {
  return prisma.ticket.findMany({
    where: ticketVisibilityWhere(user),
    include: TICKET_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Returns null both when the ticket does not exist and when it exists but
 * the user has no access to it, so callers can treat both cases the same
 * (404-style) without leaking whether a given ticket id exists at all.
 */
export function getVisibleTicketById(user: VisibilityUser, id: string) {
  return prisma.ticket.findFirst({
    where: { AND: [{ id }, ticketVisibilityWhere(user)] },
    include: TICKET_INCLUDE,
  });
}
