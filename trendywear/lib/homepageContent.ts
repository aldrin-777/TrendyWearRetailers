export const HOMEPAGE_IMAGES_KEY = "images";

export type HomepageTextConfig = {
  brandTitle: string;
  announcement: string;
  navLabel1: string;
  navLabel2: string;
  navLabel3: string;
  headerCtaLabel: string;
  heroSlides: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
  }[];
  heroSideTopText: string;
  heroSideBottomText: string;
  collectionsTitle: string;
  collectionsDescription: string;
  womenTitle: string;
  womenSubtitle: string;
  womenButtonText: string;
  womenBackgroundColor: string;
  menTitle: string;
  menSubtitle: string;
  menButtonText: string;
  menBackgroundAccent: string;
};

export type HomepageImageConfig = {
  heroSlides: (string | null)[];
  heroSideTop: string | null;
  heroSideBottom: string | null;
  seasonImages: (string | null)[];
};

export const DEFAULT_HOMEPAGE_TEXT_CONFIG: HomepageTextConfig = {
  brandTitle: "TRENDY WEAR",
  announcement: "New arrivals this week",
  navLabel1: "Products",
  navLabel2: "New In",
  navLabel3: "Sales",
  headerCtaLabel: "Shop Now",
  heroSlides: [
    { title: "Hero Title 1", subtitle: "Slide subtitle 1", buttonText: "View Collection", buttonLink: "/products" },
    { title: "Hero Title 2", subtitle: "Slide subtitle 2", buttonText: "View Collection", buttonLink: "/products" },
    { title: "Hero Title 3", subtitle: "Slide subtitle 3", buttonText: "View Collection", buttonLink: "/products" },
    { title: "Hero Title 4", subtitle: "Slide subtitle 4", buttonText: "View Collection", buttonLink: "/products" },
  ],
  heroSideTopText: "#Straight Wear",
  heroSideBottomText: "#Twill Accessory",
  collectionsTitle: "Collection for all seasons.",
  collectionsDescription:
    "A versatile foundation for every day. Our Collection for All Seasons blends minimalist design with year-round durability, offering timeless essentials engineered to transition effortlessly through any climate.",
  womenTitle: "Women's Wear",
  womenSubtitle: "Made for her.",
  womenButtonText: "View All Product",
  womenBackgroundColor: "#C1121F",
  menTitle: "Men's Wear",
  menSubtitle: "Made for him.",
  menButtonText: "View All Product",
  menBackgroundAccent: "#EEF3F7",
};

const DEFAULT_IMAGE_CONFIG: HomepageImageConfig = {
  heroSlides: [null, null, null, null],
  heroSideTop: null,
  heroSideBottom: null,
  seasonImages: [null, null, null, null],
};

export function normalizeHomepageImageConfig(input: unknown): HomepageImageConfig {
  if (!input || typeof input !== "object") return DEFAULT_IMAGE_CONFIG;
  const raw = input as Partial<HomepageImageConfig>;

  const heroSlides = Array.isArray(raw.heroSlides) ? raw.heroSlides.slice(0, 4) : [];
  while (heroSlides.length < 4) heroSlides.push(null);

  const seasonImages = Array.isArray(raw.seasonImages) ? raw.seasonImages.slice(0, 4) : [];
  while (seasonImages.length < 4) seasonImages.push(null);

  return {
    heroSlides: heroSlides.map((v) => (typeof v === "string" && v.trim() ? v : null)),
    heroSideTop:
      typeof raw.heroSideTop === "string" && raw.heroSideTop.trim() ? raw.heroSideTop : null,
    heroSideBottom:
      typeof raw.heroSideBottom === "string" && raw.heroSideBottom.trim()
        ? raw.heroSideBottom
        : null,
    seasonImages: seasonImages.map((v) => (typeof v === "string" && v.trim() ? v : null)),
  };
}

