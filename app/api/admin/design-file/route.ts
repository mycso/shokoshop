import { del, put } from "@vercel/blob";
import { setOverride, getOverrides } from "@/lib/gelato-overrides";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return Response.json({ error: "productId required" }, { status: 400 });
  try {
    const overrides = await getOverrides();
    const match = overrides.find((o) => o.gelatoProductId === productId);
    return Response.json({ designFilename: match?.designFilename ?? null });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Failed to load design file" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file") as File | null;
  const productId = form.get("productId") as string | null;

  if (!file || !productId) {
    return Response.json({ error: "file and productId are required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
    return Response.json({ error: "Only image or PDF files are allowed" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "png";
  // Unique per upload (not just per product) so replacing a design gets a fresh URL —
  // the serving route caches responses as "immutable" for a year, keyed on this filename.
  const filename = `${productId}-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const overrides = await getOverrides();
    const previousFilename = overrides.find((o) => o.gelatoProductId === productId)?.designFilename;

    await put(`product-designs/${filename}`, buffer, {
      access: "private",
      contentType: file.type,
      allowOverwrite: true,
    });

    await setOverride({ gelatoProductId: productId, designFilename: filename });

    if (previousFilename && previousFilename !== filename) {
      await del(`product-designs/${previousFilename}`).catch(() => {
        // Best-effort cleanup — a leftover orphaned blob isn't harmful.
      });
    }

    return Response.json({ ok: true, designFilename: filename });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { productId } = await request.json();
  if (!productId) return Response.json({ error: "productId required" }, { status: 400 });
  try {
    await setOverride({ gelatoProductId: productId, designFilename: undefined });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Delete failed" }, { status: 500 });
  }
}
