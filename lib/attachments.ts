import { ATTACHMENTS_BUCKET, supabaseAdmin } from "@/lib/supabase";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

let bucketEnsured = false;

async function ensureBucketExists() {
  if (bucketEnsured || !supabaseAdmin) return;

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(`Supabase Storage nicht erreichbar: ${listError.message}`);
  }

  if (!buckets.some((bucket) => bucket.name === ATTACHMENTS_BUCKET)) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(ATTACHMENTS_BUCKET, {
      public: false,
      fileSizeLimit: MAX_ATTACHMENT_SIZE,
    });
    if (createError) {
      throw new Error(`Bucket "${ATTACHMENTS_BUCKET}" konnte nicht angelegt werden: ${createError.message}`);
    }
  }

  bucketEnsured = true;
}

/**
 * Uploads a comment attachment to the private Supabase Storage bucket.
 * Throws with a user-facing German message on any validation or
 * upload failure — callers should let this propagate to the Server
 * Action error boundary rather than catching it silently.
 */
export async function uploadAttachment(file: File, commentId: string) {
  if (!supabaseAdmin) {
    throw new Error(
      "Datei-Uploads sind nicht konfiguriert (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY fehlen)."
    );
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    throw new Error("Datei ist zu groß (max. 10 MB).");
  }

  if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
    throw new Error("Dateityp nicht erlaubt (erlaubt: Bilder, PDF, Office-Dokumente).");
  }

  await ensureBucketExists();

  const path = `${commentId}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabaseAdmin.storage.from(ATTACHMENTS_BUCKET).upload(path, file, {
    contentType: file.type,
  });

  if (error) {
    throw new Error(`Upload fehlgeschlagen: ${error.message}`);
  }

  return { path, fileName: file.name, fileSize: file.size };
}

/**
 * Short-lived signed URL for a private attachment. Returns null when
 * Storage isn't configured or the file can't be resolved — callers
 * render the filename without a working link in that case.
 */
export async function getSignedAttachmentUrl(path: string): Promise<string | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(path, 60 * 5); // 5 minutes

  if (error || !data) return null;
  return data.signedUrl;
}
