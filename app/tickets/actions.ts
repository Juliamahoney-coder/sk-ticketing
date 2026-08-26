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
import { getVisibleTicketById } from "@/lib/tickets";

const TICKET_PRIORITIES = Object.values(TicketPriority);
const TICKET_STATUSES = Object.values(TicketStatus);

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

  if (user.role === Role.REQUESTER) {
    throw new Error("Requester dürfen den Status nicht ändern.");
  }

  // Re-check visibility server-side: an AGENT from another team must not
  // be able to update a ticket just because they guessed/typed its id.
  const ticket = await getVisibleTicketById(user, ticketId);
  if (!ticket) {
    throw new Error("Ticket nicht gefunden oder kein Zugriff.");
  }

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
