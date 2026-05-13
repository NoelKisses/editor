"use client";

import { useCallback, useState } from "react";
import { Search, Shapes, Sticker, Square, Circle, Triangle, Star, ArrowRight, Minus } from "lucide-react";
import { toast } from "sonner";

interface ElementSearchPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Category = "all" | "shapes" | "lines" | "icons" | "text";

interface SearchResult {
  id: string;
  name: string;
  category: Category;
  keywords: string[];
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (canvas: any) => void;
}

function makeFabricShape(canvas: unknown, type: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = canvas as any;
  const cx = (c.getWidth() / c.getZoom()) / 2;
  const cy = (c.getHeight() / c.getZoom()) / 2;
  import("fabric").then(m => {
    const fabric = m.fabric;
    let obj;
    switch (type) {
      case "rect":
        obj = new fabric.Rect({ left: cx - 60, top: cy - 40, width: 120, height: 80, fill: "#6366f1" });
        break;
      case "circle":
        obj = new fabric.Circle({ left: cx - 50, top: cy - 50, radius: 50, fill: "#f59e0b" });
        break;
      case "triangle":
        obj = new fabric.Triangle({ left: cx - 50, top: cy - 50, width: 100, height: 100, fill: "#10b981" });
        break;
      case "line":
        obj = new fabric.Line([cx - 60, cy, cx + 60, cy], { stroke: "#6366f1", strokeWidth: 3 });
        break;
      case "arrow": {
        const arrowPath = `M ${cx - 60} ${cy} L ${cx + 40} ${cy} M ${cx + 20} ${cy - 15} L ${cx + 60} ${cy} L ${cx + 20} ${cy + 15}`;
        obj = new fabric.Path(arrowPath, { stroke: "#6366f1", strokeWidth: 3, fill: "" });
        break;
      }
      case "star": {
        const points = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? 50 : 25;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }
        obj = new fabric.Polygon(points, { fill: "#f59e0b", left: cx - 50, top: cy - 50 });
        break;
      }
      case "text":
        obj = new fabric.IText("Clique para editar", { left: cx - 80, top: cy - 20, fontSize: 24, fill: "#ffffff", fontFamily: "Inter" });
        break;
      case "ellipse":
        obj = new fabric.Ellipse({ left: cx - 70, top: cy - 40, rx: 70, ry: 40, fill: "#8b5cf6" });
        break;
      default:
        obj = new fabric.Rect({ left: cx - 60, top: cy - 40, width: 120, height: 80, fill: "#6366f1" });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.add(obj as any);
    c.setActiveObject(obj as Parameters<typeof c.setActiveObject>[0]);
    c.requestRenderAll();
    toast.success(`${type} adicionado`);
  });
}

const CATALOG: SearchResult[] = [
  { id: "rect", name: "Retângulo", category: "shapes", keywords: ["retangulo", "quadrado", "caixa", "box", "rect", "square"], icon: <Square className="w-4 h-4" />, create: (c) => makeFabricShape(c, "rect") },
  { id: "circle", name: "Círculo", category: "shapes", keywords: ["circulo", "redondo", "oval", "bolinha", "circle"], icon: <Circle className="w-4 h-4" />, create: (c) => makeFabricShape(c, "circle") },
  { id: "triangle", name: "Triângulo", category: "shapes", keywords: ["triangulo", "piramide", "triangle"], icon: <Triangle className="w-4 h-4" />, create: (c) => makeFabricShape(c, "triangle") },
  { id: "ellipse", name: "Elipse", category: "shapes", keywords: ["elipse", "oval", "ovalo", "ellipse"], icon: <Circle className="w-4 h-4" />, create: (c) => makeFabricShape(c, "ellipse") },
  { id: "star", name: "Estrela", category: "shapes", keywords: ["estrela", "star", "favorito"], icon: <Star className="w-4 h-4" />, create: (c) => makeFabricShape(c, "star") },
  { id: "line", name: "Linha", category: "lines", keywords: ["linha", "line", "traço", "divisor", "separador"], icon: <Minus className="w-4 h-4" />, create: (c) => makeFabricShape(c, "line") },
  { id: "arrow", name: "Seta", category: "lines", keywords: ["seta", "arrow", "apontar", "direcao", "flecha"], icon: <ArrowRight className="w-4 h-4" />, create: (c) => makeFabricShape(c, "arrow") },
  { id: "text", name: "Texto", category: "text", keywords: ["texto", "text", "escrever", "tipografia", "fonte", "letra"], icon: <Search className="w-4 h-4" />, create: (c) => makeFabricShape(c, "text") },
];

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "Todos", icon: <Sticker className="w-3 h-3" /> },
  { value: "shapes", label: "Formas", icon: <Shapes className="w-3 h-3" /> },
  { value: "lines", label: "Linhas", icon: <Minus className="w-3 h-3" /> },
  { value: "text", label: "Texto", icon: <Search className="w-3 h-3" /> },
];

export function ElementSearchPanel({ fabricCanvas }: ElementSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const results = CATALOG.filter(item => {
    const matchCat = category === "all" || item.category === category;
    if (!query.trim()) return matchCat;
    const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const nameNorm = item.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const keyMatch = item.keywords.some(k => k.includes(q));
    return matchCat && (nameNorm.includes(q) || keyMatch);
  });

  const handleAdd = useCallback((item: SearchResult) => {
    if (!fabricCanvas) { toast.error("Canvas não inicializado"); return; }
    item.create(fabricCanvas);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Buscar Elementos</span>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar formas, ícones..."
          className="w-full text-[11px] bg-background border border-border rounded pl-7 pr-3 py-2 outline-none focus:border-primary/50"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            ✕
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-1 text-[9px] px-2 py-1 rounded border transition-colors ${category === cat.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="text-[9px] text-muted-foreground">
        {results.length} resultado{results.length !== 1 ? "s" : ""}
        {query && ` para "${query}"`}
      </div>

      {results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Search className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Nenhum elemento encontrado</p>
          <p className="text-[9px] text-muted-foreground/60">Tente outra palavra-chave</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 max-h-80 overflow-y-auto">
          {results.map(item => (
            <button
              key={item.id}
              onClick={() => handleAdd(item)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                {item.icon}
              </div>
              <span className="text-[9px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight text-center">{item.name}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/60 text-center">
        Clique para adicionar ao canvas
      </p>
    </div>
  );
}
