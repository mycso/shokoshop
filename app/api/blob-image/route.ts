import { NextResponse } from "next/server";
import { get } from "@vercel/blob";

/**
 * Streams an image from our private Vercel Blob store. The store rejects
 * public access, so blob URLs 403 without auth — this route is the only way
 * to serve them at a stable, unauthenticated URL. Only ever resolves a
 * pathname under gelato-previews/ within our own store (via the SDK's
 * token-scoped `get`), so it can't be used as an open proxy to other hosts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const ALLOWED_PREFIXES = ["gelato-previews/", "product-images/"];
  if (!path || !ALLOWED_PREFIXES.some((p) => path.startsWith(p))) {
    return NextResponse.json({ error: "Missing or invalid path" }, { status: 400 });
  }

  const result = await get(path, { access: "private" }).catch(() => null);
  if (!result || !result.stream) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
