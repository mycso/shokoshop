import { NextRequest } from "next/server";
import { get } from "@vercel/blob";

// Public endpoint — serves design files from private Vercel Blob storage.
// Gelato's order API calls this URL to download the print file for fulfillment.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const blob = await get(`product-designs/${filename}`, { access: "private" }).catch(() => null);
  if (!blob?.stream) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(blob.stream as ReadableStream, {
    headers: {
      "Content-Type": blob.blob.contentType ?? "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
