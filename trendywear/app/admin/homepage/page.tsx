"use client";

import React, { useState } from "react";
import {
    FiChevronDown,
    FiChevronRight,
    FiEdit3,
    FiEye,
    FiEyeOff,
    FiImage,
    FiLayout,
    FiMonitor,
    FiPlus,
    FiSave,
    FiSearch,
    FiTag,
    FiTrash2,
    FiType,
    FiUpload,
} from "react-icons/fi";

type SectionCardProps = {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    badge?: string;
    children: React.ReactNode;
};

type HeroSlide = {
    id: number;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
};

type HeroSideCard = {
    id: string;
    title: string;
    description: string;
    defaultText: string;
    uploadTitle: string;
    uploadDescription: string;
};

type CollectionItem = {
    id: number;
    title: string;
};

const heroSlides: HeroSlide[] = [
    {
        id: 1,
        title: "Hero Title 1",
        subtitle: "Slide subtitle 1",
        buttonText: "View Collection",
        buttonLink: "/products",
    },
    {
        id: 2,
        title: "Hero Title 2",
        subtitle: "Slide subtitle 2",
        buttonText: "View Collection",
        buttonLink: "/products",
    },
    {
        id: 3,
        title: "Hero Title 3",
        subtitle: "Slide subtitle 3",
        buttonText: "View Collection",
        buttonLink: "/products",
    },
    {
        id: 4,
        title: "Hero Title 4",
        subtitle: "Slide subtitle 4",
        buttonText: "View Collection",
        buttonLink: "/products",
    },
];

const heroSideCards: HeroSideCard[] = [
    {
        id: "top",
        title: "Top Right Card",
        description:
            "This card stays fixed and does not rotate with the hero slides.",
        defaultText: "#Straight Wear",
        uploadTitle: "Top Right Card Image",
        uploadDescription: "Fixed image for the top right card.",
    },
    {
        id: "bottom",
        title: "Bottom Right Card",
        description:
            "This card stays fixed and does not rotate with the hero slides.",
        defaultText: "#Twill Accessory",
        uploadTitle: "Bottom Right Card Image",
        uploadDescription: "Fixed image for the bottom right card.",
    },
];

const womenItems: CollectionItem[] = [
    { id: 1, title: "Button Down Shirt" },
    { id: 2, title: "Notched Collar Shirt Comfort" },
    { id: 3, title: "Graphic T-Shirt With Bi..." },
    { id: 4, title: "Relaxed Fit Cotton Blouse" },
    { id: 5, title: "Soft Casual Summer Top" },
    { id: 6, title: "Oversized Fashion Tee" },
    { id: 7, title: "Modern Layered Cardigan" },
    { id: 8, title: "Essential Ribbed Top" },
];

const menItems: CollectionItem[] = [
    { id: 1, title: "Regular Fit Tonal Striped..." },
    { id: 2, title: "Regular Fit Seersucker Shirt" },
    { id: 3, title: "Regular Fit Button Down..." },
    { id: 4, title: "Cotton Polo Minimal" },
    { id: 5, title: "Everyday Utility Shirt" },
    { id: 6, title: "Relaxed Urban Tee" },
    { id: 7, title: "Structured Summer Shirt" },
    { id: 8, title: "Classic Casual Longsleeve" },
];

