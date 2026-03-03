"use client";

import Breadcrumb from "../components/Breadcrumb";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { fetchProducts, Product } from "../lib/fetchProducts";
import FiltersSidebar from "../components/FilterSidebar";
import { useSearchParams } from "next/navigation";

const BUCKET_NAME = "images";

export default function Page() {
  const [selectedSize, setSelectedSize] = useState("XS");
  const [activeCategory, setActiveCategory] = useState();
  const [searchQuery, setSearchQuery] = useState<string|null>();
  const [activePage, setActivePage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  
  // ✅ sub-category state
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    []
  );

  // ✅ toggle function
  const toggleSubCategory = (value: string) => {
    setSelectedSubCategories((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const toggleColor = (value: string) => {
    setSelectedColors((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const [price, setPrice] = useState(200);

  const [selectedFits, setSelectedFits] = useState<string[]>([]);
  const toggleFit = (value: string) => {
    setSelectedFits((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const [rating, setRating] = useState(0);

  const totalPages = 4;

  const categories = ["Men","Women","Tops", "Bottoms", "Shirt", "Dress"];

  useEffect(() => {
    fetchProducts(searchParams.get('search'),searchParams.get('tags'))
      .then(setProducts)
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(()=>{
    if (activeCategory){
      fetchProducts(searchParams.get('search'),activeCategory)
      .then(setProducts)
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
    }
  },[activeCategory])

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <main className="max-w-[1440px] mx-auto px-10 py-10">
        <div className="grid grid-cols-[260px_1fr] gap-14 items-start">
          {/* ✅ FILTERS */}
          <FiltersSidebar
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
            activeCategory={activeCategory}
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

          {/* RIGHT COLUMN */}
          <section>
            {/* BREADCRUMB */}
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Products" },
              ]}
            />

            {/* TITLE */}
            <h1 className="text-4xl font-bold text-[#C1121F] mb-4">
              New In
            </h1>

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
                        setActiveCategory(cat);
                        setSelectedSubCategories([]); // ✅ reset sub-categories when switching tab
                      }}
                      className={`px-4 py-2 text-xs border rounded-lg transition ${isActive
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

            {/* PRODUCTS GRID */}
            <div className="grid grid-cols-4 gap-10">
              {loading ? (
                <p className="text-gray-400 text-sm col-span-4">
                  Loading products...
                </p>
              ) : (
                products.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))
              )}
            </div>

            {/* PAGINATION */}
            <div className="flex justify-start gap-4 mt-14 text-sm">
              <button
                onClick={() => setActivePage((p) => Math.max(p - 1, 1))}
                disabled={activePage === 1}
                className={`px-2 py-1 font-semibold ${activePage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:text-[#C1121F]"
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
                    className={`px-2 py-1 font-semibold ${activePage === page
                      ? "text-[#C1121F]"
                      : "text-gray-500 hover:text-[#C1121F]"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setActivePage((p) => Math.min(p + 1, totalPages))}
                disabled={activePage === totalPages}
                className={`px-2 py-1 font-semibold ${activePage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:text-[#C1121F]"
                  }`}
              >
                &gt;
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}