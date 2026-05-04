import { Product } from "@/types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_001",
    slug: "custom-tshirt",
    name: "Custom Print T-Shirt",
    description:
      "High-quality 100% cotton t-shirt with your custom design printed directly onto the fabric. Available in multiple sizes and colors. Perfect for personal use, gifts, or small businesses.",
    price: 2999,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
    ],
    category: "Apparel",
    gelatoProductId: "apparel_product_uid",
    inStock: true,
    variants: [
      { id: "v1", name: "Small", price: 2999, sku: "TS-S" },
      { id: "v2", name: "Medium", price: 2999, sku: "TS-M" },
      { id: "v3", name: "Large", price: 2999, sku: "TS-L" },
      { id: "v4", name: "X-Large", price: 2999, sku: "TS-XL" },
    ],
  },
  {
    id: "prod_002",
    slug: "custom-mug",
    name: "Custom Photo Mug",
    description:
      "11oz ceramic mug with your photo or design printed in vibrant, dishwasher-safe ink. A perfect personalised gift for any occasion.",
    price: 1499,
    images: [
      "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800",
      "https://images.unsplash.com/photo-1563621949-4a4a63e8ba34?w=800",
    ],
    category: "Drinkware",
    gelatoProductId: "mug_product_uid",
    inStock: true,
    variants: [
      { id: "v1", name: "11oz White", price: 1499, sku: "MUG-11W" },
      { id: "v2", name: "11oz Black", price: 1699, sku: "MUG-11B" },
      { id: "v3", name: "15oz White", price: 1899, sku: "MUG-15W" },
    ],
  },
  {
    id: "prod_003",
    slug: "custom-poster",
    name: "Custom Art Poster",
    description:
      "Professional-grade art poster printed on thick, semi-gloss paper. Upload your artwork or photo and get a stunning print delivered to your door.",
    price: 1999,
    images: [
      "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
    ],
    category: "Wall Art",
    gelatoProductId: "poster_product_uid",
    inStock: true,
    variants: [
      { id: "v1", name: "A4 (21x29.7cm)", price: 1999, sku: "POST-A4" },
      { id: "v2", name: "A3 (29.7x42cm)", price: 2999, sku: "POST-A3" },
      { id: "v3", name: "A2 (42x59.4cm)", price: 4499, sku: "POST-A2" },
    ],
  },
  {
    id: "prod_004",
    slug: "custom-phone-case",
    name: "Custom Phone Case",
    description:
      "Slim, protective phone case with your custom design. Available for all major iPhone and Samsung Galaxy models.",
    price: 1799,
    images: [
      "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800",
      "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800",
    ],
    category: "Accessories",
    gelatoProductId: "phone_case_product_uid",
    inStock: true,
    variants: [
      { id: "v1", name: "iPhone 15", price: 1799, sku: "CASE-IP15" },
      { id: "v2", name: "iPhone 15 Pro", price: 1799, sku: "CASE-IP15P" },
      { id: "v3", name: "Samsung S24", price: 1799, sku: "CASE-SS24" },
    ],
  },
  {
    id: "prod_005",
    slug: "custom-canvas",
    name: "Custom Canvas Print",
    description:
      "Gallery-quality canvas print stretched over a solid wood frame. Your photo or artwork printed with fade-resistant inks.",
    price: 4999,
    images: [
      "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800",
    ],
    category: "Wall Art",
    gelatoProductId: "canvas_product_uid",
    inStock: true,
    variants: [
      { id: "v1", name: "20x20cm", price: 4999, sku: "CANV-S" },
      { id: "v2", name: "30x30cm", price: 7999, sku: "CANV-M" },
      { id: "v3", name: "50x50cm", price: 12999, sku: "CANV-L" },
    ],
  },
  {
    id: "prod_006",
    slug: "custom-hoodie",
    name: "Custom Print Hoodie",
    description:
      "Cosy 80% cotton, 20% polyester hoodie with your custom design. Double-lined hood, front kangaroo pocket, and ribbed cuffs.",
    price: 4999,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800",
    ],
    category: "Apparel",
    gelatoProductId: "hoodie_product_uid",
    inStock: true,
    variants: [
      { id: "v1", name: "Small", price: 4999, sku: "HD-S" },
      { id: "v2", name: "Medium", price: 4999, sku: "HD-M" },
      { id: "v3", name: "Large", price: 4999, sku: "HD-L" },
      { id: "v4", name: "X-Large", price: 4999, sku: "HD-XL" },
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

export function formatPrice(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
