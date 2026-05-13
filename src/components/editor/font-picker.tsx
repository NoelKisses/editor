"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

// Curated list of popular Google Fonts for design
export const GOOGLE_FONTS = [
  // Sans-serif
  { name: "Inter", category: "sans-serif" },
  { name: "Roboto", category: "sans-serif" },
  { name: "Open Sans", category: "sans-serif" },
  { name: "Lato", category: "sans-serif" },
  { name: "Poppins", category: "sans-serif" },
  { name: "Montserrat", category: "sans-serif" },
  { name: "Nunito", category: "sans-serif" },
  { name: "Raleway", category: "sans-serif" },
  { name: "Oswald", category: "sans-serif" },
  { name: "Source Sans Pro", category: "sans-serif" },
  { name: "Noto Sans", category: "sans-serif" },
  { name: "Ubuntu", category: "sans-serif" },
  { name: "Rubik", category: "sans-serif" },
  { name: "Quicksand", category: "sans-serif" },
  { name: "Outfit", category: "sans-serif" },
  { name: "DM Sans", category: "sans-serif" },
  { name: "Figtree", category: "sans-serif" },
  { name: "Plus Jakarta Sans", category: "sans-serif" },
  // Serif
  { name: "Georgia", category: "serif" },
  { name: "Playfair Display", category: "serif" },
  { name: "Merriweather", category: "serif" },
  { name: "Lora", category: "serif" },
  { name: "EB Garamond", category: "serif" },
  { name: "Libre Baskerville", category: "serif" },
  { name: "Cormorant Garamond", category: "serif" },
  // Display / Decorative
  { name: "Bebas Neue", category: "display" },
  { name: "Anton", category: "display" },
  { name: "Alfa Slab One", category: "display" },
  { name: "Righteous", category: "display" },
  { name: "Pacifico", category: "display" },
  { name: "Lobster", category: "display" },
  { name: "Abril Fatface", category: "display" },
  { name: "Permanent Marker", category: "display" },
  { name: "Bangers", category: "display" },
  // Monospace
  { name: "Source Code Pro", category: "monospace" },
  { name: "JetBrains Mono", category: "monospace" },
  { name: "Fira Code", category: "monospace" },
  // System fallbacks
  { name: "Arial", category: "system" },
  { name: "Helvetica", category: "system" },
  { name: "Times New Roman", category: "system" },
  { name: "Verdana", category: "system" },
  { name: "Impact", category: "system" },
  { name: "Courier New", category: "system" },
];

const CATEGORY_LABELS: Record<string, string> = {
  "sans-serif": "Sans-serif",
  "serif": "Serif",
  "display": "Display",
  "monospace": "Mono",
  "system": "Sistema",
};

const loadedFonts = new Set<string>();

function loadGoogleFont(fontName: string) {
  if (loadedFonts.has(fontName)) return;
  if (typeof document === "undefined") return;
  // Skip system fonts
  const systemFonts = ["Arial", "Helvetica", "Times New Roman", "Verdana", "Impact", "Courier New", "Georgia"];
  if (systemFonts.includes(fontName)) {
    loadedFonts.add(fontName);
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(fontName);
}

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

export function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load font for current value
  useEffect(() => {
    loadGoogleFont(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = GOOGLE_FONTS.filter((f) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "all" || f.category === activeCategory;
    return matchSearch && matchCat;
  });

  const handleSelect = useCallback((fontName: string) => {
    loadGoogleFont(fontName);
    onChange(fontName);
    setOpen(false);
    setSearch("");
  }, [onChange]);

  const categories = ["all", "sans-serif", "serif", "display", "monospace", "system"];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs bg-background border border-border rounded hover:border-primary/50 transition-colors"
        style={{ fontFamily: value }}
      >
        <span className="truncate">{value}</span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-2xl flex flex-col"
          style={{ maxHeight: 320, minWidth: 200 }}
        >
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-1.5 bg-background border border-border rounded px-2 py-1">
              <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar fonte..."
                className="text-xs bg-transparent outline-none flex-1 text-foreground"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-0.5 p-1.5 border-b border-border overflow-x-auto flex-shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[9px] px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
                  activeCategory === cat
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "all" ? "Todas" : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>

          {/* Font list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-muted-foreground">Nenhuma fonte encontrada</div>
            ) : (
              filtered.map((font) => {
                loadGoogleFont(font.name);
                return (
                  <button
                    key={font.name}
                    onClick={() => handleSelect(font.name)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors flex items-center justify-between ${
                      value === font.name ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                  >
                    <span style={{ fontFamily: font.name }}>{font.name}</span>
                    <span className="text-[9px] text-muted-foreground ml-2">{CATEGORY_LABELS[font.category]}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
