"use server";

import { revalidatePath } from "next/cache";
import { CommentVisibility, Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { getVisibleCommentById } from "@/lib/comments";
import { getVisibleTicketById } from "@/lib/tickets";
import { uploadAttachment } from "@/lib/attachments";

const COMMENT_VISIBILITIES = Object.values(CommentVisibility);

export async function createComment(ticketId: string, formData: FormData) {
  const user = await requireUser();

  // Same rule as everywhere else: no access to the ticket, no comment.
  const ticket = await getVisibleTicketById(user, ticketId);
  if (!ticket) {
    throw new Error("Ticket nicht gefunden oder kein Zugriff.");
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    throw new Error("Bitte einen Kommentartext eingeben.");
  }

  // REQUESTER can only ever create EXTERNAL comments — the value is
  // forced here server-side, not just left out of their form, so a
  // crafted request can't smuggle in visibility=INTERNAL.
  let visibility: CommentVisibility;
  if (user.role === Role.REQUESTER) {
    visibility = CommentVisibility.EXTERNAL;
  } else {
    const submitted = String(formData.get("visibility") ?? CommentVisibility.EXTERNAL);
    if (!COMMENT_VISIBILITIES.includes(submitted as CommentVisibility)) {
      throw new Error("Ungültige Sichtbarkeit.");
    }
    visibility = submitted as CommentVisibility;
  }

  const comment = await prisma.comment.create({
    data: { ticketId, authorId: user.id, body, visibility },
  });

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      const uploaded = await uploadAttachment(file, comment.id);
      await prisma.attachment.create({
        data: {
          commentId: comment.id,
          fileName: uploaded.fileName,
          fileUrl: uploaded.path,
          fileSize: uploaded.fileSize,
          uploadedById: user.id,
        },
      });
    } catch (err) {
      // Keep the create-comment action atomic from the user's point of
      // view: if the attachment fails, the comment doesn't silently
      // exist without it.
      await prisma.comment.delete({ where: { id: comment.id } });
      throw err;
    }
  }

  revalidatePath(`/tickets/${ticketId}`);
}

export async function updateComment(commentId: string, formData: FormData) {
  const user = await requireUser();

  const comment = await getVisibleCommentById(user, commentId);
  if (!comment) {
    throw new Error("Kommentar nicht gefunden oder kein Zugriff.");
  }

  // Ownership only — not role-based. Not even ADMIN may edit someone
  // else's comment.
  if (comment.authorId !== user.id) {
    throw new Error("Nur der Autor darf diesen Kommentar bearbeiten.");
  }

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    throw new Error("Bitte einen Kommentartext eingeben.");
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { body },
  });

  revalidatePath(`/tickets/${comment.ticketId}`);
}
