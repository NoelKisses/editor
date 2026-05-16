"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LibraryBig } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ICON_CATEGORIES: Record<string, string[]> = {
  Setas: ["↗", "→", "↑", "↓", "↻", "↺"],
  Comunicacao: ["✉", "💬", "📞", "📍", "🔔", "📢"],
  Sociais: ["❤", "⭐", "👁", "🔗", "👍", "🏆"],
  Geometria: ["▲", "■", "●", "◆", "⬡", "⬢"],
  Simbolos: ["✓", "✕", "⊕", "⊖", "ℹ", "⚠"],
};

const CATEGORY_LABELS: Record<string, string> = {
  Setas: "Setas",
  Comunicacao: "Comunicação",
  Sociais: "Sociais",
  Geometria: "Geometria",
  Simbolos: "Símbolos",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCanvasCenter(canvas: any): { x: number; y: number } {
  if (!canvas) return { x: 0, y: 0 };
  const w = typeof canvas.getWidth === "function" ? canvas.getWidth() : 800;
  const h = typeof canvas.getHeight === "function" ? canvas.getHeight() : 600;
  return { x: w / 2, y: h / 2 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeIconLibraryObjects(canvas: any): number {
  if (!canvas || typeof canvas.getObjects !== "function") return 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const objects: any[] = canvas.getObjects();
  let count = 0;
  for (const obj of objects) {
    if (obj && obj.data && obj.data.iconLibrary === true) {
      canvas.remove(obj);
      count += 1;
    }
  }
  if (typeof canvas.requestRenderAll === "function") {
    canvas.requestRenderAll();
  } else if (typeof canvas.renderAll === "function") {
    canvas.renderAll();
  }
  return count;
}

interface ObjectIconLibraryPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ObjectIconLibraryPanel({ fabricCanvas }: ObjectIconLibraryPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Setas");
  const [color, setColor] = useState<string>("#000000");
  const [size, setSize] = useState<number>(48);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const insertIcon = useCallback((glyph: string, categoryKey: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f || !f.IText) {
          toast.error("Fabric não carregado");
          return;
        }
        const center = getCanvasCenter(canvas);
        const text = new f.IText(glyph, {
          left: center.x,
          top: center.y,
          originX: "center",
          originY: "center",
          fontSize: size,
          fill: color,
          fontFamily: "Arial",
          selectable: true,
        });
        text.data = { iconLibrary: true, category: categoryKey };
        canvas.add(text);
        canvas.setActiveObject(text);
        if (typeof canvas.requestRenderAll === "function") {
          canvas.requestRenderAll();
        } else if (typeof canvas.renderAll === "function") {
          canvas.renderAll();
        }
        toast.success("Ícone inserido");
      })
      .catch(() => {
        toast.error("Falha ao carregar Fabric");
      });
  }, [size, color]);

  const handleRemoveAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const removed = removeIconLibraryObjects(canvas);
    if (removed > 0) {
      toast.success(`${removed} ícone(s) removido(s)`);
    } else {
      toast.info("Nenhum ícone para remover");
    }
  };

  const query = search.trim().toLowerCase();
  const isSearching = query.length > 0;

  const searchMatches: Array<{ glyph: string; category: string }> = [];
  if (isSearching) {
    for (const key of Object.keys(ICON_CATEGORIES)) {
      const label = (CATEGORY_LABELS[key] || key).toLowerCase();
      const glyphs = ICON_CATEGORIES[key];
      for (const glyph of glyphs) {
        if (key.toLowerCase().includes(query) || label.includes(query) || glyph.includes(query)) {
          searchMatches.push({ glyph, category: key });
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <LibraryBig className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Biblioteca de Ícones SVG</h3>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Buscar</span>
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ícone ou categoria..."
        />
      </div>

      {!isSearching && (
        <div className="flex flex-wrap gap-1">
          {Object.keys(ICON_CATEGORIES).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveCategory(key)}
              className={`px-2 py-1 text-xs rounded border ${
                activeCategory === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-input hover:bg-accent"
              }`}
            >
              {CATEGORY_LABELS[key] || key}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-6 gap-2">
        {isSearching
          ? searchMatches.map((item, idx) => (
              <button
                key={`${item.category}-${item.glyph}-${idx}`}
                type="button"
                // eslint-disable-next-line react-hooks/refs
                onClick={() => insertIcon(item.glyph, item.category)}
                className="aspect-square flex items-center justify-center text-2xl rounded border border-input hover:bg-accent"
                title={`${CATEGORY_LABELS[item.category] || item.category}`}
              >
                {item.glyph}
              </button>
            ))
          : (ICON_CATEGORIES[activeCategory] || []).map((glyph, idx) => (
              <button
                key={`${activeCategory}-${glyph}-${idx}`}
                type="button"
                onClick={() => insertIcon(glyph, activeCategory)}
                className="aspect-square flex items-center justify-center text-2xl rounded border border-input hover:bg-accent"
                title={CATEGORY_LABELS[activeCategory] || activeCategory}
              >
                {glyph}
              </button>
            ))}
      </div>

      {isSearching && searchMatches.length === 0 && (
        <div className="text-xs text-muted-foreground text-center py-2">
          Nenhum ícone encontrado
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Cor</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-12 rounded border border-input bg-background cursor-pointer"
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Tamanho</span>
          <span className="text-xs font-mono">{size}px</span>
        </div>
        <input
          type="range"
          min={16}
          max={120}
          step={1}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Clique em um ícone para inseri-lo no centro do canvas.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={handleRemoveAll}>
          Remover Ícones
        </Button>
      </div>
    </div>
  );
}
