"use client";

import { useEffect, useState } from "react";

type ThemeConfig = {
  name: string;
  color: string;
  soft: string;
  glow: string;
};

const themes: Record<string, ThemeConfig> = {
  crimson: {
    name: "Crimson Rage",
    color: "#e10600", // Original Next Gear Ferrari Red
    soft: "#ff3b30",
    glow: "rgba(225, 6, 0, 0.05)"
  },
  emerald: {
    name: "Emerald Pulse",
    color: "#10b981",
    soft: "#34d399",
    glow: "rgba(16, 185, 129, 0.05)"
  },
  cyberpunk: {
    name: "Cyberpunk Pink",
    color: "#ec4899",
    soft: "#f472b6",
    glow: "rgba(236, 72, 153, 0.05)"
  },
  vesper: {
    name: "Vesper Blue",
    color: "#3b82f6",
    soft: "#60a5fa",
    glow: "rgba(59, 130, 246, 0.05)"
  },
  sunset: {
    name: "Sunset Gold",
    color: "#f59e0b",
    soft: "#fbbf24",
    glow: "rgba(245, 158, 11, 0.05)"
  },
  amethyst: {
    name: "Amethyst Dark",
    color: "#8b5cf6",
    soft: "#a78bfa",
    glow: "rgba(139, 92, 246, 0.05)"
  },
  monochrome: {
    name: "Monochrome Slate",
    color: "#e2e8f0",
    soft: "#ffffff",
    glow: "rgba(226, 232, 240, 0.05)"
  }
};

export function AdminThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<string>("crimson");

  useEffect(() => {
    const saved = localStorage.getItem("admin-dashboard-theme");
    if (saved && saved in themes) {
      applyTheme(saved);
      setActiveTheme(saved);
    } else {
      applyTheme("crimson");
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const t = themes[themeId];
    if (!t) return;
    document.documentElement.style.setProperty("--brand-red", t.color);
    document.documentElement.style.setProperty("--brand-red-soft", t.soft);
    document.documentElement.style.setProperty("--brand-red-glow", t.glow);
  };

  const handleThemeChange = (id: string) => {
    applyTheme(id);
    setActiveTheme(id);
    localStorage.setItem("admin-dashboard-theme", id);
  };

  return (
    <div className="flex items-center gap-1.5 border-l border-white/5 pl-4 mr-2 select-none">
      {Object.entries(themes).map(([id, theme]) => {
        const isActive = activeTheme === id;
        return (
          <button
            key={id}
            onClick={() => handleThemeChange(id)}
            title={theme.name}
            type="button"
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 relative cursor-pointer flex items-center justify-center hover:scale-125 border focus:outline-none ${
              isActive ? "border-white scale-110 shadow-sm" : "border-white/10"
            }`}
            style={{ backgroundColor: theme.color }}
          >
            {isActive && <span className="w-1 h-1 rounded-full bg-black/60 animate-pulse" />}
          </button>
        );
      })}
    </div>
  );
}
