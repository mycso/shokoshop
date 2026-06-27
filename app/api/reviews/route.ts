import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getReviews, addReview, deleteReview } from "@/lib/reviews";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  const reviews = await getReviews(productId);
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  try {
    const { productId, name, rating, text } = await request.json();
    if (!productId || !name || !rating || !text) {
      return NextResponse.json({ error: "productId, name, rating and text are required" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
    }
    const review = {
      id: randomUUID(),
      productId,
      name: String(name).trim().slice(0, 80),
      rating: Number(rating),
      text: String(text).trim().slice(0, 1000),
      date: new Date().toISOString(),
    };
    const reviews = await addReview(review);
    return NextResponse.json({ ok: true, review, total: reviews.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// Admin-only delete
export async function DELETE(request: Request) {
  try {
    const { productId, reviewId } = await request.json();
    if (!productId || !reviewId) {
      return NextResponse.json({ error: "productId and reviewId required" }, { status: 400 });
    }
    const reviews = await deleteReview(productId, reviewId);
    return NextResponse.json({ ok: true, reviews });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
