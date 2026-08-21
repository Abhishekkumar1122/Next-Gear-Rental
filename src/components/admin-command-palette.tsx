"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

type CommandItem = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
};

export function AdminCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Command database
  const commands: CommandItem[] = [
    // Pages / Sections
    {
      id: "nav-overview",
      category: "Navigation",
      title: "Go to Overview Dashboard",
      subtitle: "View main analytics, KPIs, and charts",
      icon: "📊",
      action: () => { router.push("/dashboard/admin?section=overview"); setIsOpen(false); }
    },
    {
      id: "nav-approvals",
      category: "Navigation",
      title: "Go to KYC & Vendor Approvals",
      subtitle: "Verify pending registrations and documents",
      icon: "✅",
      action: () => { router.push("/dashboard/admin?section=approvals"); setIsOpen(false); }
    },
    {
      id: "nav-payments",
      category: "Navigation",
      title: "Go to Finance & Payments Ledger",
      subtitle: "Audit transaction logs and payouts",
      icon: "💰",
      action: () => { router.push("/dashboard/admin?section=finance"); setIsOpen(false); }
    },
    {
      id: "nav-deliveries",
      category: "Navigation",
      title: "Go to Deliveries Dispatch",
      subtitle: "Track order shipping and pickups",
      icon: "🚚",
      action: () => { router.push("/dashboard/admin?section=deliveries"); setIsOpen(false); }
    },
    {
      id: "nav-bookings",
      category: "Navigation",
      title: "Go to Bookings Queue",
      subtitle: "View all reservation records",
      icon: "📅",
      action: () => { router.push("/dashboard/admin?section=bookings"); setIsOpen(false); }
    },
    {
      id: "nav-support",
      category: "Navigation",
      title: "Go to Helpdesk & Tickets",
      subtitle: "Interact with users and reply to queries",
      icon: "🎫",
      action: () => { router.push("/dashboard/admin?section=support"); setIsOpen(false); }
    },
    {
      id: "nav-ops",
      category: "Navigation",
      title: "Go to System Operations",
      subtitle: "Check database logs and server diagnostics",
      icon: "⚙️",
      action: () => { router.push("/dashboard/admin?section=ops"); setIsOpen(false); }
    },
    {
      id: "nav-vehicles",
      category: "Navigation",
      title: "Go to Fleet Registry",
      subtitle: "Manage rental inventory and vehicle statuses",
      icon: "🏍️",
      action: () => { router.push("/dashboard/admin?section=vehicles"); setIsOpen(false); }
    },

    // Quick Theme Changes
    {
      id: "theme-crimson",
      category: "Theme Switcher",
      title: "Switch to Crimson Rage Theme",
      subtitle: "Saturated Ferrari Racing Red",
      icon: "🔴",
      action: () => { triggerThemeChange("crimson"); }
    },
    {
      id: "theme-emerald",
      category: "Theme Switcher",
      title: "Switch to Emerald Pulse Theme",
      subtitle: "Glowing Mint Green Analytics",
      icon: "🟢",
      action: () => { triggerThemeChange("emerald"); }
    },
    {
      id: "theme-cyberpunk",
      category: "Theme Switcher",
      title: "Switch to Cyberpunk Pink Theme",
      subtitle: "Vibrant Fuchsia & Onyx",
      icon: "💖",
      action: () => { triggerThemeChange("cyberpunk"); }
    },
    {
      id: "theme-vesper",
      category: "Theme Switcher",
      title: "Switch to Vesper Blue Theme",
      subtitle: "Stripe-style Electric Blue",
      icon: "🔵",
      action: () => { triggerThemeChange("vesper"); }
    },

    // Administrative Actions
    {
      id: "action-stripe",
      category: "Diagnostics Simulator",
      title: "Simulate Stripe Webhook Trigger",
      subtitle: "Simulate an incoming Stripe payment success callback",
      icon: "⚡",
      action: () => { simulateWebhook("STRIPE"); }
    },
    {
      id: "action-razorpay",
      category: "Diagnostics Simulator",
      title: "Simulate Razorpay Webhook Trigger",
      subtitle: "Simulate an incoming Razorpay payment success callback",
      icon: "⚡",
      action: () => { simulateWebhook("RAZORPAY"); }
    }
  ];

  const triggerThemeChange = (themeId: string) => {
    const selector = document.querySelector(`button[title*="${themeId === 'crimson' ? 'Crimson' : themeId === 'emerald' ? 'Emerald' : themeId === 'cyberpunk' ? 'Cyberpunk' : 'Vesper'}"]`) as HTMLButtonElement | null;
    if (selector) {
      selector.click();
    }
    setIsOpen(false);
  };

  const simulateWebhook = async (provider: string) => {
    try {
      const response = await fetch("/api/admin/webhooks/requeue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, eventType: "payment.success" })
      });
      if (response.ok) {
        alert(`Successfully triggered simulated incoming ${provider} webhook payload! Check Operations webhooks feed.`);
      }
    } catch {
      alert("Failed to simulate webhook action.");
    }
    setIsOpen(false);
  };

  // Filter commands
  const filteredCommands = commands.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  // Shortcut key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Set focus on input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSearch("");
    }
  }, [isOpen]);

  // Adjust scroll position of list when selection changes
  useEffect(() => {
    if (!listRef.current) return;
    const selectedElement = listRef.current.children[selectedIndex] as HTMLElement | null;
    if (!selectedElement) return;

    const listHeight = listRef.current.clientHeight;
    const itemTop = selectedElement.offsetTop;
    const itemHeight = selectedElement.clientHeight;

    if (itemTop + itemHeight > listRef.current.scrollTop + listHeight) {
      listRef.current.scrollTop = itemTop + itemHeight - listHeight;
    } else if (itemTop < listRef.current.scrollTop) {
      listRef.current.scrollTop = itemTop;
    }
  }, [selectedIndex]);

  // Key navigation logic
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) target.action();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/75 backdrop-blur-sm select-none">
      {/* Backdrop closer click */}
      <div className="absolute inset-0 z-0" onClick={() => setIsOpen(false)} />

      {/* Modal Card */}
      <div className="w-full max-w-xl bg-[#090909] border border-white/5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 flex flex-col max-h-[480px]">
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 border-b border-white/5 py-3.5">
          <span className="text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search sections... (Esc to close)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto py-2 divide-y divide-white/[0.02]"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-white/40">
              No matching commands or navigation routes found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-white/[0.04] border-l-2 border-[var(--brand-red)]"
                      : "bg-transparent border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-lg p-1.5 bg-white/5 rounded-xl border border-white/5">
                      {cmd.icon}
                    </span>
                    <div className="leading-tight">
                      <p className="text-xs font-bold text-white">{cmd.title}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{cmd.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md font-bold text-white/50 border border-white/5">
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Action helper footer */}
        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] text-[9px] text-white/30 flex justify-between items-center font-semibold">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigation</span>
            <span>•</span>
            <span>Enter to run</span>
          </div>
          <div>Press Ctrl + K anytime to toggle</div>
        </div>
      </div>
    </div>
  );
}
