"use client";

import { useCallback, useState } from "react";
import { Shapes, Search } from "lucide-react";
import { toast } from "sonner";

interface ShapeLibraryPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface ShapeDef {
  id: string;
  label: string;
  category: string;
  draw: (fabric: unknown, cx: number, cy: number, size: number) => unknown;
}

const SHAPE_CATEGORIES = ["Básicas", "Polígonos", "Setas", "Símbolos"];

function makeShapes(): ShapeDef[] {
  return [
    // Básicas
    {
      id: "rect", label: "Retângulo", category: "Básicas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => new f.Rect({ left: cx, top: cy, width: size, height: size * 0.6, fill: "#6366f1", originX: "center", originY: "center" }),
    },
    {
      id: "square", label: "Quadrado", category: "Básicas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => new f.Rect({ left: cx, top: cy, width: size, height: size, fill: "#6366f1", originX: "center", originY: "center" }),
    },
    {
      id: "circle", label: "Círculo", category: "Básicas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => new f.Circle({ left: cx, top: cy, radius: size / 2, fill: "#6366f1", originX: "center", originY: "center" }),
    },
    {
      id: "ellipse", label: "Elipse", category: "Básicas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => new f.Ellipse({ left: cx, top: cy, rx: size / 2, ry: size / 3, fill: "#6366f1", originX: "center", originY: "center" }),
    },
    {
      id: "line", label: "Linha", category: "Básicas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => new f.Line([cx - size / 2, cy, cx + size / 2, cy], { stroke: "#6366f1", strokeWidth: 3, originX: "center", originY: "center" }),
    },
    {
      id: "roundrect", label: "Rect. Arred.", category: "Básicas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => new f.Rect({ left: cx, top: cy, width: size, height: size * 0.6, rx: 12, ry: 12, fill: "#6366f1", originX: "center", originY: "center" }),
    },
    // Polígonos
    {
      id: "triangle", label: "Triângulo", category: "Polígonos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => new f.Triangle({ left: cx, top: cy, width: size, height: size * 0.87, fill: "#6366f1", originX: "center", originY: "center" }),
    },
    {
      id: "pentagon", label: "Pentágono", category: "Polígonos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const pts = Array.from({ length: 5 }, (_, i) => {
          const a = (i * 72 - 90) * Math.PI / 180;
          return { x: cx + (size / 2) * Math.cos(a), y: cy + (size / 2) * Math.sin(a) };
        });
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    {
      id: "hexagon", label: "Hexágono", category: "Polígonos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 - 30) * Math.PI / 180;
          return { x: cx + (size / 2) * Math.cos(a), y: cy + (size / 2) * Math.sin(a) };
        });
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    {
      id: "octagon", label: "Octógono", category: "Polígonos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const pts = Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 - 22.5) * Math.PI / 180;
          return { x: cx + (size / 2) * Math.cos(a), y: cy + (size / 2) * Math.sin(a) };
        });
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    {
      id: "star5", label: "Estrela 5", category: "Polígonos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const pts: { x: number; y: number }[] = [];
        const outer = size / 2;
        const inner = outer * 0.4;
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const a = (i * 36 - 90) * Math.PI / 180;
          pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    {
      id: "star6", label: "Estrela 6", category: "Polígonos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const pts: { x: number; y: number }[] = [];
        const outer = size / 2;
        const inner = outer * 0.45;
        for (let i = 0; i < 12; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const a = (i * 30 - 90) * Math.PI / 180;
          pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
        }
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    // Setas
    {
      id: "arrow-right", label: "Seta →", category: "Setas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const s = size / 2;
        const pts = [
          { x: cx - s, y: cy - s * 0.2 }, { x: cx, y: cy - s * 0.2 },
          { x: cx, y: cy - s * 0.5 }, { x: cx + s, y: cy },
          { x: cx, y: cy + s * 0.5 }, { x: cx, y: cy + s * 0.2 }, { x: cx - s, y: cy + s * 0.2 },
        ];
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    {
      id: "arrow-up", label: "Seta ↑", category: "Setas",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const s = size / 2;
        const pts = [
          { x: cx - s * 0.2, y: cy + s }, { x: cx - s * 0.2, y: cy },
          { x: cx - s * 0.5, y: cy }, { x: cx, y: cy - s },
          { x: cx + s * 0.5, y: cy }, { x: cx + s * 0.2, y: cy }, { x: cx + s * 0.2, y: cy + s },
        ];
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    // Símbolos
    {
      id: "heart", label: "Coração", category: "Símbolos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const s = size / 2;
        const path = `M ${cx} ${cy + s * 0.3} C ${cx} ${cy - s * 0.5} ${cx - s} ${cy - s * 0.5} ${cx - s} ${cy} C ${cx - s} ${cy + s * 0.5} ${cx} ${cy + s} ${cx} ${cy + s} C ${cx} ${cy + s} ${cx + s} ${cy + s * 0.5} ${cx + s} ${cy} C ${cx + s} ${cy - s * 0.5} ${cx} ${cy - s * 0.5} ${cx} ${cy + s * 0.3} Z`;
        return new f.Path(path, { fill: "#ef4444", originX: "center", originY: "center" });
      },
    },
    {
      id: "cross", label: "Cruz", category: "Símbolos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const t = size * 0.25;
        const s = size / 2;
        const pts = [
          { x: cx - t, y: cy - s }, { x: cx + t, y: cy - s },
          { x: cx + t, y: cy - t }, { x: cx + s, y: cy - t },
          { x: cx + s, y: cy + t }, { x: cx + t, y: cy + t },
          { x: cx + t, y: cy + s }, { x: cx - t, y: cy + s },
          { x: cx - t, y: cy + t }, { x: cx - s, y: cy + t },
          { x: cx - s, y: cy - t }, { x: cx - t, y: cy - t },
        ];
        return new f.Polygon(pts, { fill: "#6366f1", originX: "center", originY: "center" });
      },
    },
    {
      id: "cloud", label: "Nuvem", category: "Símbolos",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draw: (f: any, cx, cy, size) => {
        const s = size / 2;
        const path = `M ${cx - s * 0.3} ${cy + s * 0.4} A ${s * 0.4} ${s * 0.4} 0 0 1 ${cx - s * 0.7} ${cy} A ${s * 0.5} ${s * 0.5} 0 0 1 ${cx - s * 0.1} ${cy - s * 0.4} A ${s * 0.35} ${s * 0.35} 0 0 1 ${cx + s * 0.2} ${cy - s * 0.5} A ${s * 0.4} ${s * 0.4} 0 0 1 ${cx + s * 0.7} ${cy - s * 0.1} A ${s * 0.35} ${s * 0.35} 0 0 1 ${cx + s * 0.7} ${cy + s * 0.4} Z`;
        return new f.Path(path, { fill: "#94a3b8", originX: "center", originY: "center" });
      },
    },
  ];
}

