"use client"

import Link from 'next/link';
import { useUser } from "../context/UserContext"; 
import { useRouter } from "next/navigation";

export default function Footer() {
  const { user } = useUser();
  const router = useRouter();

  const footerColumns = [
    {
      title: "Shop",
      links: [
        { label: "Products", href: "/products-page" },
        { label: "New In", href: "/new-in" },
        { label: "Sales", href: "/sales" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "My Orders", href: "/orders" },
        { label: "Shopping Cart", href: "/shopping-cart" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact Us", href: "/contact-us" },
        { label: "Shipping Info", href: "/track" },
        { label: "Return", href: "/returns" },
        { label: "FAQ", href: "/faq" },
      ],
    },
  ];

  return (
    <footer className="bg-[#c1121f] text-white py-16 border-t border-red-800">
      <div className="max-w-7xl mx-auto px-8 md:px-4 flex flex-col md:flex-row justify-between gap-8">

        {/* Left Section: Brand Info */}
        <div className="flex flex-col justify-center md:w-1/4 md:px-4">
          <h2 className="text-3xl font-bold text-[#F59E0B] tracking-wide uppercase">
            Beyond
          </h2>
          <div className="pb-1 border-b border-white/30">
            <p className="text-sm font-medium tracking-wide">
              The Destination for the Distinguished.
            </p>
          </div>
          <p className="pt-4 text-xs text-red-100">
            © 2026 Beyond. All rights reserved.
          </p>
        </div>

        {/* Right Section: Navigation Columns */}
        <div className="flex-1 flex justify-between sm:px-8 md:px-16 lg:px-32">
          {footerColumns.map((col, idx) => (
            <div key={idx} className="flex flex-col space-y-6">
              <h3 className="text-[#F59E0B] text-lg font-bold">{col.title}</h3>
              <ul className="space-y-8 text-sm text-red-50">
                {col.links.map((link, i) => (
                  <li key={i}>
                    {col.title === "Account" && ["My Orders", "Shopping Cart"].includes(link.label) ? (
                      <button
                        onClick={() => {
                          if (!user) {
                            router.push("/login"); // redirect if not logged in
                          } else {
                            router.push(link.href);
                          }
                        }}
                        className="hover:text-white hover:underline transition text-left w-full"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="hover:text-white hover:underline transition"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </footer>
  );
}
