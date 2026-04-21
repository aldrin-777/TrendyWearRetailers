"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';

import {
  MdOutlineSearch,
  MdFavoriteBorder,
  MdOutlineShoppingCart,
  MdOutlinePersonOutline,
  MdLogout,
  MdAdminPanelSettings,
  MdReceiptLong,
} from 'react-icons/md';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { useUser } from '../context/UserContext';
import { createClient } from "@/utils/supabase/client";
import { fetchHomepageTextConfig } from "@/lib/homepageContent";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUser();
  const supabase = createClient();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount } = useCart();
  const [brandTitle, setBrandTitle] = useState("Trendy Wear");
  const [navLabels, setNavLabels] = useState(["Products", "New In", "Sales"]);

  useEffect(() => {
    const loadText = async () => {
      const config = await fetchHomepageTextConfig(createClient());
      setBrandTitle(config.brandTitle);
      setNavLabels([config.navLabel1, config.navLabel2, config.navLabel3]);
    };
    loadText();
  }, []);

  const links = [
    { label: navLabels[0] || "Products", href: "/products-page" },
    { label: navLabels[1] || "New In", href: "/new-in" },
    { label: navLabels[2] || "Sales", href: "/sales" },
  ];

  const icons = [
    { label: "Search", icon: <MdOutlineSearch size={22} />, href: "#" },
    { label: "Favorites", icon: <MdFavoriteBorder size={22} />, href: "/favorites" },
    { label: "Cart", icon: <MdOutlineShoppingCart size={22} />, href: "/shopping-cart" },
    { label: "Account", icon: <MdOutlinePersonOutline size={22} />, href: "#" },
  ];

  const iconStyle =
    "p-2 rounded-full border border-[#003049] text-[#003049] hover:bg-[#003049]/10 transition flex items-center justify-center";

  const getLinkStyle = (href: string, isIcon = false) => {
    const isActive = pathname === href;

    if (isIcon) {
      const iconBase = "flex items-center justify-center rounded-full border border-[#003049] transition-all duration-300 p-2";
      if (isActive) {
        return `${iconBase} bg-[#003049] text-white shadow-md scale-105`;
      }
      return `${iconBase} bg-transparent text-[#003049] hover:bg-[#003049]/10`;
    }

    const textBase = "transition-all duration-300 flex items-center justify-center rounded-full px-6 py-2 font-medium border";
    if (isActive) {
      return `${textBase} bg-[#003049] text-white border-[#003049] shadow-md`;
    }
    return `${textBase} text-[#003049] border-transparent hover:bg-[#003049]/5`;
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const handleOrders = () => {
    router.push("/orders");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products-page?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const AccountDropdown = ({ label }: { label?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { isAdmin } = useUser();

    const handleLogout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      alert("You have been logged out.");
      window.location.href = "/";
    };

    const buttonClass = label
      ? "flex items-center space-x-3 p-2 hover:bg-[#003049]/10 rounded transition w-full"
      : iconStyle;

    return (
      <div className="relative inline-block">
        <button
          title={label}
          className={buttonClass}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span><MdOutlinePersonOutline size={22} /> </span>
          <span>{label}</span>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-50">
              <button
                onClick={handleProfile}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors"
              >
                <MdOutlinePersonOutline size={18} />
                Profile
              </button>
              <button
                onClick={handleOrders}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors"
              >
                <MdReceiptLong size={18} />
                My Orders
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-5 py-2 text-sm text-red-600 transition-colors"
              >
                <MdLogout size={18} />
                Logout
              </button>
              {isAdmin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full flex items-center gap-2 px-5 py-2 text-sm text-red-600 transition-colors"
                >
                  <MdAdminPanelSettings size={18} />
                  Admin
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <nav className="w-full bg-[#f8f9fa] border-b border-gray-300">

      {/* Backdrop */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] animate-in fade-in duration-300"
          onClick={() => setIsSearchOpen(false)}
        />
      )}

      {/* Search Bar */}
      <div className={`
        fixed top-0 left-0 w-full bg-white shadow-2xl z-[100] transition-all duration-300 ease-in-out
        ${isSearchOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}
      `}>
        <div className="max-w-[1600px] mx-auto px-10 py-8 flex items-center gap-6">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center border-b-2 border-[#003049] py-2">
            <MdOutlineSearch size={30} className="text-[#003049] mr-4" />
            <input
              autoFocus={isSearchOpen}
              type="text"
              placeholder="Search for products..."
              className="bg-transparent border-none outline-none text-2xl w-full text-[#003049] placeholder:text-gray-400 font-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-2 text-[#003049] hover:bg-gray-100 rounded-full transition-all flex flex-col items-center"
          >
            <HiOutlineX size={32} />
            <span className="text-[10px] uppercase font-bold">Close</span>
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-10 py-6 flex items-center">

        {/* Left Links */}
        <div className="hidden lg:flex flex-1 justify-evenly text-[#003049] font-medium text-lg">
          {links.map((link, idx) => (
            <Link key={idx} href={link.href} className={getLinkStyle(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Logo */}
        <div className="flex-shrink-0 lg:px-16 px-2 text-center">
          <Link href="/" className="text-2xl font-bold text-[#C1121F] uppercase">
            {brandTitle}
          </Link>
        </div>

        {/* Right Icons / Hamburger */}
        <div className="flex-1 hidden lg:flex justify-evenly items-center">
          {icons.map((item, idx) => {
            const restricted = ["Favorites", "Cart", "Account"];
            if (item.label === "Account" && user) {
              return <AccountDropdown key={idx} />;
            }
            return (
              <button
                key={idx}
                className={getLinkStyle(item.href, true)}
                onClick={() => {
                  if (item.label === "Search") {
                    setIsSearchOpen(true);
                  } else if (restricted.includes(item.label) && !user) {
                    router.push("/login");
                  } else if (item.href && item.label !== "Search") {
                    router.push(item.href);
                  }
                }}
              >
                <div className="relative">
                  {item.icon}
                  {item.label === "Cart" && cartCount > 0 && (
                    <span
                      className="
                        absolute -top-3 -right-4
                        bg-[#C1121F]
                        text-white
                        text-[12px]
                        font-bold
                        rounded-full
                        min-w-[20px]
                        h-[20px]
                        flex items-center justify-center
                      "
                    >
                      {cartCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Hamburger (Mobile Only) */}
        <div className="flex lg:hidden ml-auto">
          <button
            className="p-2 text-[#003049] hover:bg-[#003049]/10 rounded transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#f8f9fa] border-t border-gray-300">
          <div className="flex flex-col px-4 py-3 space-y-2 font-medium text-sm">
            {links.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="flex items-center p-2 hover:bg-[#003049]/10 rounded transition"
              >
                <span>{link.label}</span>
              </Link>
            ))}
            {icons.map((item, idx) => {
              const restricted = ["Favorites", "Cart", "Account"];
              if (item.label === "Account" && user) {
                return <AccountDropdown key={idx} label={item.label} />;
              }
              return (
                <button
                  key={idx}
                  className="flex items-center space-x-3 p-2 hover:bg-[#003049]/10 rounded transition"
                  onClick={() => {
                    if (item.label === "Search") {
                      setIsSearchOpen(true);
                      setMenuOpen(false);
                    } else if (restricted.includes(item.label) && !user) {
                      router.push("/login");
                    } else if (item.href && item.label !== "Search") {
                      router.push(item.href);
                    }
                  }}
                >
                  <div className="relative">
                    {item.icon}
                    {item.label === "Cart" && cartCount > 0 && (
                      <span
                        className="
                          absolute -top-2 -right-2
                          bg-[#C1121F]
                          text-white
                          text-[10px]
                          font-bold
                          rounded-full
                          min-w-[18px]
                          h-[18px]
                          flex items-center justify-center
                          px-[2px]
                        "
                      >
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
