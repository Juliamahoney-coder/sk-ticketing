"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Role,
  TicketPriority,
  TicketStatus,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canEditTicket, getVisibleTicketById, type VisibilityUser } from "@/lib/tickets";

const TICKET_PRIORITIES = Object.values(TicketPriority);
const TICKET_STATUSES = Object.values(TicketStatus);

/**
 * Shared authorization gate for every ticket-mutating action that isn't
 * ticket creation. Every caller must go through this instead of
 * re-deriving the check, so the rule can't drift between actions or from
 * the canEdit the page uses to decide what to render.
 *
 * Being able to *see* a ticket (e.g. a cross-team follower, since
 * ticketVisibilityWhere grants them read access) is NOT enough here —
 * canEditTicket is the stricter, separate rule for mutation rights.
 */
async function assertCanEditTicket(user: VisibilityUser, ticketId: string) {
  // Re-check visibility server-side first: no point leaking whether a
  // ticket exists to someone who can't even see it.
  const ticket = await getVisibleTicketById(user, ticketId);
  if (!ticket) {
    throw new Error("Ticket nicht gefunden oder kein Zugriff.");
  }

  if (!canEditTicket(user, ticket)) {
    throw new Error("Keine Berechtigung, dieses Ticket zu bearbeiten.");
  }

  return ticket;
}

export async function createTicket(formData: FormData) {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const priority = String(formData.get("priority") ?? "") as TicketPriority;

  if (!title || !description || !teamId || !category) {
    throw new Error("Bitte alle Pflichtfelder ausfüllen.");
  }

  if (!TICKET_PRIORITIES.includes(priority)) {
    throw new Error("Ungültige Priorität.");
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new Error("Ungültiges Team.");
  }

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description,
      teamId,
      category,
      priority,
      // requesterId always comes from the session, never from the form
      requesterId: user.id,
    },
  });

  revalidatePath("/tickets");
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketStatus(ticketId: string, formData: FormData) {
  const user = await requireUser();
  await assertCanEditTicket(user, ticketId);

  const status = String(formData.get("status") ?? "") as TicketStatus;
  if (!TICKET_STATUSES.includes(status)) {
    throw new Error("Ungültiger Status.");
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      closedAt: status === TicketStatus.CLOSED ? new Date() : null,
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

/**
 * Edits title/priority/team/category. Description is intentionally never
 * accepted here — it must stay locked after creation, per the requirements
 * doc, so there's no field to even ignore.
 */
export async function updateTicketFields(ticketId: string, formData: FormData) {
  const user = await requireUser();
  await assertCanEditTicket(user, ticketId);

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const priority = String(formData.get("priority") ?? "") as TicketPriority;

  if (!title || !category || !teamId) {
    throw new Error("Bitte alle Pflichtfelder ausfüllen.");
  }

  if (!TICKET_PRIORITIES.includes(priority)) {
    throw new Error("Ungültige Priorität.");
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new Error("Ungültiges Team.");
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { title, category, teamId, priority },
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

/**
 * "Mir zuweisen" — sets the current user as owner, overwriting whoever was
 * assigned before. No lock/confirmation by design (see feature spec).
 */
export async function assignTicketToMe(ticketId: string) {
  const user = await requireUser();
  await assertCanEditTicket(user, ticketId);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { ownerId: user.id },
  });

  revalidatePath(`/tickets/${ticketId}`);
}

/**
 * "Folgen" quick action — adds the current user as a follower. Ignores the
 * unique-constraint violation from an already-existing follow so a double
 * click (or the row already being there) isn't an error.
 */
export async function followTicket(ticketId: string) {
  const user = await requireUser();
  await assertCanEditTicket(user, ticketId);

  await prisma.ticketFollower.upsert({
    where: { ticketId_userId: { ticketId, userId: user.id } },
    update: {},
    create: { ticketId, userId: user.id },
  });

  revalidatePath(`/tickets/${ticketId}`);
}

/**
 * Multi-select follower management: replaces the full follower set with
 * whatever was submitted, rather than adding/removing one at a time.
 * Candidates are restricted to AGENT/ADMIN (mirrors the picker on the
 * page) so a crafted request can't add a REQUESTER as a follower.
 */
export async function updateTicketFollowers(ticketId: string, formData: FormData) {
  const user = await requireUser();
  await assertCanEditTicket(user, ticketId);

  const submittedIds = [...new Set(formData.getAll("followerIds").map(String))];

  const validUsers = submittedIds.length
    ? await prisma.user.findMany({
        where: { id: { in: submittedIds }, role: { in: [Role.AGENT, Role.ADMIN] } },
        select: { id: true },
      })
    : [];
  const validIds = validUsers.map((u) => u.id);

  await prisma.$transaction([
    prisma.ticketFollower.deleteMany({
      where: { ticketId, userId: { notIn: validIds.length ? validIds : ["__none__"] } },
    }),
    prisma.ticketFollower.createMany({
      data: validIds.map((userId) => ({ ticketId, userId })),
      skipDuplicates: true,
    }),
  ]);

  revalidatePath(`/tickets/${ticketId}`);
}
