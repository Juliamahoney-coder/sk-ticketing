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
  followers: { include: { user: true } },
} satisfies Prisma.TicketInclude;

/**
 * Central row-level visibility rule for tickets. Every ticket query that
 * serves a user must go through this — do not filter in the UI layer, and
 * do not re-derive this logic per page.
 *
 * REQUESTER: only their own tickets
 * AGENT:     only tickets belonging to their own team
 * ADMIN:     everything
 * Extra to all of the above, never a restriction: being listed as a
 * follower (TicketFollower) makes a ticket visible regardless of team.
 */
export function ticketVisibilityWhere(
  user: VisibilityUser
): Prisma.TicketWhereInput {
  if (user.role === Role.ADMIN) {
    return {};
  }

  const roleWhere: Prisma.TicketWhereInput =
    user.role === Role.AGENT
      ? // teamId is a required column, so "" never matches any ticket —
        // an agent with no team of their own correctly sees nothing.
        { teamId: user.teamId ?? "" }
      : { requesterId: user.id };

  return { OR: [roleWhere, { followers: { some: { userId: user.id } } }] };
}

/**
 * Whether a user may edit a ticket's fields/status, assign themselves as
 * owner, or manage its followers. This is deliberately separate from (and
 * stricter than) ticketVisibilityWhere — being able to see a ticket (e.g.
 * as a cross-team follower) does not by itself grant edit rights. Every
 * server action that mutates a ticket must gate on this, not re-derive the
 * rule — see assertCanEditTicket in app/(protected)/tickets/actions.ts.
 *
 * ADMIN:               always
 * AGENT, same team:    yes (unchanged from before this feature)
 * Ticket's owner:       yes, even if their team no longer matches
 * Follower (any team):  no — read + comment only
 */
export function canEditTicket(
  user: VisibilityUser,
  ticket: { teamId: string; ownerId: string | null }
): boolean {
  if (user.role === Role.ADMIN) return true;
  if (user.role === Role.AGENT && user.teamId === ticket.teamId) return true;
  if (ticket.ownerId === user.id) return true;
  return false;
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
