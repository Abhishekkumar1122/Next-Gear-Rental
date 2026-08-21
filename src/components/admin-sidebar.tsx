"use client";

import { useState } from "react";
import Link from "next/link";

type SidebarLink = {
  id: string;
  label: string;
  href: string;
  icon: string;
};

type AdminSidebarProps = {
  activeSection: string;
  email: string;
  userName: string;
  links: SidebarLink[];
};

export function AdminSidebar({ activeSection, email, userName, links }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group links into categories
  const categories = [
    {
      title: "General Ledger",
      items: links.filter(link => ["overview", "approvals", "finance", "deliveries", "bookings", "support", "ops"].includes(link.id))
    },
    {
      title: "Fleet & Governance",
      items: links.filter(link => ["vehicles", "vendor-applications", "users-fleet", "contact-requests", "careers-jobs"].includes(link.id))
    },
    {
      title: "Config & Operations",
      items: links.filter(link => ["footer", "alerts", "mail-inbox", "email-templates", "webhooks"].includes(link.id))
    }
  ];

  return (
    <>
      {/* Mobile top header bar for menu toggle button */}
      <div className="w-full bg-[#090909] border-b border-white/5 px-4 py-3 flex items-center justify-between md:hidden z-50">
        <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition group">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-red)] animate-ping group-hover:bg-red-400" />
          <span className="font-display text-xs font-black uppercase tracking-wider text-white group-hover:text-[var(--brand-red-soft)] transition-colors">Next Gear Console</span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition active:scale-95 cursor-pointer text-xs"
        >
          {isOpen ? "✕" : "☰ MENU"}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar navigation container */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 w-60 bg-[#090909] border-r border-white/5 flex flex-col h-screen z-40 transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header Brand Logo */}
        <Link href="/" className="block p-5 border-b border-white/5 flex flex-col gap-0.5 cursor-pointer hover:bg-white/[0.01] transition-colors group">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-red)] shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-transform group-hover:scale-110" />
            <span className="font-display text-xs font-black uppercase tracking-widest text-white group-hover:text-[var(--brand-red-soft)] transition-colors">Next Gear</span>
          </div>
          <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-extrabold">Control Center</span>
        </Link>

        {/* Sidebar Navigation Links List */}
        <div className="flex-1 overflow-y-auto py-4 md:py-6 px-3 space-y-4 md:space-y-6 no-scrollbar">
          {categories.map((category) => (
            <div key={category.title} className="space-y-2">
              <h4 className="text-[8px] uppercase tracking-[0.25em] text-white/30 font-black px-3.5">
                {category.title}
              </h4>
              <nav className="space-y-1">
                {category.items.map((link) => {
                  const isActive = activeSection === link.id;
                  return (
                    <div key={link.id} className="px-1">
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 md:py-3 rounded-xl transition-all duration-200 text-[10px] font-black uppercase tracking-wider border ${
                          isActive
                            ? "bg-[var(--brand-red)] text-white border-red-500/20 shadow-lg shadow-red-600/15"
                            : "text-white/50 hover:text-white hover:bg-white/[0.02] border-transparent"
                        }`}
                      >
                        <span className="text-sm select-none">{link.icon}</span>
                        <span>{link.label}</span>
                      </Link>
                    </div>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Details */}
        <div className="p-4 border-t border-white/5 bg-[#070707]">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center text-[10px] font-black text-red-400 select-none">
              A
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[9px] font-bold text-white/90 truncate">{userName}</p>
              <p className="text-[8px] text-white/40 truncate">{email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
