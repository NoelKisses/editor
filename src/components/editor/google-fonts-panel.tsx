"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Type, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GoogleFontsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const POPULAR_FONTS = [
  "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald",
  "Source Sans Pro", "Raleway", "PT Sans", "Merriweather", "Nunito",
  "Playfair Display", "Poppins", "Ubuntu", "Rubik", "Work Sans",
  "Inter", "Fira Sans", "Noto Sans", "Quicksand", "Josefin Sans",
  "Bebas Neue", "Anton", "Lobster", "Pacifico", "Dancing Script",
  "Cinzel", "Cormorant Garamond", "EB Garamond", "Libre Baskerville", "Crimson Text",
  "Exo 2", "Rajdhani", "Titillium Web", "Barlow", "Karla",
  "Libre Franklin", "IBM Plex Sans", "DM Sans", "Manrope", "Plus Jakarta Sans",
];

const CATEGORIES = ["Todas", "Serifadas", "Sem Serifas", "Decorativas", "Manuscrito"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_MAP: Record<Category, string> = {
  "Todas": "",
  "Serifadas": "serif",
  "Sem Serifas": "sans-serif",
  "Decorativas": "display",
  "Manuscrito": "handwriting",
};

const SERIF_FONTS = ["Merriweather", "Playfair Display", "EB Garamond", "Libre Baskerville", "Crimson Text", "Cormorant Garamond", "Cinzel"];
const HANDWRITING_FONTS = ["Dancing Script", "Pacifico", "Lobster"];
const DISPLAY_FONTS = ["Bebas Neue", "Anton", "Oswald", "Raleway", "Josefin Sans"];

function getCategory(font: string): string {
  if (SERIF_FONTS.includes(font)) return "serif";
  if (HANDWRITING_FONTS.includes(font)) return "handwriting";
  if (DISPLAY_FONTS.includes(font)) return "display";
  return "sans-serif";
}

const loadedFonts = new Set<string>();

async function loadGoogleFont(family: string): Promise<boolean> {
  if (loadedFonts.has(family)) return true;
  try {
    const encoded = encodeURIComponent(family);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`;
    document.head.appendChild(link);
    await document.fonts.ready;
    loadedFonts.add(family);
    return true;
  } catch {
    return false;
  }
}

export function GoogleFontsPanel({ fabricCanvas }: GoogleFontsPanelProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Todas");
  const [loadingFont, setLoadingFont] = useState<string | null>(null);
  const [appliedFont, setAppliedFont] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState("Texto de Exemplo");
  const [previewSize, setPreviewSize] = useState(24);
  const loadedInView = useRef(new Set<string>());

  const filteredFonts = POPULAR_FONTS.filter((f) => {
    const matchSearch = f.toLowerCase().includes(search.toLowerCase());
    const cat = CATEGORY_MAP[category];
    const matchCat = !cat || getCategory(f) === cat;
    return matchSearch && matchCat;
  });

  // Preload fonts as they come into view
  useEffect(() => {
    const toLoad = filteredFonts.filter((f) => !loadedInView.current.has(f)).slice(0, 10);
    toLoad.forEach((f) => {
      loadedInView.current.add(f);
      loadGoogleFont(f);
    });
  }, [filteredFonts]);

  const applyFont = useCallback(async (fontFamily: string) => {
    if (!fabricCanvas) return;
    setLoadingFont(fontFamily);
    const ok = await loadGoogleFont(fontFamily);
    setLoadingFont(null);
    if (!ok) { toast.error(`Erro ao carregar ${fontFamily}`); return; }

    const active = fabricCanvas.getActiveObject();
    if (active && ["i-text", "textbox", "text"].includes(active.type)) {
      active.set({ fontFamily });
      fabricCanvas.requestRenderAll();
      setAppliedFont(fontFamily);
      toast.success(`Fonte "${fontFamily}" aplicada`);
    } else {
      const fabric = await import("fabric").then((m) => m.fabric);
      const text = new fabric.IText(sampleText || "Título", {
        left: 60,
        top: 60,
        fontSize: 56,
        fontFamily,
        fill: "#ffffff",
        fontWeight: "bold",
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      fabricCanvas.requestRenderAll();
      setAppliedFont(fontFamily);
      toast.success(`Texto adicionado com "${fontFamily}"`);
    }
  }, [fabricCanvas, sampleText]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Fontes Google</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{filteredFonts.length} fontes</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar fonte..."
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-background border border-border rounded outline-none focus:border-primary/50 text-foreground"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
              category === c
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Preview settings */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          className="flex-1 text-[10px] bg-background border border-border rounded px-2 py-1 text-foreground outline-none focus:border-primary/50"
          placeholder="Texto de prévia..."
        />
        <input
          type="number"
          value={previewSize}
          onChange={(e) => setPreviewSize(Math.max(12, Math.min(48, Number(e.target.value))))}
          className="w-12 text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground outline-none text-center"
          min={12}
          max={48}
        />
      </div>

      {/* Font list */}
      <div className="flex flex-col gap-1 max-h-[420px] overflow-y-auto pr-0.5">
        {filteredFonts.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center py-4">Nenhuma fonte encontrada</p>
        )}
        {filteredFonts.map((font) => (
          <button
            key={font}
            onClick={() => applyFont(font)}
            className={`flex flex-col gap-0.5 text-left px-2.5 py-2 rounded-lg border transition-colors hover:border-primary/40 hover:bg-accent/20 ${
              appliedFont === font ? "border-primary/60 bg-primary/5" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{font}</span>
              {loadingFont === font ? (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              ) : appliedFont === font ? (
                <Check className="w-3 h-3 text-primary" />
              ) : null}
            </div>
            <span
              className="text-foreground leading-tight truncate"
              style={{ fontFamily: font, fontSize: previewSize }}
            >
              {sampleText || font}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
