import { CommentVisibility, Prisma, Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getVisibleTicketById, type VisibilityUser } from "@/lib/tickets";

const COMMENT_INCLUDE = {
  author: true,
  attachments: true,
} satisfies Prisma.CommentInclude;

/**
 * Central row-level visibility rule for comments — mirrors
 * ticketVisibilityWhere in lib/tickets.ts. Every comment query that
 * serves a user must go through this, not re-derive it per page.
 *
 * AGENT/ADMIN: both INTERNAL and EXTERNAL comments
 * REQUESTER:   EXTERNAL only
 */
export function commentVisibilityWhere(user: VisibilityUser): Prisma.CommentWhereInput {
  if (user.role === Role.REQUESTER) {
    return { visibility: CommentVisibility.EXTERNAL };
  }
  return {};
}

/**
 * Comments are only visible at all if the user can see the ticket they
 * belong to (reuses getVisibleTicketById rather than re-checking ticket
 * access separately). Returns null if the ticket itself isn't visible.
 */
export async function getVisibleComments(user: VisibilityUser, ticketId: string) {
  const ticket = await getVisibleTicketById(user, ticketId);
  if (!ticket) return null;

  return prisma.comment.findMany({
    where: { AND: [{ ticketId }, commentVisibilityWhere(user)] },
    include: COMMENT_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Same null-for-both-cases contract as getVisibleTicketById: a comment
 * that doesn't exist and one the user isn't allowed to see are
 * indistinguishable to the caller.
 */
export async function getVisibleCommentById(user: VisibilityUser, commentId: string) {
  const comment = await prisma.comment.findFirst({
    where: { AND: [{ id: commentId }, commentVisibilityWhere(user)] },
    include: COMMENT_INCLUDE,
  });
  if (!comment) return null;

  const ticket = await getVisibleTicketById(user, comment.ticketId);
  if (!ticket) return null;

  return comment;
}
