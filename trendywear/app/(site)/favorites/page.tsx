"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import FiltersSidebar from "../components/FilterSidebar";
import Breadcrumb from "@/app/(site)/components/Breadcrumb";
import { fetchFavorites, Product } from "../lib/fetchFavorites";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

function FavoritesContent() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedSize, setSelectedSize] = useState("XS");
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [price, setPrice] = useState(200);
  const [selectedFits, setSelectedFits] = useState<string[]>([]);
  const [rating, setRating] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get('category') || undefined;
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory);

  const toggleSubCategory = (value: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
  };

  const toggleColor = (value: string) => {
    setSelectedColors(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
  };

  const toggleFit = (value: string) => {
    setSelectedFits(prev =>
      prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]
    );
  };

  const categories = ["Men", "Women", "Tops", "Bottoms", "Shirt", "Dress"];

  useEffect(() => {
    setLoading(true);
    fetchFavorites(activeCategory) // pass category to server
      .then(setFavorites)
      .catch(err => console.error("Error fetching favorites:", err))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  // Derive the filtered list locally
  const displayedFavorites = favorites.filter((fav) => {
    // Note: adjust 'fav.category' and 'fav.name' if your Product type uses different keys
    const matchesSearch = fav.name ? fav.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <main className="max-w-[1440px] mx-auto px-10 py-10">
        <div className="grid grid-cols-[260px_1fr] gap-14 items-start">
          {/* LEFT COLUMN: Filters Sidebar */}
          <FiltersSidebar
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            activeCategory={activeCategory ?? ""}
            selectedSubCategories={selectedSubCategories}
            onToggleSubCategory={toggleSubCategory}
            selectedColors={selectedColors}
            onToggleColor={toggleColor}
            price={price}
            onPriceChange={setPrice}
            selectedFits={selectedFits}
            onToggleFit={toggleFit}
            rating={rating}
            onRatingChange={setRating}
          />

          {/* RIGHT COLUMN: Favorites */}
          <section>
            {/* HEADER */}
            <header className="pb-4">
              <Breadcrumb
                items={[
                  { label: "Home", href: "/" },
                  { label: "My Favorites" },
                ]}
              />

              <div className="flex justify-between items-end pb-4">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight text-[#C1121F]">
                  Favorites
                </h1>
                <span className="font-black text-lg mb-2 tracking-widest uppercase text-gray-900">
                  {displayedFavorites.length} Items
                </span>
              </div>
            </header>

            {/* SEARCH + CATEGORIES */}
            <div className="mb-8 flex items-center justify-between">
              {/* SEARCH */}
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-gray-300 focus:outline-none"
                />
              </div>

              {/* CATEGORIES */}
              <div className="flex gap-2">
                {categories.map((cat) => {
                  const isActive = cat === activeCategory;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        // Toggle off if clicking the active category, otherwise set it
                        setActiveCategory(isActive ? undefined : cat);
                        setSelectedSubCategories([]); 
                      }}
                      className={`px-4 py-2 text-xs border rounded-lg transition ${
                        isActive
                          ? "bg-[#A52A2A] border-[#A52A2A] text-white"
                          : "bg-[#D9D9D9] border-[#D9D9D9] text-black"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FAVORITES GRID */}
            <section className="flex-grow">
              {!loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 lg:pb-4">
                  {displayedFavorites.length === 0 ? (
                    <div className="py-40 col-span-full text-center w-full">
                      <div className="font-black text-gray-200 text-4xl uppercase tracking-[0.5em] mb-8">
                        Empty List
                      </div>
                      <Link
                        href="/"
                        className="inline-block border-b-2 border-black pb-1 font-black uppercase text-sm tracking-widest hover:text-gray-400"
                      >
                        Start Exploring
                      </Link>
                    </div>
                  ) : (
                    displayedFavorites.map((fav) => (
                      <ProductCard
                        key={fav.id}
                        {...fav}
                        oldPrice={fav.oldPrice ?? undefined}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="py-40 text-center w-full">
                  <div className="font-black text-gray-200 text-4xl uppercase tracking-[0.5em] mb-8">
                    Loading Favorites
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function Favorites() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center text-gray-400">
          Loading…
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  );
}