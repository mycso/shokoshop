import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: "Only image files are accepted" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File too large (max 20MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `designs/${randomUUID()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  return Response.json({ url: blob.url });
}
