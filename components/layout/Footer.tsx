import Link from "next/link";
import Image from "next/image";
import { Bebas_Neue } from "next/font/google";

const bebas = Bebas_Neue({ weight: ["400"], subsets: ["latin"] });

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/shokoshoplogo.svg"
                alt="ShokoShop"
                width={28}
                height={28}
                className="brightness-0 invert"
              />
              
              <span className={`${bebas.className} text-xl font-bold text-white`}>ShokoShop</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs">
              Premium T-shirts and wall art exclusive designs delivered straight to your door.
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
            <span className="text-brand">Gelato</span> &amp;{" "}
            <span className="text-brand">Stripe</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
