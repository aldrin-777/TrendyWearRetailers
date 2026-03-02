// components/home/Hero.tsx
"use client";

import Link from "next/link";
import Carousel from "./ui/Carousel";
import Image from "next/image";
import CategoryLink from "./ui/CategoryLink";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const BUCKET_NAME = "images";

interface HeroSlide {
  title: string;
  description: string;
  href: string;
  image: string;
}

interface StackedCard {
  id: number;
  title: string;
  image: string;
}

export default function Hero() {
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [stackedCards, setStackedCards] = useState<StackedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHeroData() {
      const supabase = createClient();

      const { data: shirtItems, error: shirtsError } = await supabase
        .from("items")
        .select("id, name, image_id")
        .contains("tags", ["Graphic Tees"])
        .limit(4);

      const { data: trouserItems, error: trouserError } = await supabase
        .from("items")
        .select("id, name, image_id")
        .contains("tags", ["Trouser"])
        .range(1, 1); 

      const { data: accessoryItems, error: accessoryError } = await supabase
        .from("items")
        .select("id, name, image_id")
        .contains("tags", ["Accessories"])
        .range(0, 0); 

    if ((trouserError && accessoryError) || (!trouserItems && !accessoryItems)) {
      console.error("Error fetching stacked card data:", trouserError || accessoryError);
      setLoading(false);
      return;
    }

      const slides: HeroSlide[] = (shirtItems || []).map((item) => {
        const firstImageId = item.image_id?.[0] ?? null;
        const imageUrl = firstImageId
          ? supabase.storage.from(BUCKET_NAME).getPublicUrl(firstImageId).data.publicUrl
          : "/images/placeholder.jpg";

        return {
          title: item.name ?? "Featured Shirts",
          description: "Check out our latest shirt collection",
          href: `/products/${item.id}`,
          image: imageUrl,
        };
      });

      const stacked: StackedCard[] = [
        ...(trouserItems || []).map((item, idx) => ({
          id: 1,
          title: `#${item.name?.split(" ")[0] || "Trendy"} Wear`,
          image: item.image_id?.[0]
            ? supabase.storage.from(BUCKET_NAME).getPublicUrl(item.image_id[0]).data.publicUrl
            : "/images/placeholder.jpg",
        })),
        ...(accessoryItems || []).map((item, idx) => ({
          id: 2,
          title: `#${item.name?.split(" ")[0] || "Cool"} Accessory`,
          image: item.image_id?.[0]
            ? supabase.storage.from(BUCKET_NAME).getPublicUrl(item.image_id[0]).data.publicUrl
            : "/images/placeholder.jpg",
        })),
      ];

      setHeroSlides(slides);
      setStackedCards(stacked);
      setLoading(false);
    }

    fetchHeroData();
  }, []);

  // Fallback in case we don't have enough data
  const displaySlides = heroSlides.length >= 2 ? heroSlides : [
    {
      title: "New Collection",
      description: "Discover fresh styles",
      href: "/collections",
      image: "/images/placeholder.jpg",
    },
  ];

  return (
    <section className="w-full bg-[#f8f9fa] py-8">
      <div className="max-w-7xl mx-auto px-8 flex flex-col">

        {/* TOP: Left Large + Right Stacked */}
        <div className="flex flex-col lg:flex-row gap-4 h-[500px] mb-12">
          
          {/* LEFT: Large Feature Card */}
          <div 
            className="lg:flex-[2] relative flex-1 rounded-2xl overflow-hidden animate-fade-in-up opacity-0"
            style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
          >
            {loading || displaySlides.length === 0 ? (
              <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
            ) : (
              <Carousel slides={displaySlides} interval={4000} />
            )}
          </div> 

          {/* RIGHT: Stacked Small Cards */}
          <div className="flex-1 flex flex-col gap-6">
            {loading ? (
              // Skeleton cards
              <>
                <div className="flex-1 bg-slate-200/60 rounded-2xl animate-pulse" />
                <div className="flex-1 bg-slate-200/60 rounded-2xl animate-pulse" />
              </>
            ) : stackedCards.length > 0 ? (
              stackedCards.map((card, index) => (
                <div 
                  key={card.id} 
                  className="relative flex-1 rounded-2xl overflow-hidden group animate-fade-in-up opacity-0"
                  style={{ 
                    animationDelay: `${(index + 1) * 150}ms`,
                    animationFillMode: 'forwards' 
                  }}
                >
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* DARK OVERLAY */}
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute bottom-6 left-6">
                    <span className="text-2xl font-medium text-white tracking-wide">
                      {card.title}
                    </span>
                  </div>
                </div>
              ))
            ) : null}
          </div>
        </div>

        {/* BOTTOM: Category Links */}
        <div className="flex flex-col md:flex-row gap-8">
          {[
            { title: "Best Selling", href: "/best-selling" },
            { title: "Women's Wear", href: "/womens" },
            { title: "Men's Wear", href: "/mens" }
          ].map((link, index) => (
             <div 
               key={link.title}
               className="flex-1 animate-fade-in-up opacity-0"
               style={{ 
                 animationDelay: `${(index + 3) * 150}ms`,
                 animationFillMode: 'forwards' 
               }}
             >
               <CategoryLink title={link.title} href={link.href} />
             </div>
          ))}
        </div>

      </div>
    </section>
  );
}