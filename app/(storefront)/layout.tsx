import { CartProvider } from "@/lib/cart-context";
import { CurrencyProvider } from "@/lib/currency-context";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <CurrencyProvider>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </CurrencyProvider>
    </CartProvider>
  );
}
