// Cart state is managed client-side. This route provides server-side
// cart validation and price verification.

import { CartItem } from "@/types";
import { getProductById } from "@/lib/products";

export async function POST(request: Request) {
  try {
    const { items }: { items: CartItem[] } = await request.json();

    // Validate prices server-side
    const validated = items.map((item) => {
      const product = getProductById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const variant = product.variants?.find((v) => v.id === item.variantId);
      const price = variant?.price ?? product.price;
      return { ...item, price };
    });

    const total = validated.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    return Response.json({ items: validated, total });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}