function SectionCard({
    icon,
    title,
    subtitle,
    badge,
    children,
}: SectionCardProps) {
    return (
        <section className="overflow-hidden rounded-[30px] border border-[#eee6e2] bg-[#fcfbfa] shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
            <div className="border-b border-[#efe7e3] px-6 py-5 md:px-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F8ECEC] text-[#C1121F]">
                            {icon}
                        </div>

                        <div>
                            <h2 className="text-[24px] font-semibold leading-none text-[#111827] md:text-[28px]">
                                {title}
                            </h2>
                            <p className="mt-2 text-[14px] leading-6 text-[#6b7280] md:text-[15px]">
                                {subtitle}
                            </p>
                        </div>
                    </div>

                    {badge ? (
                        <div className="inline-flex w-fit items-center rounded-full bg-[#F8ECEC] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C1121F]">
                            {badge}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="px-6 py-6 md:px-7">{children}</div>
        </section>
    );
}

function TextInput({
    label,
    placeholder,
    defaultValue,
}: {
    label: string;
    placeholder?: string;
    defaultValue?: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[14px] font-medium text-[#374151] md:text-[15px]">
                {label}
            </span>
            <input
                type="text"
                placeholder={placeholder}
                defaultValue={defaultValue}
                className="h-14 w-full rounded-[18px] border border-[#e8ddd8] bg-white px-5 text-[15px] text-[#111827] outline-none transition focus:border-[#C1121F]/50 focus:ring-4 focus:ring-[#C1121F]/10 md:text-[16px]"
            />
        </label>
    );
}

function TextArea({
    label,
    placeholder,
    defaultValue,
    rows = 5,
}: {
    label: string;
    placeholder?: string;
    defaultValue?: string;
    rows?: number;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[14px] font-medium text-[#374151] md:text-[15px]">
                {label}
            </span>
            <textarea
                rows={rows}
                placeholder={placeholder}
                defaultValue={defaultValue}
                className="w-full rounded-[18px] border border-[#e8ddd8] bg-white px-5 py-4 text-[15px] text-[#111827] outline-none transition focus:border-[#C1121F]/50 focus:ring-4 focus:ring-[#C1121F]/10 md:rounded-[20px] md:text-[16px]"
            />
        </label>
    );
}

function UploadCard({
    title,
    description,
    compact = false,
}: {
    title: string;
    description: string;
    compact?: boolean;
}) {
    return (
        <div className="rounded-[24px] border border-dashed border-[#ead8d2] bg-white p-4">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F7F3F2] text-[#C1121F] shadow-sm md:h-12 md:w-12">
                    <FiImage size={20} />
                </div>

                <div className="min-w-0">
                    <h4 className="text-[17px] font-semibold leading-7 text-[#111827] md:text-[18px]">
                        {title}
                    </h4>
                    <p className="mt-1 text-[13px] leading-6 text-[#6b7280] md:text-[14px]">
                        {description}
                    </p>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-[#C1121F] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    <FiUpload size={15} />
                    Upload image
                </button>

                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[#e4d7d2] bg-white px-5 py-2.5 text-sm font-medium text-[#374151] transition hover:border-[#C1121F]/30 hover:text-[#C1121F]"
                >
                    <FiEdit3 size={15} />
                    Replace
                </button>
            </div>

            <div
                className={`mt-5 overflow-hidden rounded-[20px] border border-[#f0e8e5] bg-[#F5F1F0] ${compact ? "aspect-[4/3]" : "aspect-[16/10]"
                    }`}
            >
                <div className="flex h-full items-center justify-center text-sm text-[#9CA3AF]">
                    Image preview
                </div>
            </div>
        </div>
    );
}

function SlideEditor({
    slide,
    isOpen,
    onToggle,
}: {
    slide: HeroSlide;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="overflow-hidden rounded-[26px] border border-[#ece3de] bg-white">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#fcf7f6]"
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8ECEC] text-sm font-bold text-[#C1121F]">
                        {slide.id}
                    </div>

                    <div>
                        <p className="text-[17px] font-semibold text-[#111827]">
                            Hero Slide {slide.id}
                        </p>
                        <p className="mt-1 text-sm text-[#6b7280]">
                            Main banner content and call-to-action
                        </p>
                    </div>
                </div>

                <div className="text-[#6b7280]">
                    {isOpen ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-[#f0e7e3] px-5 py-5">
                    <div className="space-y-6">
                        <div className="grid gap-5 xl:grid-cols-2">
                            <TextInput
                                label="Slide Title"
                                defaultValue={slide.title}
                                placeholder="Slide title"
                            />
                            <TextInput
                                label="Slide Subtitle"
                                defaultValue={slide.subtitle}
                                placeholder="Slide subtitle"
                            />
                            <TextInput
                                label="Button Text"
                                defaultValue={slide.buttonText}
                                placeholder="Button text"
                            />
                            <TextInput
                                label="Button Link"
                                defaultValue={slide.buttonLink}
                                placeholder="Button link"
                            />
                        </div>

                        <UploadCard
                            title="Main Slide Image"
                            description="Large banner image for this carousel slide."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function HeroSideCardEditor({ card }: { card: HeroSideCard }) {
    return (
        <div className="space-y-5 rounded-[24px] border border-[#ece3de] bg-white p-5">
            <div>
                <p className="text-[18px] font-semibold text-[#111827]">{card.title}</p>
                <p className="mt-1 text-sm text-[#6b7280]">{card.description}</p>
            </div>

            <TextInput
                label="Card Text"
                defaultValue={card.defaultText}
                placeholder="Card text"
            />

            <UploadCard
                title={card.uploadTitle}
                description={card.uploadDescription}
                compact
            />
        </div>
    );
}

function CollectionToolbar({
    title,
    count,
}: {
    title: string;
    count: string;
}) {
    return (
        <div className="rounded-[24px] border border-[#ece3de] bg-white p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <h3 className="text-[18px] font-semibold text-[#111827]">{title}</h3>
                    <p className="mt-1 text-sm text-[#6b7280]">
                        Manage item order, thumbnails, and collection visibility.
                    </p>
                </div>

                <div className="inline-flex w-fit items-center rounded-full bg-[#F8ECEC] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#C1121F]">
                    {count}
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row">
                <div className="relative flex-1">
                    <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                        type="text"
                        placeholder="Search product or image..."
                        className="h-12 w-full rounded-full border border-[#e8ddd8] bg-[#fcfbfa] pl-11 pr-4 text-sm text-[#111827] outline-none transition focus:border-[#C1121F]/40"
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        className="rounded-full border border-[#e4d7d2] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:border-[#C1121F]/30 hover:text-[#C1121F]"
                    >
                        Sort by Order
                    </button>
                    <button
                        type="button"
                        className="rounded-full border border-[#e4d7d2] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:border-[#C1121F]/30 hover:text-[#C1121F]"
                    >
                        Filter
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-[#C1121F] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                        <FiPlus size={15} />
                        Add Item
                    </button>
                </div>
            </div>
        </div>
    );
}

function CollectionItemCard({ item }: { item: CollectionItem }) {
    return (
        <div className="overflow-hidden rounded-[22px] border border-[#ece3de] bg-white shadow-sm">
            <div className="relative aspect-[4/4.5] bg-[#F1ECEA]">
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b7280] shadow-sm">
                    #{item.id}
                </div>
            </div>

            <div className="p-4">
                <h4 className="line-clamp-2 text-[15px] font-semibold leading-6 text-[#111827]">
                    {item.title}
                </h4>

                <div className="mt-4 flex items-center justify-between">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-[#e4d7d2] bg-white px-3 py-2 text-xs font-medium text-[#374151] transition hover:border-[#C1121F]/30 hover:text-[#C1121F]"
                    >
                        <FiEdit3 size={13} />
                        Edit
                    </button>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-[#f1d1d1] bg-white px-3 py-2 text-xs font-medium text-[#C1121F] transition hover:bg-[#fff6f6]"
                    >
                        <FiTrash2 size={13} />
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

function PreviewPanel() {
    return (
        <div className="space-y-6 2xl:sticky 2xl:top-0">
            <section className="overflow-hidden rounded-[30px] border border-[#eee6e2] bg-[#fcfbfa] shadow-[0_6px_20px_rgba(0,0,0,0.03)]">
                <div className="flex flex-col gap-4 border-b border-[#efe7e3] px-6 py-5 md:px-7 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#A78B8B]">
                            Live Preview
                        </p>
                        <h2 className="mt-2 text-[24px] font-semibold leading-none text-[#111827] md:text-[28px]">
                            Homepage Snapshot
                        </h2>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 self-start rounded-full border border-[#e4d7d2] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] transition hover:border-[#C1121F]/30 hover:text-[#C1121F] lg:self-auto"
                    >
                        Open Preview
                        <FiChevronRight size={15} />
                    </button>
                </div>

                <div className="p-4 md:p-5">
                    <div className="overflow-hidden rounded-[26px] border border-[#eee6e2] bg-[#F7F3F2]">
                        <div className="flex items-center justify-between border-b border-[#ece4e0] px-4 py-3">
                            <div className="flex gap-2">
                                <span className="h-3 w-3 rounded-full bg-[#ddc4c4]" />
                                <span className="h-3 w-3 rounded-full bg-[#ddc4c4]" />
                                <span className="h-3 w-3 rounded-full bg-[#ddc4c4]" />
                            </div>
                            <div className="rounded-full bg-white px-4 py-1 text-[11px] font-medium text-[#94A3B8] shadow-sm">
                                trendywear.com
                            </div>
                        </div>

                        <div className="space-y-4 p-4">
                            <div className="rounded-[22px] bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="h-3 w-28 rounded-full bg-[#E8DEDB]" />
                                    <div className="rounded-full bg-[#F8ECEC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C1121F]">
                                        4 Slides
                                    </div>
                                </div>

                                <div className="grid gap-3 grid-cols-[1.55fr_0.85fr]">
                                    <div className="relative aspect-[16/10] rounded-[20px] bg-[#D9D0CD]">
                                        <div className="absolute bottom-4 left-4 space-y-2">
                                            <div className="h-4 w-40 rounded-full bg-white/70" />
                                            <div className="h-3 w-24 rounded-full bg-white/55" />
                                        </div>
                                    </div>

                                    <div className="grid gap-3">
                                        <div className="aspect-[4/2.15] rounded-[20px] bg-[#D9D0CD]" />
                                        <div className="aspect-[4/2.15] rounded-[20px] bg-[#D9D0CD]" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[22px] bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="h-4 w-32 rounded-full bg-[#E9E0DD]" />
                                    <div className="rounded-full bg-[#F8ECEC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C1121F]">
                                        2 Fixed Cards
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2 rounded-[18px] bg-[#F7F3F2] p-3">
                                        <div className="aspect-[4/2.2] rounded-[14px] bg-[#D9D0CD]" />
                                        <div className="h-3 w-20 rounded-full bg-[#E8DEDB]" />
                                    </div>
                                    <div className="space-y-2 rounded-[18px] bg-[#F7F3F2] p-3">
                                        <div className="aspect-[4/2.2] rounded-[14px] bg-[#D9D0CD]" />
                                        <div className="h-3 w-24 rounded-full bg-[#E8DEDB]" />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[22px] bg-white p-4 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="h-4 w-40 rounded-full bg-[#E9E0DD]" />
                                    <div className="rounded-full bg-[#F8ECEC] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C1121F]">
                                        4 Images
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="aspect-[3/4] rounded-[18px] bg-[#E3DBD8]" />
                                    <div className="aspect-[3/4] rounded-[18px] bg-[#E3DBD8]" />
                                    <div className="aspect-[3/4] rounded-[18px] bg-[#E3DBD8]" />
                                    <div className="aspect-[3/4] rounded-[18px] bg-[#E3DBD8]" />
                                </div>
                            </div>

                            <div className="rounded-[22px] bg-[#C1121F] p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="h-4 w-28 rounded-full bg-white/70" />
                                    <div className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
                                        30+ Items
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="aspect-[3/4] rounded-[18px] bg-white/20" />
                                    <div className="aspect-[3/4] rounded-[18px] bg-white/20" />
                                    <div className="aspect-[3/4] rounded-[18px] bg-white/20" />
                                </div>
                            </div>

                            <div className="rounded-[22px] bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="h-4 w-28 rounded-full bg-[#DDE4EA]" />
                                    <div className="rounded-full bg-[#EEF3F7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5b7288]">
                                        18 Items
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="aspect-[3/4] rounded-[18px] bg-[#E3DBD8]" />
                                    <div className="aspect-[3/4] rounded-[18px] bg-[#E3DBD8]" />
                                    <div className="aspect-[3/4] rounded-[18px] bg-[#E3DBD8]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function AdminHomepagePage() {
    const [showSidebar, setShowSidebar] = useState(false);
    const [openSlides, setOpenSlides] = useState<number[]>([1]);

    const toggleSlide = (slideId: number) => {
        setOpenSlides((prev) =>
            prev.includes(slideId)
                ? prev.filter((id) => id !== slideId)
                : [...prev, slideId]
        );
    };

    return (
        <div className="space-y-8">
            <div className="rounded-[30px] border border-[#eee6e2] bg-[#fcfbfa] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.03)] md:p-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[#F8ECEC] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#C1121F]">
                            <FiMonitor size={14} />
                            Homepage Editor
                        </div>

                        <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] text-[#111827] md:text-[40px] 2xl:text-[44px]">
                            Customize TrendyWear Homepage
                        </h1>

                        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#6b7280] md:text-[16px]">
                            Edit the brand, hero carousel slides, hero side cards, seasonal
                            content, and large Women and Men collections in a layout that fits
                            your admin theme.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setShowSidebar((prev) => !prev)}
                            className="inline-flex items-center gap-2 rounded-full border border-[#e4d7d2] bg-white px-5 py-3 text-sm font-medium text-[#374151] transition hover:border-[#C1121F]/30 hover:text-[#C1121F]"
                        >
                            {showSidebar ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            {showSidebar ? "Hide Preview Panel" : "Show Preview Panel"}
                        </button>

                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-[#C1121F] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            <FiSave size={16} />
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`grid gap-8 ${showSidebar
                        ? "2xl:grid-cols-[minmax(0,1.55fr)_minmax(420px,0.95fr)]"
                        : "grid-cols-1"
                    }`}
            >
                <div className="min-w-0 space-y-8">
                    <SectionCard
                        icon={<FiType size={22} />}
                        title="Brand / Header"
                        subtitle="Update the main store name and top navigation labels."
                    >
                        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                            <TextInput
                                label="Brand Title"
                                defaultValue="TRENDY WEAR"
                                placeholder="TRENDY WEAR"
                            />
                            <TextInput
                                label="Announcement / Small Header"
                                defaultValue="New arrivals this week"
                                placeholder="New arrivals this week"
                            />
                            <TextInput
                                label="Navigation Label 1"
                                defaultValue="Products"
                                placeholder="Products"
                            />
                            <TextInput
                                label="Navigation Label 2"
                                defaultValue="New In"
                                placeholder="New In"
                            />
                            <TextInput
                                label="Navigation Label 3"
                                defaultValue="Sales"
                                placeholder="Sales"
                            />
                            <TextInput
                                label="Header CTA Label"
                                defaultValue="Shop Now"
                                placeholder="Shop Now"
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<FiLayout size={22} />}
                        title="Hero Carousel"
                        subtitle="Manage the 4 rotating homepage slides and their images."
                        badge={`${heroSlides.length} Slides`}
                    >
                        <div className="space-y-4">
                            {heroSlides.map((slide) => (
                                <SlideEditor
                                    key={slide.id}
                                    slide={slide}
                                    isOpen={openSlides.includes(slide.id)}
                                    onToggle={() => toggleSlide(slide.id)}
                                />
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<FiImage size={22} />}
                        title="Hero Side Cards"
                        subtitle="Manage the two fixed right-side cards beside the hero carousel."
                        badge={`${heroSideCards.length} Fixed Cards`}
                    >
                        <div className="grid gap-6 xl:grid-cols-2">
                            {heroSideCards.map((card) => (
                                <HeroSideCardEditor key={card.id} card={card} />
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<FiTag size={22} />}
                        title="Collection for All Seasons"
                        subtitle="Edit the centered heading, paragraph, and supporting images."
                    >
                        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                            <div className="space-y-5">
                                <TextInput
                                    label="Section Title"
                                    defaultValue="Collection for all seasons."
                                    placeholder="Collection for all seasons."
                                />
                                <TextArea
                                    label="Section Description"
                                    defaultValue="A versatile foundation for every day. Our Collection for All Seasons blends minimalist design with year-round durability, offering timeless essentials engineered to transition effortlessly through any climate."
                                    placeholder="Section description"
                                    rows={7}
                                />
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {[1, 2, 3, 4].map((imageNumber) => (
                                    <UploadCard
                                        key={imageNumber}
                                        title={`Season Image ${imageNumber}`}
                                        description="Supporting visual for this section."
                                        compact
                                    />
                                ))}
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<FiImage size={22} />}
                        title="Women Section"
                        subtitle="Manage a large homepage collection with ordering and thumbnails."
                        badge="30+ Items"
                    >
                        <div className="space-y-6">
                            <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
                                <TextInput
                                    label="Section Title"
                                    defaultValue="Women's Wear"
                                    placeholder="Women's Wear"
                                />
                                <TextInput
                                    label="Section Subtitle"
                                    defaultValue="Made for her."
                                    placeholder="Made for her."
                                />
                                <TextInput
                                    label="Button Text"
                                    defaultValue="View All Product"
                                    placeholder="View All Product"
                                />
                                <TextInput
                                    label="Background Color"
                                    defaultValue="#C1121F"
                                    placeholder="#C1121F"
                                />
                            </div>

                            <CollectionToolbar
                                title="Women Collection Items"
                                count="30+ Items"
                            />

                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {womenItems.map((item) => (
                                    <CollectionItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        icon={<FiImage size={22} />}
                        title="Men Section"
                        subtitle="Manage the men's homepage collection and product ordering."
                        badge="18 Items"
                    >
                        <div className="space-y-6">
                            <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
                                <TextInput
                                    label="Section Title"
                                    defaultValue="Men's Wear"
                                    placeholder="Men's Wear"
                                />
                                <TextInput
                                    label="Section Subtitle"
                                    defaultValue="Made for him."
                                    placeholder="Made for him."
                                />
                                <TextInput
                                    label="Button Text"
                                    defaultValue="View All Product"
                                    placeholder="View All Product"
                                />
                                <TextInput
                                    label="Background Accent"
                                    defaultValue="#EEF3F7"
                                    placeholder="#EEF3F7"
                                />
                            </div>

                            <CollectionToolbar title="Men Collection Items" count="18 Items" />

                            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {menItems.map((item) => (
                                    <CollectionItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        </div>
                    </SectionCard>
                </div>

                {showSidebar && (
                    <div className="min-w-0">
                        <PreviewPanel />
                    </div>
                )}
            </div>
        </div>
    );
}