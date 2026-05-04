import { MOCK_PRODUCTS } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  let products = MOCK_PRODUCTS;

  if (category) {
    products = products.filter((p) =>
      p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (q) {
    const query = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }

  return Response.json({ products });
}