const ALL_SHAPES = makeShapes();

export function ShapeLibraryPanel({ fabricCanvas }: ShapeLibraryPanelProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [fill, setFill] = useState("#6366f1");
  const [stroke, setStroke] = useState("");
  const [strokeWidth, setStrokeWidth] = useState(0);

  const filtered = ALL_SHAPES.filter(s => {
    const matchSearch = !search || s.label.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || s.category === activeCategory;
    return matchSearch && matchCat;
  });

  const addShape = useCallback((def: ShapeDef) => {
    if (!fabricCanvas) return;
    import("fabric").then(m => {
      const fabric = m.fabric;
      const cx = fabricCanvas.width / 2;
      const cy = fabricCanvas.height / 2;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shape = def.draw(fabric, cx, cy, 100) as any;
      shape.set({ fill, stroke: stroke || undefined, strokeWidth: strokeWidth || 0 });
      fabricCanvas.add(shape);
      fabricCanvas.setActiveObject(shape);
      fabricCanvas.requestRenderAll();
      toast.success(`${def.label} adicionado`);
    });
  }, [fabricCanvas, fill, stroke, strokeWidth]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Shapes className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Biblioteca de Formas</span>
      </div>

      {/* Style controls */}
      <div className="flex items-center gap-2 p-2 rounded border border-border bg-muted/20">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-muted-foreground">Preenchimento</span>
          <label className="cursor-pointer">
            <div className="w-8 h-6 rounded border border-border" style={{ background: fill }} />
            <input type="color" value={fill} onChange={e => setFill(e.target.value)} className="sr-only" />
          </label>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-muted-foreground">Borda</span>
          <label className="cursor-pointer">
            <div className="w-8 h-6 rounded border border-border" style={{ background: stroke || "transparent" }} />
            <input type="color" value={stroke || "#000000"} onChange={e => setStroke(e.target.value)} className="sr-only" />
          </label>
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <span className="text-[8px] text-muted-foreground">Esp. borda: {strokeWidth}px</span>
          <input type="range" min={0} max={10} step={1} value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} className="w-full accent-primary h-1" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Buscar forma..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-7 pr-2 py-1.5 bg-muted/50 border border-border rounded text-[10px] focus:outline-none focus:border-primary"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-2 py-0.5 rounded text-[8px] border transition-colors ${!activeCategory ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
        >
          Todas
        </button>
        {SHAPE_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`px-2 py-0.5 rounded text-[8px] border transition-colors ${activeCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shape grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {filtered.map(def => (
          <button
            key={def.id}
            onClick={() => addShape(def)}
            className="flex flex-col items-center gap-1 p-2 rounded border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors group"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: fill }}
            >
              {def.label.slice(0, 2)}
            </div>
            <span className="text-[8px] text-muted-foreground group-hover:text-primary transition-colors text-center leading-tight">
              {def.label}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-4">Nenhuma forma encontrada</p>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Clique para adicionar ao canvas no centro
      </p>
    </div>
  );
}
