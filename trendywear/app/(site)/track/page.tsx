"use client";

import { useState } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import Image from "next/image";
import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";

type TrackingEvent = {
    date: string;
    time: string;
    status: string;
    active?: boolean;
};

type SuggestedProduct = {
    id: number;
    name: string;
    images: string[];
    oldPrice?: number;
    price: number;
    rating: number;
    reviews: number;
    is_liked: boolean;
    colors: string[];
};

type ProgressStep = {
    label: string;
    completed: boolean;
    current?: boolean;
};

type OrderItem = {
    id: number;
    name: string;
    image: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
};

export default function TrackPage() {
    const [showDetails, setShowDetails] = useState(false);

    const progressSteps: ProgressStep[] = [
        { label: "Ordered", completed: true },
        { label: "Packed", completed: true },
        { label: "Shipped", completed: true, current: true },
        { label: "Delivered", completed: false },
    ];

    const events: TrackingEvent[] = [
        {
            date: "Apr 12",
            time: "05:31",
            status: "Package awaiting pick up",
            active: true,
        },
        {
            date: "Apr 12",
            time: "05:13",
            status: "Package awaiting shipping",
        },
        {
            date: "Apr 11",
            time: "17:37",
            status: "Order awaiting packaging",
        },
        {
            date: "Apr 10",
            time: "21:46",
            status: "Order preparing",
        },
        {
            date: "Apr 10",
            time: "20:50",
            status: "Order confirmed",
        },
    ];

    const orderItems: OrderItem[] = [
        {
            id: 1,
            name: "Classic Wide-Leg Denim",
            image: "/products/p1.jpg",
            color: "Beige",
            size: "M",
            quantity: 1,
            price: 1299,
        },
        {
            id: 2,
            name: "Relaxed Black Polo",
            image: "/products/p2.jpg",
            color: "Black",
            size: "L",
            quantity: 1,
            price: 1399,
        },
    ];

    const suggestedProducts: SuggestedProduct[] = [
        {
            id: 101,
            name: "Classic Wide-Leg Denim",
            images: ["/products/p1.jpg"],
            price: 1299,
            rating: 4.8,
            reviews: 124,
            is_liked: false,
            colors: ["#D8D2C8", "#1F2937"],
        },
        {
            id: 102,
            name: "Relaxed Black Polo",
            images: ["/products/p2.jpg"],
            oldPrice: 1599,
            price: 1399,
            rating: 4.7,
            reviews: 98,
            is_liked: false,
            colors: ["#111827", "#E5E7EB"],
        },
        {
            id: 103,
            name: "Minimal Knit Top",
            images: ["/products/p3.jpg"],
            price: 999,
            rating: 4.6,
            reviews: 86,
            is_liked: false,
            colors: ["#F5E6CC", "#FFFFFF"],
        },
        {
            id: 104,
            name: "Essential Straight Pants",
            images: ["/products/p4.jpg"],
            price: 1499,
            rating: 4.9,
            reviews: 143,
            is_liked: false,
            colors: ["#374151", "#C7B9A5"],
        },
        {
            id: 105,
            name: "Striped Dolman Polo",
            images: ["/products/p5.jpg"],
            price: 1399,
            rating: 4.5,
            reviews: 76,
            is_liked: false,
            colors: ["#F4F1EA", "#E8DFC8"],
        },
    ];

    const previewEvents = events.slice(0, 2);

    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    return (
        <div className="min-h-screen bg-[#F8F9FB]">
            <main className="max-w-[1440px] mx-auto px-10 py-10">
                <Breadcrumb
                    items={[
                        { label: "Home", href: "/" },
                        { label: "Track Order" },
                    ]}
                />

                {/* Header */}
                <section className="mt-3 mb-8">
                    <h1 className="text-4xl font-bold text-[#C1121F] mb-2">
                        Track Order
                    </h1>
                    <p className="text-[15px] text-[#003049]/70">
                        Stay updated with your delivery progress and shipping details.
                    </p>
                </section>

                {/* Progress bar */}
                <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 md:p-8 mb-6">
                    <div className="flex items-center justify-between gap-3 md:gap-6">
                        {progressSteps.map((step, index) => {
                            const showLine = index !== progressSteps.length - 1;

                            return (
                                <div
                                    key={step.label}
                                    className="flex items-center flex-1 min-w-0"
                                >
                                    <div className="flex flex-col items-center min-w-[72px]">
                                        <div
                                            className={[
                                                "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition",
                                                step.completed
                                                    ? "bg-[#C1121F] border-[#C1121F] text-white"
                                                    : step.current
                                                        ? "bg-white border-[#C1121F] text-[#C1121F]"
                                                        : "bg-white border-gray-300 text-gray-400",
                                            ].join(" ")}
                                        >
                                            {step.completed ? <FiCheck className="text-lg" /> : index + 1}
                                        </div>

                                        <p
                                            className={[
                                                "mt-3 text-sm font-medium text-center",
                                                step.completed || step.current
                                                    ? "text-[#003049]"
                                                    : "text-[#003049]/45",
                                            ].join(" ")}
                                        >
                                            {step.label}
                                        </p>
                                    </div>

                                    {showLine && (
                                        <div className="flex-1 h-[2px] mx-3 md:mx-4">
                                            <div
                                                className={[
                                                    "h-full rounded-full",
                                                    step.completed ? "bg-[#C1121F]" : "bg-gray-200",
                                                ].join(" ")}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Shipping Info */}
                <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 md:p-8 mb-8">
                    <div className="mb-6">
                        <p className="text-sm uppercase tracking-[0.14em] text-[#003049]/50 mb-2">
                            Shipping Address
                        </p>
                        <p className="text-[16px] md:text-[18px] font-semibold text-[#003049]">
                            Sinilyasi Street Block 57K Lot 12 Phase 3
                        </p>
                        <p className="text-sm md:text-base text-[#003049]/70">
                            Caloocan City, Metro Manila 1400
                        </p>
                        <p className="text-sm text-[#003049]/60 mt-1">
                            Jonas Cyrus Ponpon · 9171125164
                        </p>
                    </div>

                    <div className="bg-[#EDF6F4] rounded-[22px] p-5 md:p-6 mb-8 border border-[#D6EAE5]">
                        <p className="text-sm text-[#003049]/60 mb-1">Status</p>
                        <p className="text-[24px] md:text-[28px] font-bold text-[#003049]">
                            Shipped
                        </p>
                        <p className="text-[18px] font-semibold text-[#2A9D8F] mt-1">
                            Delivery: 04/16 - 17
                        </p>
                        <p className="text-sm text-[#003049]/60 mt-2">
                            4–5 business days
                        </p>
                    </div>

                    <div className="mb-5">
                        <Timeline events={previewEvents} highlightUntil={0} />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDetails((prev) => !prev)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#003049] hover:text-[#C1121F] transition"
                    >
                        More Logistics Details
                        <FiChevronDown
                            className={`transition-transform duration-300 ${showDetails ? "rotate-180" : ""
                                }`}
                        />
                    </button>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${showDetails ? "max-h-[900px] mt-5" : "max-h-0"
                            }`}
                    >
                        <div className="pt-5 border-t border-gray-100">
                            <Timeline events={events} highlightUntil={0} />
                        </div>
                    </div>
                </section>

                {/* Order Summary */}
                <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 md:p-8 mb-10">
                    {/* Order strip */}
                    <div className="rounded-[22px] bg-[#FAFAFA] border border-gray-200 px-5 py-4 mb-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-[#003049]/45">
                                    Order No.
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#003049]">
                                    TW-2026-0412
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-[#003049]/45">
                                    Payment
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#003049]">
                                    GCash
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-[#003049]/45">
                                    Items
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#003049]">
                                    {totalItems} item{totalItems > 1 ? "s" : ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-[#003049]/45">
                                    Current Status
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#2A9D8F]">
                                    Shipped
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[22px] font-semibold text-[#003049]">
                            Products ({totalItems} items)
                        </h2>

                        <div className="text-right">
                            <p className="text-xs uppercase tracking-[0.14em] text-[#003049]/50">
                                Subtotal
                            </p>
                            <p className="text-lg font-semibold text-[#C1121F]">
                                PHP {subtotal.toLocaleString()}.00
                            </p>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {orderItems.map((item) => (
                            <OrderSummaryItem key={item.id} item={item} />
                        ))}
                    </div>
                </section>

                {/* You might like */}
                <section className="pb-8">
                    <div className="mb-6">
                        <h2 className="text-[28px] font-semibold text-[#003049]">
                            You might like:
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                        {suggestedProducts.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

function Timeline({
    events,
    highlightUntil = 0,
}: {
    events: TrackingEvent[];
    highlightUntil?: number;
}) {
    return (
        <div className="space-y-0">
            {events.map((event, index) => {
                const isHighlighted = index <= highlightUntil;
                const isLast = index === events.length - 1;

                return (
                    <div
                        key={`${event.date}-${event.time}-${index}`}
                        className="flex gap-4"
                    >
                        <div className="w-[68px] shrink-0 pt-0.5 text-right">
                            <p
                                className={`text-sm font-semibold ${isHighlighted ? "text-[#2A9D8F]" : "text-[#003049]/55"
                                    }`}
                            >
                                {event.date}
                            </p>
                            <p className="text-[11px] text-[#003049]/40">{event.time}</p>
                        </div>

                        <div className="relative flex flex-col items-center">
                            <span
                                className={`w-3 h-3 rounded-full border-2 z-10 ${isHighlighted
                                        ? "bg-[#2A9D8F] border-[#2A9D8F]"
                                        : "bg-white border-[#D7D7D7]"
                                    }`}
                            />

                            {!isLast && (
                                <span
                                    className={`w-[2px] h-[54px] mt-1 ${isHighlighted ? "bg-[#2A9D8F]" : "bg-[#E5E5E5]"
                                        }`}
                                />
                            )}
                        </div>

                        <div className="pb-5">
                            <p
                                className={`text-sm md:text-[15px] ${isHighlighted
                                        ? "text-[#003049] font-medium"
                                        : "text-[#003049]/55"
                                    }`}
                            >
                                {event.status}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function OrderSummaryItem({ item }: { item: OrderItem }) {
    return (
        <div className="py-5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-[92px] h-[112px] rounded-[18px] overflow-hidden border border-gray-200 bg-[#F9F9F9] shrink-0">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>

                <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold text-[#003049] line-clamp-2">
                        {item.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#003049]/65">
                        <span>Color: {item.color}</span>
                        <span>Size: {item.size}</span>
                        <span>Qty: {item.quantity}</span>
                    </div>
                </div>
            </div>

            <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-[0.14em] text-[#003049]/45">
                    Item Total
                </p>
                <p className="mt-1 text-[18px] font-semibold text-[#C1121F]">
                    PHP {(item.price * item.quantity).toLocaleString()}.00
                </p>
            </div>
        </div>
    );
}