export function normalizeHomepageTextConfig(input: unknown): HomepageTextConfig {
  if (!input || typeof input !== "object") return DEFAULT_HOMEPAGE_TEXT_CONFIG;
  const raw = input as Partial<HomepageTextConfig>;
  const rawSlides = Array.isArray(raw.heroSlides) ? raw.heroSlides.slice(0, 4) : [];
  while (rawSlides.length < 4) rawSlides.push(DEFAULT_HOMEPAGE_TEXT_CONFIG.heroSlides[rawSlides.length]);
  const slides = rawSlides.map((slide, i) => {
    const fallback = DEFAULT_HOMEPAGE_TEXT_CONFIG.heroSlides[i];
    return {
      title: typeof slide?.title === "string" && slide.title.trim() ? slide.title : fallback.title,
      subtitle:
        typeof slide?.subtitle === "string" && slide.subtitle.trim()
          ? slide.subtitle
          : fallback.subtitle,
      buttonText:
        typeof slide?.buttonText === "string" && slide.buttonText.trim()
          ? slide.buttonText
          : fallback.buttonText,
      buttonLink:
        typeof slide?.buttonLink === "string" && slide.buttonLink.trim()
          ? slide.buttonLink
          : fallback.buttonLink,
    };
  });

  return {
    brandTitle: typeof raw.brandTitle === "string" && raw.brandTitle.trim() ? raw.brandTitle : DEFAULT_HOMEPAGE_TEXT_CONFIG.brandTitle,
    announcement:
      typeof raw.announcement === "string" && raw.announcement.trim()
        ? raw.announcement
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.announcement,
    navLabel1: typeof raw.navLabel1 === "string" && raw.navLabel1.trim() ? raw.navLabel1 : DEFAULT_HOMEPAGE_TEXT_CONFIG.navLabel1,
    navLabel2: typeof raw.navLabel2 === "string" && raw.navLabel2.trim() ? raw.navLabel2 : DEFAULT_HOMEPAGE_TEXT_CONFIG.navLabel2,
    navLabel3: typeof raw.navLabel3 === "string" && raw.navLabel3.trim() ? raw.navLabel3 : DEFAULT_HOMEPAGE_TEXT_CONFIG.navLabel3,
    headerCtaLabel:
      typeof raw.headerCtaLabel === "string" && raw.headerCtaLabel.trim()
        ? raw.headerCtaLabel
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.headerCtaLabel,
    heroSlides: slides,
    heroSideTopText:
      typeof raw.heroSideTopText === "string" && raw.heroSideTopText.trim()
        ? raw.heroSideTopText
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.heroSideTopText,
    heroSideBottomText:
      typeof raw.heroSideBottomText === "string" && raw.heroSideBottomText.trim()
        ? raw.heroSideBottomText
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.heroSideBottomText,
    collectionsTitle:
      typeof raw.collectionsTitle === "string" && raw.collectionsTitle.trim()
        ? raw.collectionsTitle
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.collectionsTitle,
    collectionsDescription:
      typeof raw.collectionsDescription === "string" && raw.collectionsDescription.trim()
        ? raw.collectionsDescription
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.collectionsDescription,
    womenTitle: typeof raw.womenTitle === "string" && raw.womenTitle.trim() ? raw.womenTitle : DEFAULT_HOMEPAGE_TEXT_CONFIG.womenTitle,
    womenSubtitle:
      typeof raw.womenSubtitle === "string" && raw.womenSubtitle.trim()
        ? raw.womenSubtitle
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.womenSubtitle,
    womenButtonText:
      typeof raw.womenButtonText === "string" && raw.womenButtonText.trim()
        ? raw.womenButtonText
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.womenButtonText,
    womenBackgroundColor:
      typeof raw.womenBackgroundColor === "string" && raw.womenBackgroundColor.trim()
        ? raw.womenBackgroundColor
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.womenBackgroundColor,
    menTitle: typeof raw.menTitle === "string" && raw.menTitle.trim() ? raw.menTitle : DEFAULT_HOMEPAGE_TEXT_CONFIG.menTitle,
    menSubtitle:
      typeof raw.menSubtitle === "string" && raw.menSubtitle.trim()
        ? raw.menSubtitle
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.menSubtitle,
    menButtonText:
      typeof raw.menButtonText === "string" && raw.menButtonText.trim()
        ? raw.menButtonText
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.menButtonText,
    menBackgroundAccent:
      typeof raw.menBackgroundAccent === "string" && raw.menBackgroundAccent.trim()
        ? raw.menBackgroundAccent
        : DEFAULT_HOMEPAGE_TEXT_CONFIG.menBackgroundAccent,
  };
}

export async function fetchHomepageImageConfig(supabase: any): Promise<HomepageImageConfig> {
  const { data, error } = await supabase
    .from("homepage_content")
    .select("data")
    .eq("key", HOMEPAGE_IMAGES_KEY)
    .maybeSingle();

  if (error) return DEFAULT_IMAGE_CONFIG;
  return normalizeHomepageImageConfig(data?.data);
}

export async function fetchHomepageTextConfig(supabase: any): Promise<HomepageTextConfig> {
  const { data, error } = await supabase
    .from("homepage_content")
    .select("data")
    .eq("key", "text")
    .maybeSingle();
  if (error) return DEFAULT_HOMEPAGE_TEXT_CONFIG;
  return normalizeHomepageTextConfig(data?.data);
}

export async function saveHomepageImageConfig(
  supabase: any,
  config: HomepageImageConfig
): Promise<void> {
  const payload = normalizeHomepageImageConfig(config);
  const { error } = await supabase.from("homepage_content").upsert(
    {
      key: HOMEPAGE_IMAGES_KEY,
      data: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) throw new Error(error.message);
}

export async function saveHomepageTextConfig(
  supabase: any,
  config: HomepageTextConfig
): Promise<void> {
  const payload = normalizeHomepageTextConfig(config);
  const { error } = await supabase.from("homepage_content").upsert(
    {
      key: "text",
      data: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) throw new Error(error.message);
}
