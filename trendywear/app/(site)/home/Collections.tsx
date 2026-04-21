"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { fetchHomepageImageConfig, fetchHomepageTextConfig } from "@/lib/homepageContent";

const BUCKET_NAME = "images";

type CollectionItem = {
  id: number;
  name: string;
  image: string;
  href?: string | null;
};

export default function Collections() {
  const [collectionsData, setCollectionsData] = useState<CollectionItem[]>([]);
  const [sectionTitle, setSectionTitle] = useState("Collection for all seasons.");
  const [sectionDescription, setSectionDescription] = useState(
    "A versatile foundation for every day. Our Collection for All Seasons blends minimalist design with year-round durability, offering timeless essentials engineered to transition effortlessly through any climate."
  );
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchCollections() {
      const supabase = createClient();
      const config = await fetchHomepageImageConfig(supabase);
      const textConfig = await fetchHomepageTextConfig(supabase);
      setSectionTitle(textConfig.collectionsTitle);
      setSectionDescription(textConfig.collectionsDescription);

      const { data: items, error } = await supabase
        .from("items")
        .select("id, name, image_id")
        .limit(20);

      if (error || !items) {
        console.error("Error fetching collections:", error);
        setLoading(false);
        return;
      }

      const customSeasonImages = config.seasonImages
        .filter((path): path is string => Boolean(path))
        .map((path, index) => ({
          id: -1 * (index + 1),
          name: `Season Image ${index + 1}`,
          image: supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data.publicUrl,
          href: null,
        }));

      if (customSeasonImages.length === 4) {
        setCollectionsData(customSeasonImages);
        setLoading(false);
        return;
      }

      const randomItems = items.sort(() => Math.random() - 0.5).slice(0, 4);

      const mapped: CollectionItem[] = randomItems.map((item) => {
        const firstImageId = item.image_id?.[0] ?? null;

        const imageUrl = firstImageId
          ? supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(firstImageId).data.publicUrl
          : "/images/placeholder.jpg";

        return {
          id: item.id,
          name: item.name ?? "Unnamed",
          image: imageUrl,
          href: `/products/${item.id}`,
        };
      });

      setCollectionsData(mapped);
      setLoading(false);
    }

    fetchCollections();
  }, []);

  return (
    <section className="w-full bg-[#f8f9fa] py-10 sm:py-20">
      <div className="max-w-7xl mx-auto px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 
            className="text-3xl md:text-4xl font-medium animate-fade-in-up opacity-0"
            style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
          >
            {sectionTitle}
          </h2>
          <p 
            className="font-light text-xl animate-fade-in-up opacity-0"
            style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
          >
            {sectionDescription}
          </p>
        </div>

      <div className="flex flex-wrap justify-center">
        {loading ? (
          // Skeleton loading state
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="w-1/2 sm:w-1/2 md:w-1/4 lg:w-1/5 px-3 mb-6 flex-shrink-0"
            >
              <div className="aspect-[3/4] rounded-2xl bg-slate-200/60 animate-pulse" />
            </div>
          ))
        ) : collectionsData.length === 0 ? (
          <p className="text-gray-500">No items found.</p>
        ) : (
          collectionsData.map((item, index) => {
            // Keep your mtClass logic for large screens
            const mtClass =
              index === 0 ? "lg:mt-12" :
              index === 1 ? "lg:mt-6" :
              index === 2 ? "lg:mt-24" : "lg:mt-0";

            return (
              <div
                key={item.id}
                className={`${mtClass} w-1/2 sm:w-1/2 md:w-1/4 lg:w-1/5 px-3 mb-6 flex-shrink-0 animate-fade-in-up opacity-0`}
                style={{ 
                  animationDelay: `${(index + 2) * 150}ms`,
                  animationFillMode: 'forwards' 
                }}
              >
                <div 
                  className="aspect-[3/4] rounded-2xl transition duration-300 cursor-pointer relative group overflow-hidden"
                  onClick={() => {
                    if (item.href) router.push(item.href);
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    priority
                  />

                  {/* Hover Overlay */}
                  {item.href ? (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 bg-black/20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(item.href!);
                        }}
                        className="bg-white/90 px-4 py-2 rounded-full text-sm font-semibold text-black shadow-sm hover:bg-white transition-colors"
                      >
                        View Item
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </section>
  );
}