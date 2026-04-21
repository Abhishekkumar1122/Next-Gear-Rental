'use client';

import { ChevronDown, FileText, CreditCard, Calendar, Plane, Fuel, AlertCircle, Shield, Phone, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

interface FAQ {
  id: string;
  icon: React.ReactNode;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    icon: <FileText className="w-6 h-6" />,
    question: "What documents do I need to book?",
    answer: "Indian residents need a valid driving license (preferably less than 5 years old) and government-issued ID proof (Aadhaar, Passport, etc.). NRIs can use their passport along with an International Driving Permit (IDP). All customers must provide a valid email and phone number for booking confirmation.",
    category: "Documentation"
  },
  {
    id: '2',
    icon: <CreditCard className="w-6 h-6" />,
    question: "Is there a security deposit required?",
    answer: "Yes, a refundable security hold is placed on your card during the rental period. This is typically 10-20% of the total booking amount and is fully refunded within 7 business days after vehicle return, provided there are no damages or violations.",
    category: "Payment"
  },
  {
    id: '3',
    icon: <Calendar className="w-6 h-6" />,
    question: "Can I extend my booking if needed?",
    answer: "Absolutely! You can extend your rental through the Next Gear app or by calling our support team. Extension is subject to vehicle availability at your location. Extensions can be requested up to 24 hours before your current booking ends to ensure we have the vehicle available.",
    category: "Booking"
  },
  {
    id: '4',
    icon: <Plane className="w-6 h-6" />,
    question: "Do you provide airport pickup and drop-off?",
    answer: "Yes, airport pickup is available in all major cities (Bangalore, Mumbai, Delhi, Hyderabad, Chennai, etc.). Select this option during booking and provide your flight details. Our drivers will wait at the designated pickup point with a namecard.",
    category: "Services"
  },
  {
    id: '5',
    icon: <Fuel className="w-6 h-6" />,
    question: "Is fuel included in the rental price?",
    answer: "You receive the vehicle with a full tank of fuel. Upon return, the tank must be full to avoid additional charges. If you return with less fuel, you'll be charged for the fuel refill at market rates plus a service charge.",
    category: "Terms"
  },
  {
    id: '6',
    icon: <AlertCircle className="w-6 h-6" />,
    question: "What happens if my vehicle breaks down?",
    answer: "We provide 24/7 roadside assistance. In case of breakdown, contact our support team immediately. Depending on the severity, we'll arrange a replacement vehicle or recovery service. All recovery and towing charges are covered under our insurance.",
    category: "Support"
  },
  {
    id: '7',
    icon: <Shield className="w-6 h-6" />,
    question: "What insurance coverage is included?",
    answer: "Comprehensive insurance coverage is included for accidental damage. The policy covers third-party liability, passenger protection, and own-damage coverage. There's a minimal deductible of Rs. 2,500 per claim. Additional coverage can be purchased for an extra fee.",
    category: "Insurance"
  },
  {
    id: '8',
    icon: <Phone className="w-6 h-6" />,
    question: "How do I contact customer support?",
    answer: "Our support team is available 24/7 through multiple channels: in-app chat with instant response, phone support at +91-9876-543-210, email at support@nextgear.in, or WhatsApp support. Live agents are typically available within 2 minutes.",
    category: "Support"
  },
];

export default function FaqPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(faqs.map(faq => faq.category))];
  
  const filteredFaqs = selectedCategory === 'All' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute -right-24 top-20 h-64 w-64 rounded-full bg-[var(--brand-red)]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        
        <SiteHeader variant="dark" showBadges />

        <div className="mx-auto w-full max-w-6xl px-6 pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">❓</span>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">frequently asked questions</p>
            </div>
            <h1 className="text-4xl font-semibold md:text-5xl">
              <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">Your Questions Answered</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/75">
              Find answers to all your questions about rentals, payments, policies, and support
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10 md:py-12">
        {/* Category Filter */}
        <div>
          <h3 className="text-sm font-semibold text-white/50 mb-4 uppercase tracking-[0.3em]">Filter by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setExpandedId(null);
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  selectedCategory === category
                    ? 'bg-[var(--brand-red)] text-white border-[var(--brand-red)] shadow-lg shadow-red-500/30'
                    : 'border-white/20 bg-white/5 text-white hover:border-[var(--brand-red)]/60 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-2xl border border-white/15 bg-gradient-to-br from-white/[0.12] to-white/[0.04] overflow-hidden transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20"
            >
              <button
                onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                className="w-full px-6 py-5 flex items-start justify-between hover:bg-white/5 transition-colors duration-300 text-left"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-[var(--brand-red)]/20 text-[var(--brand-red)]">
                    {faq.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-base leading-tight">{faq.question}</h3>
                    <p className="text-xs text-[var(--brand-red)]/80 font-medium mt-2">{faq.category}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--brand-red)] flex-shrink-0 ml-4 transition-transform duration-300 ${
                    expandedId === faq.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Expanded Content */}
              {expandedId === faq.id && (
                <div className="border-t border-white/15 px-6 py-5 bg-white/5 animate-in fade-in duration-300">
                  <p className="text-sm text-white/75 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-8 relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-white/3 p-8 md:p-10 shadow-2xl shadow-red-500/15">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[var(--brand-red)]/[0.08] blur-3xl" aria-hidden="true" />
          <div className="absolute -left-32 -bottom-32 h-80 w-80 rounded-full bg-white/[0.08] blur-3xl" aria-hidden="true" />
          
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3">Still Have Questions?</h2>
            <p className="text-white/70 mb-8">Can't find the answer you're looking for? Our support team is available 24/7 to help you.</p>
            
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-4 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1">
                <Phone className="w-6 h-6 text-[var(--brand-red)] mx-auto mb-3" />
                <h4 className="font-semibold text-white mb-1">Call Support</h4>
                <a href="tel:+919876543210" className="text-sm text-[var(--brand-red)]/90 hover:text-[var(--brand-red)] transition-colors">
                  +91-9876-543-210
                </a>
              </div>
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-4 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1">
                <Mail className="w-6 h-6 text-[var(--brand-red)] mx-auto mb-3" />
                <h4 className="font-semibold text-white mb-1">Email Support</h4>
                <a href="mailto:support@nextgear.in" className="text-sm text-[var(--brand-red)]/90 hover:text-[var(--brand-red)] transition-colors">
                  support@nextgear.in
                </a>
              </div>
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] to-white/[0.04] p-4 transition-all duration-300 hover:border-[var(--brand-red)]/60 hover:bg-gradient-to-br hover:from-white/[0.15] hover:to-[var(--brand-red)]/[0.08] hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-1">
                <MessageCircle className="w-6 h-6 text-[var(--brand-red)] mx-auto mb-3" />
                <h4 className="font-semibold text-white mb-1">Live Chat</h4>
                <p className="text-sm text-[var(--brand-red)]/90">
                  In-app support
                </p>
              </div>
            </div>

            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-red)]/90 text-white rounded-full font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-1 border border-[var(--brand-red)]/50"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

