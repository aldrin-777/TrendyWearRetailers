"use client";

import Image from 'next/image';
import { MdFavoriteBorder, MdArrowOutward, MdFavorite } from 'react-icons/md';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { addToWishlist } from '@/app/actions/user/AddToWishlist';

const BUCKET_NAME = "images";

type WomensProduct = {
  id: number;
  name: string;
  price: string;
  image: string;
};

export default function WomensWearScroll() {
  const [womensWearData, setWomensWearData] = useState<WomensProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchWomensWear() {
      const supabase = createClient();

      const { data: items, error } = await supabase
        .from("items")
        .select("id, name, image_id")
        .contains("tags", ["Women"]);

      if (error || !items) {
        console.error("Error fetching womens wear:", error);
        setLoading(false);
        return;
      }

      const itemIds = items.map((i) => i.id);

      const { data: prices } = await supabase
        .from("prices")
        .select("item_id, price")
        .in("item_id", itemIds);

      const priceMap: Record<number, number> = {};
      if (prices) {
        for (const p of prices) {
          if (!(p.item_id in priceMap)) priceMap[p.item_id] = p.price;
        }
      }

      const mapped: WomensProduct[] = items.map((item) => {
        const firstImageId = item.image_id?.[0] ?? null;
        const imageUrl = firstImageId
          ? supabase.storage.from(BUCKET_NAME).getPublicUrl(firstImageId).data.publicUrl
          : "/images/placeholder.jpg";

        const rawPrice = priceMap[item.id];
        const formattedPrice = rawPrice != null ? `₱${rawPrice.toLocaleString()}` : "Price unavailable";

        return {
          id: item.id,
          name: item.name ?? "Unnamed",
          price: formattedPrice,
          image: imageUrl,
        };
      });

      setWomensWearData(mapped);
      setLoading(false);
    }

    fetchWomensWear();
  }, []);

  return (
    <section className="w-full py-2 sm:py-10 bg-[#f8f9fa] overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full px-0 md:px-2">

        <div className="bg-[#b91c1c] w-[calc(100%+4rem)] lg:w-[calc(100%+10rem)] rounded-l-[15px] flex flex-col lg:flex-row overflow-hidden relative min-h-[600px] py-8">
            
        {/* LEFT PANEL */}
        <div className="w-full lg:w-[530px] shrink-0 p-8 md:p-12 text-white flex flex-col justify-between z-10 relative">
          <div className="space-y-4 pt-4">
            <h2 className="text-4xl text-[#FDF0D5] md:text-5xl lg:text-6xl font-semibold">
              Women&apos;s Wear
            </h2>
            <p className="text-red-100 text-3xl font-regular tracking-wide opacity-90">
              Made for her.
            </p>
          </div>

          <div className="pt-12 lg:pt-0 pb-1 border-b inline-flex items-center gap-2 w-fit cursor-pointer group">
            <span className="text-xl font-medium group-hover:text-red-100 transition">View All Product</span>
            <MdArrowOutward className="text-2xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ml-4" />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 min-w-0 bg-[#b91c1c] flex items-center relative">
          {/* Scrollable  */}
          <div className="w-full flex items-center gap-6 px-6 py-8 overflow-x-auto hide-scrollbar scroll-smooth fade-edge-left">
              {loading ? (
                /* SKELETON LOADERS (Using bg-white/20 to match the red background) */
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="shrink-0 w-[280px] sm:w-[300px]">
                    {/* Image Skeleton */}
                    <div className="aspect-[3.5/4] rounded-3xl bg-white/20 animate-pulse mb-5"></div>
                    {/* Text Skeletons */}
                    <div className="space-y-3">
                      <div className="h-6 bg-white/20 rounded animate-pulse w-3/4"></div>
                      <div className="h-5 bg-white/20 rounded animate-pulse w-1/3"></div>
                    </div>
                  </div>
                ))
              ) : womensWearData.length === 0 ? (
                <p className="text-slate-400 text-sm px-4">No items found.</p>
              ) :  (
              womensWearData.map((item, index) => (
                <div 
                  key={item.id} 
                  className="shrink-0 w-[280px] sm:w-[300px] group cursor-pointer animate-fade-in-up opacity-0"
                  style={{ 
                    animationDelay: `${index * 150}ms`, 
                    animationFillMode: 'forwards'       
                  }}
                  onClick={() => router.push(`/products/${item.id}`)} 
                >
                  <div className="aspect-[3.5/4] bg-neutral-100 rounded-3xl overflow-hidden mb-5 relative transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-black/20">    
                    <Image
                      src={item.image}        
                      alt={item.name}
                      fill                      
                      className="object-cover"  
                      priority
                    />
                    <button 
                      title="Heart"
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!wishlist.includes(item.id)) {
                          try {
                            await addToWishlist(item.id);
                            setWishlist([...wishlist, item.id]);
                          } catch (err) {
                            console.error("Failed to add to wishlist", err);
                          }
                        }
                      }}
                      className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors text-slate-900"
                    >
                      {wishlist.includes(item.id) ? <MdFavorite size={20} className="text-red-500" /> : <MdFavoriteBorder size={20} />}
                    </button>
                  </div>

                  <div className="text-white space-y-1">
                    <h3 className="font-medium text-[#FDF0D5] text-xl tracking-wide truncate">{item.name}</h3>
                    <p className="font-regular opacity-80">{item.price}</p>
                  </div>
                </div>
              ))
            )}
            <div className="w-20 shrink-0" />
          </div>
        </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}