"use client";

import { useState , useEffect} from "react";
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import Breadcrumb from "@/app/(site)/components/Breadcrumb";
import { fetchFavorites,Product } from "../lib/fetchFavorites";

export default function Favorites() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    fetchFavorites()
      .then(setFavorites)
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  },[])

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center">
      
      {/* OUTER WRAPPER: Matches your Cart page (max-w-7xl / 1280px) */}
      <div className="w-full max-w-7xl flex flex-col min-h-screen px-6">
        
        {/* HEADER: Spans the full 1280px width */}
        <header className="pt-10 pb-4">
          {/* BREADCRUMB */}
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
              {favorites.length} Items
            </span>
          </div>
        </header>

        <section className="flex-grow">
            {!loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pb-10 lg:pb-4">
                {favorites.length === 0 ? (
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
                  favorites.map((favorites) => (
                    <ProductCard key={favorites.id} {...favorites} />
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
      </div>
    </div>
  );
}