"use client";

import { Josefin_Sans } from "next/font/google";
import "../(site)/globals.css";

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FiSearch,
  FiSettings,
  FiLogOut,
  FiGrid,
  FiBox,
  FiLayers,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";

function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: FiGrid, href: "/admin" },
    { name: "Products", icon: FiBox, href: "/admin/products" },
    { name: "Inventory", icon: FiLayers, href: "/admin/inventory" },
    { name: "Orders", icon: FiShoppingBag, href: "/admin/orders" },
    { name: "Users", icon: FiUsers, href: "/admin/users" },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9F4] font-sans antialiased text-gray-900">
      {/* Sidebar */}
      <aside className="h-screen w-80 p-4 shrink-0">
        <div className="h-full bg-white rounded-[2.5rem] p-6 flex flex-col shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mt-4 mb-4 px-2">
            <span className="font-bold text-red-700 tracking-tight text-xl uppercase">
              Trendy Wear
            </span>
          </div>

          <div className="relative mb-4 px-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-[#F9FAFB] border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm focus:border-gray-500 outline-none transition-all"
            />
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive
                      ? "text-red-600 bg-red-50/60 font-bold"
                      : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="text-lg" />
                  <span className="text-lg font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden ring-2 ring-gray-50">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jinjer"
                  alt="Admin"
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800 leading-tight">
                  Jinjer Ice Scramble
                </p>
                <span className="text-[10px] bg-yellow-400 text-white px-2 py-1.5 rounded font-bold uppercase tracking-wider">
                  Admin
                </span>
              </div>
            </div>

            <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-500 hover:text-red-600 text-lg font-medium transition-colors">
              <FiSettings />
              <span>Settings</span>
            </button>

            <Link href="/">
              <button className="w-full flex items-center gap-3 px-4 py-2 text-red-600 mt-1 hover:bg-red-50 rounded-xl text-lg font-bold transition-all">
                <FiLogOut />
                <span>Log out</span>
              </button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-4 pl-0">
        <div className="h-[calc(100vh-2rem)] bg-white rounded-[2.5rem] p-10 overflow-y-auto shadow-sm border border-gray-100">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${josefinSans.variable} antialiased`}>
        <AdminContent>{children}</AdminContent>
      </body>
    </html>
  );
}