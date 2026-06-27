import { put, get } from "@vercel/blob";

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number; // 1–5
  text: string;
  date: string; // ISO
}

function blobPath(productId: string) {
  return `reviews/${productId}.json`;
}

export async function getReviews(productId: string): Promise<Review[]> {
  const result = await get(blobPath(productId), { access: "private" }).catch(() => null);
  if (!result?.stream) return [];
  try {
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addReview(review: Review): Promise<Review[]> {
  const existing = await getReviews(review.productId);
  const updated = [...existing, review];
  await put(blobPath(review.productId), JSON.stringify(updated, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
  return updated;
}

export async function getReviewsSummary(
  productIds: string[]
): Promise<Record<string, { avg: number; count: number }>> {
  const pairs = await Promise.all(
    productIds.map(async (id) => {
      const reviews = await getReviews(id);
      if (reviews.length === 0) return null;
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      return [id, { avg, count: reviews.length }] as const;
    })
  );
  return Object.fromEntries(pairs.filter(Boolean) as [string, { avg: number; count: number }][]);
}

export async function deleteReview(productId: string, reviewId: string): Promise<Review[]> {
  const existing = await getReviews(productId);
  const updated = existing.filter((r) => r.id !== reviewId);
  await put(blobPath(productId), JSON.stringify(updated, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
  return updated;
}
