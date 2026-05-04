import Link from "next/link";
import { Package } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-6 w-6 text-indigo-400" />
              <span className="text-lg font-bold text-white">ShokoShop</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Premium print-on-demand products delivered to your door. Upload
              your design and we&apos;ll handle the rest.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=Apparel" className="hover:text-white transition-colors">
                  Apparel
                </Link>
              </li>
              <li>
                <Link href="/products?category=Wall+Art" className="hover:text-white transition-colors">
                  Wall Art
                </Link>
              </li>
              <li>
                <Link href="/products?category=Drinkware" className="hover:text-white transition-colors">
                  Drinkware
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Account
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-white transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} ShokoShop. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Powered by{" "}
            <span className="text-indigo-400">Gelato</span> &amp;{" "}
            <span className="text-indigo-400">Stripe</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
