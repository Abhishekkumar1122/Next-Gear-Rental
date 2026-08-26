'use client';

import { useState, useMemo } from "react";
import { 
  ChevronDown, 
  Search, 
  FileText, 
  CreditCard, 
  Calendar, 
  Plane, 
  Fuel, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Car, 
  HelpCircle,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

interface FAQ {
  id: string;
  icon: string;
  category: "Documentation" | "Payment" | "Booking" | "Airport & Delivery" | "Fuel & Tolls" | "Insurance & Safety" | "Support";
  question: string;
  answer: string;
  popular?: boolean;
}

const faqs: FAQ[] = [
  {
    id: "1",
    icon: "🪪",
    category: "Documentation",
    popular: true,
    question: "What documents do I need to rent a bike or car in India?",
    answer: "For Indian Citizens: A valid original Driving License (DL) and Government ID proof (Aadhaar Card, Passport, or Voter ID). For NRIs & Foreigners: Original Passport with a valid Indian Visa stamp and an International Driving Permit (IDP) or home country DL. All KYC verification is completed in 30 seconds via our Google Gemini AI Vision Scanner."
  },
  {
    id: "2",
    icon: "💳",
    category: "Payment",
    popular: true,
    question: "Is there a security deposit, and when is it refunded?",
    answer: "Next Gear offers 100% Zero Security Deposit on verified Indian & NRI customer profiles! For certain high-end luxury vehicles (e.g. Mahindra Thar 4x4, BMW, Fortuner), a nominal refundable security hold (₹2,000 - ₹5,000) is placed and auto-credited back to your source account within 24-48 hours after vehicle return."
  },
  {
    id: "3",
    icon: "📅",
    category: "Booking",
    popular: true,
    question: "How do I extend my booking if my trip gets delayed?",
    answer: "You can extend your ongoing rental directly with 1-click from your Customer Dashboard or by contacting our 24/7 Concierge Desk. Extensions are granted at standard hourly/daily rates, provided the vehicle is not pre-reserved by another rider for the next slot."
  },
  {
    id: "4",
    icon: "✈️",
    category: "Airport & Delivery",
    popular: true,
    question: "Do you offer airport terminal pickup and doorstep delivery?",
    answer: "Yes! We operate dedicated Airport Fast-Track counters across Delhi IGI, Mumbai CSMIA, Bengaluru KIA, Goa Dabolim/MOPA, Hyderabad, Chandigarh, and 120+ hubs. Our chauffeur or representative hands over the cleaned, sanitized vehicle right at the Arrival Exit gate."
  },
  {
    id: "5",
    icon: "⛽",
    category: "Fuel & Tolls",
    question: "How does the fuel policy and FASTag toll payments work?",
    answer: "We follow a Fair Fuel Policy (Tank-to-Tank / Level-to-Level). You receive the vehicle with fuel and simply return it with the same level. All Next Gear vehicles come pre-equipped with an active FASTag so you can breeze through national highway toll plazas without stopping (toll charges are auto-reconciled at checkout)."
  },
  {
    id: "6",
    icon: "🛡️",
    category: "Insurance & Safety",
    popular: true,
    question: "What insurance coverage and roadside assistance is included?",
    answer: "Every rental includes Comprehensive Zero-Depreciation Insurance covering third-party liability and accidental damage. You also get free 24x7 Roadside Assistance (RSA) across all Indian state and national highways covering flat tires, battery jumpstarts, key lockout, and emergency towing."
  },
  {
    id: "7",
    icon: "🔄",
    category: "Booking",
    question: "What is the cancellation and refund policy?",
    answer: "We offer 100% Full Refund if cancelled at least 24 hours before your scheduled pickup time. Cancellations between 6 to 24 hours are eligible for an 80% refund or full credit vouchers with 1-year validity."
  },
  {
    id: "8",
    icon: "🏍️",
    category: "Documentation",
    question: "Can I drive across different states (inter-state travel)?",
    answer: "Yes! All Next Gear rental cars and bikes possess All-India Commercial Tourist Permits (Black Plate with Yellow Lettering). You are legally permitted to travel across all Indian state borders without paying commercial permit entry fines."
  },
  {
    id: "9",
    icon: "⚡",
    category: "Support",
    question: "How fast is the vehicle handover process?",
    answer: "Thanks to our paperless digital onboarding, the entire handover takes less than 3 minutes. Show your Booking QR Code to our Hub Executive, do a 360° photo inspection on your phone, collect the key, and drive away!"
  },
  {
    id: "10",
    icon: "🌍",
    category: "Airport & Delivery",
    question: "Do you have special privileges for NRIs and tourists?",
    answer: "Yes! Our NRI Rentals Program includes English-speaking airport coordinators, international payment acceptance (Visa, Mastercard, Amex, PayPal), and zero local Indian address requirement."
  }
];

const CATEGORIES = [
  "All",
  "Documentation",
  "Payment",
  "Booking",
  "Airport & Delivery",
  "Fuel & Tolls",
  "Insurance & Safety",
  "Support",
] as const;

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>("1");

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#080808] text-white selection:bg-red-600 selection:text-white flex flex-col justify-between relative overflow-x-clip">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-[5%] left-[-5%] h-[400px] w-[400px] rounded-full bg-red-600/15 blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[-5%] h-[400px] w-[400px] rounded-full bg-rose-600/10 blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[20%] h-[350px] w-[350px] rounded-full bg-amber-600/10 blur-[140px] pointer-events-none z-0" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-50">
        <SiteHeader variant="dark" showBadges />
      </div>

      {/* Main Container */}
      <main className="relative z-10 mx-auto w-full max-w-5xl px-3.5 py-6 sm:px-6 md:px-8 md:py-12 flex-grow space-y-6 sm:space-y-8">
        
        {/* Futuristic Hero Banner */}
        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-br from-neutral-900/90 via-black to-red-950/30 p-4 sm:p-10 shadow-2xl shadow-red-600/10">
          {/* Laser Sweep */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-laser-sweep" />

          <div className="relative z-10 max-w-2xl space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-950/60 px-3 py-0.5 sm:px-3.5 sm:py-1 text-[10px] sm:text-xs font-bold text-red-300 shadow-md shadow-red-600/20">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-pulse" />
              <span>Next Gear Help & Knowledge Center</span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-wider text-white leading-tight">
              Frequently Asked <span className="gradient-text-brand">Questions</span>
            </h1>

            <p className="text-xs sm:text-base text-white/70 leading-relaxed">
              Quick answers about documentation, security deposits, doorstep airport drops, fuel guidelines, and 24x7 roadside assistance.
            </p>
          </div>

          {/* Interactive Live Search Bar */}
          <div className="mt-4 sm:mt-6 relative max-w-2xl">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-red-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any question, keyword, or policy (e.g. deposit, aadhaar, fuel, airport)..."
                className="w-full rounded-xl sm:rounded-2xl border border-white/15 bg-black/60 pl-10 pr-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-white placeholder-white/40 backdrop-blur-md transition-all duration-300 focus:border-red-500 focus:bg-black/80 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:shadow-[0_0_25px_rgba(239,68,68,0.2)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 hover:text-white px-2 py-0.5 rounded bg-white/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Category Filter Pills (Scrollable on Mobile, Wrap on Desktop) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white/60">
            <span className="uppercase tracking-wider text-[10px] sm:text-xs">Browse by Topic</span>
            <span className="font-mono text-[10px] text-emerald-400">{filteredFaqs.length} FAQs Found</span>
          </div>

          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar flex-nowrap sm:flex-wrap">
            {CATEGORIES.map((cat) => {
              const count = cat === "All" ? faqs.length : faqs.filter((f) => f.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setExpandedId(null);
                  }}
                  className={`shrink-0 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 scale-[1.02] border border-red-400/40"
                      : "bg-white/[0.04] text-white/70 border border-white/10 hover:border-white/20 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? "bg-white/20 text-white" : "bg-white/5 text-white/50"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQs Accordion Grid */}
        <div className="space-y-2.5 sm:space-y-3.5">
          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-white/30 mx-auto" />
              <h3 className="text-sm font-bold text-white">No matching questions found</h3>
              <p className="text-xs text-white/50">Try searching for different keywords or clear your filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-2 text-xs font-bold text-red-400 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-red-500/50 bg-gradient-to-br from-neutral-900 via-black to-red-950/20 shadow-xl shadow-red-600/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isOpen ? null : faq.id)}
                    className="w-full p-3.5 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base sm:text-xl shrink-0 p-1.5 rounded-lg bg-white/5 border border-white/10">
                        {faq.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-md">
                            {faq.category}
                          </span>
                          {faq.popular && (
                            <span className="text-[9px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-amber-400 fill-current" /> Popular
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs sm:text-sm md:text-base font-bold text-white leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                    </div>

                    <div className={`p-1.5 sm:p-2 rounded-full border border-white/10 bg-white/5 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 bg-red-600 text-white border-red-500" : "text-white/60"}`}>
                      <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </button>

                  {/* Expandable Body */}
                  {isOpen && (
                    <div className="px-3.5 pb-4 sm:px-5 sm:pb-5 pt-1 border-t border-white/5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <p className="text-xs sm:text-sm text-white/80 leading-relaxed pl-0 sm:pl-12">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 24/7 Live Support Concierge Banner */}
        <section className="rounded-2xl sm:rounded-3xl border border-white/15 bg-gradient-to-br from-neutral-900 via-black to-neutral-950 p-4 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-wider text-red-400 font-bold bg-red-950/40 border border-red-500/30 px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Need Instant Help?</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wide">
                Still Have a Question?
              </h2>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Our support desk is active 24 hours a day, 7 days a week. Connect via WhatsApp chat, phone helpline, or submit a message.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 shrink-0">
              <a
                href="https://api.whatsapp.com/send?phone=919523765172&text=Hello%20Next%20Gear%20Support%2C%20I%20have%20a%20question%20regarding%20rentals."
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Chat</span>
              </a>

              <Link
                href="/contact"
                className="flex-1 sm:flex-initial rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Contact Desk</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
