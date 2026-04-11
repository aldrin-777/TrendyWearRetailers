"use client";

import Breadcrumb from "../components/Breadcrumb";
import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchProducts, Product, SortOption } from "../lib/fetchProducts";
import FiltersSidebar from "../components/FilterSidebar";

const ITEMS_PER_PAGE = 8;

export default function Page() {
  // ---- Fetch state ----
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Search & category (hits Supabase) ----
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  // ---- Sort ----
  const [sortBy, setSortBy] = useState<SortOption>(null);

  // ---- Client-side filter state ----
  const [selectedSize, setSelectedSize] = useState("XS");
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [price, setPrice] = useState(5000);
  const [selectedFits, setSelectedFits] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);

  // ---- Pagination ----
  const [activePage, setActivePage] = useState(1);

  const categories = ["Men", "Women", "Tops", "Bottoms", "Shirt", "Dress"];

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: "Default", value: null },
    { label: "Name: A–Z", value: "name" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Top Rated", value: "rating" },
  ];

  // ---- Fetch from Supabase when search/category/sort changes ----
  useEffect(() => {
    setLoading(true);
    setActivePage(1);
    fetchProducts(searchQuery, activeCategory || null, sortBy)
      .then(setAllProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory, searchQuery, sortBy]);

  // ---- Derive subcategories from tags (skip first tag = gender/main) ----
  const availableSubCategories = useMemo(() => {
    const subSet = new Set<string>();
    allProducts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.slice(1).forEach((tag: string) => subSet.add(tag));
      }
    });
    return [...subSet].sort();
  }, [allProducts]);

  // ---- Client-side filtering ----
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (p.price > price) return false;

      // Minimum rating filter (>= minRating)
      if (minRating > 0 && p.rating < minRating) return false;

      // Colors: match any selected color
      if (selectedColors.length > 0 && p.colors.length > 0) {
        if (!selectedColors.some((c) => p.colors.includes(c))) return false;
      }

      // Subcategories: OR logic — show if product matches ANY selected subcategory
      if (selectedSubCategories.length > 0) {
        const productTags: string[] = Array.isArray(p.tags) ? p.tags : [];
        if (!selectedSubCategories.some((sub) => productTags.includes(sub))) return false;
      }

      return true;
    });
  }, [allProducts, price, minRating, selectedColors, selectedSubCategories]);

  // ---- Pagination ----
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setActivePage(1);
  }, [price, minRating, selectedColors, selectedFits, selectedSubCategories]);

  const toggleSubCategory = (value: string) =>
    setSelectedSubCategories((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );

  const toggleColor = (value: string) =>
    setSelectedColors((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );

  const toggleFit = (value: string) =>
    setSelectedFits((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );

  // ---- Active filter count ----
  const activeFilterCount = [
    price < 5000 ? 1 : 0,
    minRating > 0 ? 1 : 0,
    selectedColors.length,
    selectedFits.length,
    selectedSubCategories.length,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setPrice(5000);
    setMinRating(0);
    setSelectedColors([]);
    setSelectedFits([]);
    setSelectedSubCategories([]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <main className="max-w-[1440px] mx-auto px-10 py-10">
        <div className="grid grid-cols-[260px_1fr] gap-14 items-start">

          {/* FILTERS SIDEBAR */}
          <FiltersSidebar
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            activeCategory={activeCategory}
            selectedSubCategories={selectedSubCategories}
            onToggleSubCategory={toggleSubCategory}
            availableSubCategories={availableSubCategories}
            selectedColors={selectedColors}
            onToggleColor={toggleColor}
            price={price}
            onPriceChange={setPrice}
            selectedFits={selectedFits}
            onToggleFit={toggleFit}
            rating={minRating}
            onRatingChange={setMinRating}
          />

          {/* RIGHT COLUMN */}
          <section>
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "New In" },
              ]}
            />

            <h1 className="text-4xl font-bold text-[#C1121F] mb-4">New In</h1>

            {/* SEARCH + SORT + CATEGORIES */}
            <div className="mb-6 flex flex-wrap items-center gap-3 justify-between">
              {/* SEARCH */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#C1121F]"
                />
              </div>

              {/* SORT */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#535353] font-medium">Sort by:</span>
                <select
                  value={sortBy ?? ""}
                  onChange={(e) => setSortBy((e.target.value as SortOption) || null)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#C1121F]"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.label} value={opt.value ?? ""}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* CATEGORIES */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => {
                  const isActive = cat === activeCategory;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat === activeCategory ? "" : cat);
                        setSelectedSubCategories([]);
                        setActivePage(1);
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

            {/* ACTIVE FILTERS BAR */}
            {activeFilterCount > 0 && (
              <div className="mb-4 flex items-center gap-3 flex-wrap text-sm">
                <span className="text-[#535353]">
                  Active filters:
                  <span className="ml-1 bg-[#C1121F] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {activeFilterCount}
                  </span>
                </span>

                {price < 5000 && (
                  <span className="flex items-center gap-1 bg-white border border-gray-300 rounded-full px-3 py-1">
                    Max ₱{price.toLocaleString()}
                    <button onClick={() => setPrice(5000)} className="ml-1 text-gray-400 hover:text-[#C1121F]">×</button>
                  </span>
                )}
                {minRating > 0 && (
                  <span className="flex items-center gap-1 bg-white border border-gray-300 rounded-full px-3 py-1">
                    {minRating === 5 ? "5★" : `${minRating}★ – ${minRating + 1}★`}
                    <button onClick={() => setMinRating(0)} className="ml-1 text-gray-400 hover:text-[#C1121F]">×</button>
                  </span>
                )}
                {selectedColors.map((c) => (
                  <span key={c} className="flex items-center gap-1 bg-white border border-gray-300 rounded-full px-3 py-1">
                    {c}
                    <button onClick={() => toggleColor(c)} className="ml-1 text-gray-400 hover:text-[#C1121F]">×</button>
                  </span>
                ))}
                {selectedSubCategories.map((s) => (
                  <span key={s} className="flex items-center gap-1 bg-white border border-gray-300 rounded-full px-3 py-1">
                    {s}
                    <button onClick={() => toggleSubCategory(s)} className="ml-1 text-gray-400 hover:text-[#C1121F]">×</button>
                  </span>
                ))}

                <button
                  onClick={clearAllFilters}
                  className="text-[#C1121F] underline text-xs font-semibold hover:opacity-80"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* RESULTS COUNT */}
            {!loading && (
              <p className="text-sm text-[#6E6E6E] mb-4">
                Showing {paginatedProducts.length} of {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              </p>
            )}

            {/* PRODUCTS GRID */}
            <div className="grid grid-cols-4 gap-10">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-gray-200 rounded-2xl mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))
              ) : paginatedProducts.length === 0 ? (
                <div className="col-span-4 flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-gray-400 text-lg mb-2">No products match your filters.</p>
                  <button
                    onClick={clearAllFilters}
                    className="text-[#C1121F] underline text-sm font-semibold"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                paginatedProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))
              )}
            </div>

            {/* PAGINATION */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-start gap-4 mt-14 text-sm">
                <button
                  onClick={() => setActivePage((p) => Math.max(p - 1, 1))}
                  disabled={activePage === 1}
                  className={`px-2 py-1 font-semibold ${
                    activePage === 1 ? "text-gray-400 cursor-not-allowed" : "hover:text-[#C1121F]"
                  }`}
                >
                  &lt;
                </button>

                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setActivePage(page)}
                      className={`px-2 py-1 font-semibold ${
                        activePage === page ? "text-[#C1121F]" : "text-gray-500 hover:text-[#C1121F]"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => setActivePage((p) => Math.min(p + 1, totalPages))}
                  disabled={activePage === totalPages}
                  className={`px-2 py-1 font-semibold ${
                    activePage === totalPages ? "text-gray-400 cursor-not-allowed" : "hover:text-[#C1121F]"
                  }`}
                >
                  &gt;
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}