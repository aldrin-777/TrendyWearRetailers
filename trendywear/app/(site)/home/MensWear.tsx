"use client";

import Link from "next/link";
import Image from "next/image";
import { MdArrowOutward, MdFavoriteBorder, MdFavorite } from "react-icons/md";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { addToWishlist } from "@/app/actions/user/AddToWishlist";
import { removeFromWishlist } from "@/app/actions/user/RemoveFromWishlist";
import { fetchFavorites } from "../lib/fetchFavorites";
import { fetchHomepageTextConfig } from "@/lib/homepageContent";
import TopModal from "../components/TopModal";

const BUCKET_NAME = "images";

type MensProduct = {
  id: number;
  name: string;
  price: string;
  image: string;
};

export default function MensWear() {
  const [mensWearData, setMensWearData] = useState<MensProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("Men's Wear");
  const [sectionSubtitle, setSectionSubtitle] = useState("Made for him.");
  const [sectionButtonText, setSectionButtonText] = useState("View All Product");
  const [sectionAccent, setSectionAccent] = useState("#003049");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [modal, setModal] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchMensWear() {
      const supabase = createClient();
      const textConfig = await fetchHomepageTextConfig(supabase);
      setSectionTitle(textConfig.menTitle);
      setSectionSubtitle(textConfig.menSubtitle);
      setSectionButtonText(textConfig.menButtonText);
      setSectionAccent(textConfig.menBackgroundAccent || "#003049");

      const { data: items, error } = await supabase
        .from("items")
        .select("id, name, image_id")
        .contains("tags", ["Men"]);

      if (error || !items) {
        console.error("Error fetching mens wear:", error);
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

      const mapped: MensProduct[] = items.map((item) => {
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

      setMensWearData(mapped);
      
      const { data: { user } } = await supabase.auth.getUser();
      const user_id = user?.id;
      if (user){
        try {
          const favorites = await fetchFavorites();
          const favoriteIds = favorites.map(f => f.id);
          setWishlist(favoriteIds);
        } catch (err) {
          console.error("Error fetching favorites:", err);
        }
      }
      setLoading(false);
    }

    fetchMensWear();
  }, []);


  const handleWishlist = async (itemId: number) => {
    if (wishlist.includes(itemId)) {
      // remove
      try {
        const res = await removeFromWishlist(itemId);
        if (res?.success) {
          setWishlist(prev => prev.filter(id => id !== itemId));
          setModal({ message: "Removed from wishlist", type: "success" });
        } else {
          setModal({ message: "Failed to remove from wishlist", type: "error" });
        }
      } catch (err) {
        console.error(err);
        setModal({ message: "Failed to remove from wishlist", type: "error" });
      }
    } else {
      // add
      try {
        const res = await addToWishlist(itemId);
        if (res?.success) {
          setWishlist(prev => [...prev, itemId]);
          setModal({ message: "Added to wishlist", type: "success" });
        } else {
          setModal({ message: "Failed to add to wishlist", type: "error" });
        }
      } catch (err) {
        console.error(err);
        setModal({ message: "Failed to add to wishlist", type: "error" });
      }
    }
  };

  return (
    <section className="w-full bg-[#f8f9fa] py-8 sm:py-16 overflow-hidden">
      {modal && (
        <TopModal
          message={modal.message}
          type={modal.type}
          onClose={() => setModal(null)}
        />
      )}
      <div className="max-w-7xl mx-auto px-8">
        {/* Top Divider */}
        <div className="border-t border-slate-300 w-full mb-8 sd:mb-12"/>
      </div>

      <div className="max-w-7xl mx-auto w-full pr-4 md:pr-0 relative">
      <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-12 w-full lg:w-[calc(100%+10rem)] lg:-ml-[10rem] box-border lg:min-h-[400px]">        
        {/* LEFT PANEL */}
        <div className="flex-1 min-w-0 flex relative justify-end order-2 lg:order-1">
          {/* SCROLL CONTAINER */}
          <div className="flex items-center gap-6 px-6 py-8 overflow-x-auto hide-scrollbar scroll-smooth fade-edge-right">
              {loading ? (
                /* SKELETON LOADERS */
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className="shrink-0 w-[280px] sm:w-[300px]">
                    <div className="aspect-[3.5/4] rounded-3xl bg-slate-200/60 animate-pulse mb-5"></div>
                    <div className="space-y-3">
                      <div className="h-6 bg-slate-200/60 rounded animate-pulse w-3/4"></div>
                      <div className="h-5 bg-slate-200/60 rounded animate-pulse w-1/3"></div>
                    </div>
                  </div>
                ))
              ) : mensWearData.length === 0 ? (
                <p className="text-slate-400 text-sm px-4">No items found.</p>
              ) : (
              mensWearData.map((item, index) => (
                <div 
                  key={item.id} 
                  className="shrink-0 w-[280px] sm:w-[300px] group cursor-pointer animate-fade-in-up opacity-0"
                  style={{ 
                    animationDelay: `${index * 150}ms`, // Staggers the animation by 150ms per card
                    animationFillMode: 'forwards'       // Ensures they stay visible after animating
                  }}
                  onClick={() => router.push(`/products/${item.id}`)} 
                >
                  <div className="aspect-[3.5/4] rounded-3xl overflow-hidden mb-5 relative transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-black/20">
                    
                    {/* IMAGE */}
                    <Image
                      src={item.image}        
                      alt={item.name}
                      fill                      
                      className="object-cover"  
                      priority
                    />
                    
                    {/* WISHLIST BUTTON */}
                    <button
                      title="Heart"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWishlist(item.id);
                      }}
                      className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors text-slate-900"
                    >
                      {wishlist.includes(item.id) ? (
                        <MdFavorite size={20} className="text-red-500" />
                      ) : (
                        <MdFavoriteBorder size={20} />
                      )}
                    </button>
                  </div>

                  {/* TEXT */}
                  <div className="text-white space-y-1">
                    <h3 className="font-medium text-xl tracking-wide truncate" style={{ color: sectionAccent }}>{item.name}</h3>
                    <p className="font-regular text-[#1E293B]">{item.price}</p>
                  </div>
                </div>
              ))
            )}
            
            {/* Padding at the end so last card isn't flush to edge */}
            <div className="w-20 shrink-0" />
          </div>
        </div>

        {/* RIGHT SIDE: Text Content */}
        <div className="w-full lg:w-[400px] pl-8 lg:pl-0 flex flex-col justify-between lg:items-end lg:text-right shrink-0 lg:min-h-[460px] order-1 lg:order-2">
          <div className="space-y-4 pt-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-wide text-[#003049]">
              {sectionTitle}
            </h2>
            <p className="text-3xl font-regular tracking-wide opacity-90">
              {sectionSubtitle}
            </p>
          </div>
          
          <div className="pt-12 lg:pt-0 pb-1 border-b inline-flex items-center gap-2 w-fit cursor-pointer group">
            <Link href="/products-page?category=Men">
              <span className="text-xl font-medium group-hover:text-black-100 transition">{sectionButtonText}</span>
            </Link>
            <MdArrowOutward className="text-2xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform ml-4" />
          </div>
        </div>
      </div>
      </div>

      <div className="max-w-7xl mx-auto px-8">
        {/* Bottom Divider */}
        <div className="border-t border-slate-300 w-full mt-4 sm:mt-12" />
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .fade-edge-right {
          -webkit-mask-image: linear-gradient(to left, transparent 0%, black 5%);
          mask-image: linear-gradient(to left, transparent 0%, black 5%);
        }
      `}</style>
    </section>
  );
}