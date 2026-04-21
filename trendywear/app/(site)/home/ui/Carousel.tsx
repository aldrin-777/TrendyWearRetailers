"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MdArrowOutward } from "react-icons/md";

interface Slide {
  title: string;
  description: string;
  href: string;
  buttonText?: string;
  image: string;   
}

interface CarouselProps {
  slides: Slide[];
  interval?: number; // optional
}

export default function Carousel({ slides, interval = 5000 }: CarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative rounded-2xl overflow-hidden h-full w-full">
      {slides.map((slide, idx) => ( 
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          >
          {/* IMAGE */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className="object-cover"
            priority
        />
        {/* DARK OVERLAY */}
        <div className="absolute inset-0 bg-black/40"/>

          <div className="absolute bottom-18 sm:bottom-12 left-6 sm:left-10 sm:space-y-4 pr-6 text-white z-20">
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight">{slide.title}</h2>
            <p className="text-gray-300 text-sm max-w-md">{slide.description}</p>
            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 text-white border-b border-white pb-1 hover:text-gray-300 hover:border-gray-300 transition mt-2"
            >
              <span className="font-medium tracking-wide">{slide.buttonText ?? "View Collection"}</span>
              <MdArrowOutward />
            </Link>
          </div>
        </div>
      ))}

      {/* Carousel Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            title="Slider"
            key={idx}
            className={`w-2 h-2 rounded-full transition ${
              idx === current ? "bg-white" : "bg-white/50"
            }`}
            onClick={() => setCurrent(idx)}
          ></button>
        ))}
      </div>
    </div>
  );
}
