"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

// Data slides untuk carousel
const slides = [
  {
    id: 1,
    badge: "Koleksi Eksklusif",
    title: "Motif Gonggong Khas Kepulauan Riau",
    description: "Sentuhan klasik dalam anyaman modern. Temukan batik terbaik dengan sentuhan warna hangat, kain premium, dan detail khas yang memancarkan kemewahan.",
    backgroundImage: "/barelang.jpg",
    productImage: "/wanita4.jpg",
    collection: "Capsule Collection",
    productName: "Batik Gonggong 2025",
    productInfo: "Limited edition · 150 pcs",
    gradient: "from-[#7b4d2a] via-[#8f5c33] to-[#d2a87a]",
  },
  {
    id: 2,
    badge: "Best Seller",
    title: "Batik Cindur Premium Collection",
    description: "Koleksi batik premium dengan motif tradisional Batam yang elegan. Cocok untuk acara formal maupun kasual dengan kualitas terbaik.",
    backgroundImage: "/barelang.jpg",
    productImage: "/wanita1.jpg",
    collection: "Premium Series",
    productName: "Blus Pesona Cindur",
    productInfo: "Best seller · 200+ terjual",
    gradient: "from-[#5c3316] via-[#7b4d2a] to-[#c08a3e]",
  },
  {
    id: 3,
    badge: "New Arrival",
    title: "Kemeja Batik Modern Pria",
    description: "Tampil stylish dengan kemeja batik modern. Desain kontemporer dengan sentuhan tradisional yang sempurna untuk pria modern.",
    backgroundImage: "/barelang.jpg",
    productImage: "/pria1.jpg",
    collection: "Men's Collection",
    productName: "Kemeja Batik Lengan Pendek",
    productInfo: "New arrival · Stok terbatas",
    gradient: "from-[#8f5c33] via-[#7b4d2a] to-[#5c3316]",
  },
  {
    id: 4,
    badge: "Promo Spesial",
    title: "Dress Batik Elegan Wanita",
    description: "Koleksi dress batik untuk wanita modern. Desain anggun dan nyaman dipakai sepanjang hari dengan bahan berkualitas tinggi.",
    backgroundImage: "/barelang.jpg",
    productImage: "/wanita2.jpg",
    collection: "Women's Collection",
    productName: "Dress Batik Seruni",
    productInfo: "Promo 20% · Hingga akhir bulan",
    gradient: "from-[#c08a3e] via-[#8f5c33] to-[#7b4d2a]",
  },
];

export default function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Navigation functions
  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const slide = slides[currentSlide];

  return (
    <section 
      className={`relative overflow-hidden rounded-[32px] border border-[#e3d6c5] bg-gradient-to-br ${slide.gradient} py-10 md:py-16 mb-8 shadow-[0_30px_80px_-40px_rgba(82,46,16,0.7)] transition-all duration-700`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={slide.backgroundImage}
          alt="Banner Batik Batam"
          fill
          className="object-cover opacity-35 mix-blend-luminosity transition-opacity duration-700"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),rgba(123,77,42,0.4))]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/10" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10 px-6 md:px-16 lg:px-20">
        <div className="max-w-xl text-center lg:text-left">
          <span 
            key={`badge-${slide.id}`}
            className="floating-badge bg-white/30 border-white/40 text-white/90 animate-fadeIn"
          >
            {slide.badge}
          </span>
          <h2 
            key={`title-${slide.id}`}
            className="mt-4 text-2xl md:text-3xl lg:text-4xl font-semibold text-white leading-tight drop-shadow-lg animate-slideUp"
          >
            {slide.title}
          </h2>
          <p 
            key={`desc-${slide.id}`}
            className="mt-4 text-white/90 text-sm md:text-base leading-relaxed animate-slideUp animation-delay-100"
          >
            {slide.description}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 animate-slideUp animation-delay-200">
            <Link
              href="/kategori"
              className="luxury-button primary-button text-sm sm:text-base"
            >
              Jelajahi Koleksi
              <ChevronRight size={18} />
            </Link>
            <Link
              href="/cari"
              className="luxury-button text-sm sm:text-base"
            >
              Lihat katalog lengkap
            </Link>
          </div>
        </div>

        <div className="relative w-full max-w-sm">
          <div className="absolute inset-0 bg-white/15 blur-3xl rounded-full" />
          <div 
            key={`product-${slide.id}`}
            className="relative overflow-hidden rounded-[26px] border border-white/40 bg-white/20 backdrop-blur-2xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.65)] p-5 animate-scaleIn"
          >
            <Image
              src={slide.productImage}
              alt={slide.productName}
              width={420}
              height={520}
              className="w-full h-auto rounded-2xl object-cover shadow-lg transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-white/70">
              <p className="text-xs uppercase tracking-[0.35em] text-[#c08a3e] font-semibold">
                {slide.collection}
              </p>
              <p className="text-base font-semibold text-[#5c3316]">
                {slide.productName}
              </p>
              <span className="text-xs text-[#5c3316]/70">{slide.productInfo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {/* Previous Button */}
        <button
          onClick={prevSlide}
          className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-all duration-300 hover:scale-110 group"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Slide Indicators/Dots */}
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide 
                  ? 'w-8 h-2 bg-white' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={nextSlide}
          className="p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/40 transition-all duration-300 hover:scale-110 group"
          aria-label="Next slide"
        >
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 rounded-b-[32px] overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-white/40 to-white/70 transition-all duration-500 ease-out"
          style={{ 
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
          }}
        />
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out forwards;
        }
        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }
      `}</style>
    </section>
  );
}

