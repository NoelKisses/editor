"use client";

import { useCallback, useState } from "react";
import { Minus } from "lucide-react";
import { toast } from "sonner";

interface VectorElementsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type LineStyle = "solid" | "dashed" | "dotted" | "arrow";
type ArrowHead = "none" | "open" | "filled" | "both";

const LINE_COLORS = ["#ffffff", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#000000", "#6b7280"];

const STROKE_WIDTHS = [1, 2, 3, 5, 8, 12];

const POLYGON_SIDES = [3, 4, 5, 6, 8, 10, 12];

const STAR_POINTS = [3, 4, 5, 6, 8];

const SHAPE_CATEGORIES = [
  { id: "lines", label: "Linhas e Setas" },
  { id: "polygons", label: "Polígonos" },
  { id: "stars", label: "Estrelas" },
  { id: "special", label: "Especiais" },
];

function getPolygonPoints(sides: number, radius: number, cx: number, cy: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return points.join(" ");
}

function getStarPoints(points: number, outerR: number, innerR: number, cx: number, cy: number): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

export function VectorElementsPanel({ fabricCanvas }: VectorElementsPanelProps) {
  const [category, setCategory] = useState("lines");
  const [lineStyle, setLineStyle] = useState<LineStyle>("solid");
  const [arrowHead, setArrowHead] = useState<ArrowHead>("none");
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState("#3b82f6");
  const [polygonSides, setPolygonSides] = useState(6);
  const [starPoints, setStarPoints] = useState(5);
  const [innerRadius, setInnerRadius] = useState(40);

  const getDashArray = useCallback((style: LineStyle, width: number): number[] | null => {
    if (style === "dashed") return [width * 4, width * 2];
    if (style === "dotted") return [width, width * 2];
    return null;
  }, []);

  const addLine = useCallback(async () => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);
    const dash = getDashArray(lineStyle, strokeWidth);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line = new (fabric as any).Line([50, 200, 350, 200], {
      stroke: strokeColor,
      strokeWidth,
      strokeDashArray: dash ?? undefined,
      selectable: true,
      evented: true,
      left: 100,
      top: 200,
    });

    fabricCanvas.add(line);
    fabricCanvas.setActiveObject(line);

    // Add arrowhead
    if (arrowHead !== "none") {
      const endX = 350, endY = 200;
      const angle = 0;
      const headLen = strokeWidth * 6;

      const addArrowTip = (x: number, y: number, rot: number) => {
        const path = arrowHead === "filled"
          ? `M 0 0 L ${-headLen} ${-headLen / 2} L ${-headLen} ${headLen / 2} Z`
          : `M ${-headLen} ${-headLen / 2} L 0 0 L ${-headLen} ${headLen / 2}`;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tip = new (fabric as any).Path(path, {
          left: x,
          top: y,
          stroke: strokeColor,
          fill: arrowHead === "filled" ? strokeColor : "transparent",
          strokeWidth,
          angle: rot,
          selectable: false,
          evented: false,
        });
        fabricCanvas.add(tip);
      };

      addArrowTip(endX + 100, endY, angle);
      if (arrowHead === "both") addArrowTip(50 + 100, endY, angle + 180);
    }

    fabricCanvas.requestRenderAll();
    toast.success("Linha adicionada");
  }, [fabricCanvas, lineStyle, arrowHead, strokeColor, strokeWidth, getDashArray]);

  const addPolygon = useCallback(async () => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);
    const r = 80;
    const pts = [];
    for (let i = 0; i < polygonSides; i++) {
      const angle = (i * 2 * Math.PI) / polygonSides - Math.PI / 2;
      pts.push({ x: r + r * Math.cos(angle), y: r + r * Math.sin(angle) });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poly = new (fabric as any).Polygon(pts, {
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      selectable: true,
      evented: true,
    });

    fabricCanvas.add(poly);
    fabricCanvas.setActiveObject(poly);
    fabricCanvas.requestRenderAll();
    toast.success(`Polígono de ${polygonSides} lados adicionado`);
  }, [fabricCanvas, polygonSides, fillColor, strokeColor, strokeWidth]);

  const addStar = useCallback(async () => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);
    const outerR = 80;
    const innerR = (innerRadius / 100) * outerR;
    const pts = [];
    for (let i = 0; i < starPoints * 2; i++) {
      const r2 = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / starPoints - Math.PI / 2;
      pts.push({ x: outerR + r2 * Math.cos(angle), y: outerR + r2 * Math.sin(angle) });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const star = new (fabric as any).Polygon(pts, {
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      selectable: true,
      evented: true,
    });

    fabricCanvas.add(star);
    fabricCanvas.setActiveObject(star);
    fabricCanvas.requestRenderAll();
    toast.success(`Estrela de ${starPoints} pontas adicionada`);
  }, [fabricCanvas, starPoints, innerRadius, fillColor, strokeColor, strokeWidth]);

  const addSpecial = useCallback(async (type: string) => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);

    let path = "";
    if (type === "cross") {
      path = "M 40 0 L 60 0 L 60 40 L 100 40 L 100 60 L 60 60 L 60 100 L 40 100 L 40 60 L 0 60 L 0 40 L 40 40 Z";
    } else if (type === "heart") {
      path = "M 50 85 C 50 85 5 55 5 30 C 5 10 20 0 35 0 C 43 0 50 8 50 8 C 50 8 57 0 65 0 C 80 0 95 10 95 30 C 95 55 50 85 50 85 Z";
    } else if (type === "speech") {
      path = "M 10 10 L 90 10 Q 100 10 100 20 L 100 60 Q 100 70 90 70 L 40 70 L 20 90 L 25 70 L 10 70 Q 0 70 0 60 L 0 20 Q 0 10 10 10 Z";
    } else if (type === "badge") {
      path = "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z";
    }

    if (!path) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = new (fabric as any).Path(path, {
      left: 100,
      top: 100,
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
      selectable: true,
      evented: true,
      scaleX: 1.5,
      scaleY: 1.5,
    });

    fabricCanvas.add(obj);
    fabricCanvas.setActiveObject(obj);
    fabricCanvas.requestRenderAll();
    toast.success("Forma especial adicionada");
  }, [fabricCanvas, fillColor, strokeColor, strokeWidth]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Minus className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Elementos Vetoriais</span>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[9px] text-muted-foreground">Preenchimento</span>
            <div className="flex items-center gap-1">
              <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
              <div className="flex gap-0.5 flex-wrap">
                {LINE_COLORS.slice(0, 4).map((c) => (
                  <button key={c} onClick={() => setFillColor(c)} className="w-4 h-4 rounded-sm border border-border/50 hover:scale-110 transition-transform" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[9px] text-muted-foreground">Contorno</span>
            <div className="flex items-center gap-1">
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
              <div className="flex gap-0.5 flex-wrap">
                {LINE_COLORS.slice(4).map((c) => (
                  <button key={c} onClick={() => setStrokeColor(c)} className="w-4 h-4 rounded-sm border border-border/50 hover:scale-110 transition-transform" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stroke width */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Espessura do Traço</span>
          <div className="flex gap-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={`flex-1 py-1.5 rounded border flex items-center justify-center transition-colors ${strokeWidth === w ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
              >
                <div className="bg-foreground rounded-full" style={{ width: w < 4 ? 20 : 16, height: w }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 border-b border-border pb-2">
        {SHAPE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex-1 text-[9px] py-1 rounded transition-colors ${category === cat.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {cat.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Lines */}
      {category === "lines" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo da Linha</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["solid", "dashed", "dotted"] as LineStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setLineStyle(s)}
                  className={`py-2 px-2 rounded border flex items-center justify-center transition-colors ${lineStyle === s ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                >
                  <svg width="48" height="8">
                    <line
                      x1="0" y1="4" x2="48" y2="4"
                      stroke={lineStyle === s ? "#6366f1" : "#6b7280"}
                      strokeWidth="2"
                      strokeDasharray={s === "dashed" ? "8,4" : s === "dotted" ? "2,4" : undefined}
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ponta de Seta</span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: "none" as ArrowHead, label: "Nenhuma", svg: "——" },
                { value: "open" as ArrowHead, label: "Aberta →", svg: "→" },
                { value: "filled" as ArrowHead, label: "Preenchida ▶", svg: "▶" },
                { value: "both" as ArrowHead, label: "Dupla ↔", svg: "↔" },
              ].map((a) => (
                <button
                  key={a.value}
                  onClick={() => setArrowHead(a.value)}
                  className={`py-1.5 px-2 rounded border text-[10px] transition-colors ${arrowHead === a.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={addLine}
            className="flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-[11px] font-medium transition-colors"
          >
            Inserir Linha
          </button>
        </div>
      )}

      {/* Polygons */}
      {category === "polygons" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Número de Lados</span>
            <div className="flex gap-1 flex-wrap">
              {POLYGON_SIDES.map((s) => (
                <button
                  key={s}
                  onClick={() => setPolygonSides(s)}
                  className={`w-9 h-9 rounded border flex items-center justify-center transition-colors ${polygonSides === s ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <polygon points={getPolygonPoints(s, 12, 14, 14)} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground">{polygonSides} lados selecionados</span>
          </div>
          <button
            onClick={addPolygon}
            className="flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-[11px] font-medium transition-colors"
          >
            Inserir Polígono ({polygonSides} lados)
          </button>
        </div>
      )}

      {/* Stars */}
      {category === "stars" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pontas da Estrela</span>
            <div className="flex gap-1">
              {STAR_POINTS.map((p) => (
                <button
                  key={p}
                  onClick={() => setStarPoints(p)}
                  className={`flex-1 h-10 rounded border flex items-center justify-center transition-colors ${starPoints === p ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <polygon points={getStarPoints(p, 12, 5, 14, 14)} fill={fillColor} stroke={strokeColor} strokeWidth="1" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Raio Interno</span>
              <span className="text-[10px] tabular-nums">{innerRadius}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={80}
              step={5}
              value={innerRadius}
              onChange={(e) => setInnerRadius(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <button
            onClick={addStar}
            className="flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-[11px] font-medium transition-colors"
          >
            Inserir Estrela ({starPoints} pontas)
          </button>
        </div>
      )}

      {/* Special shapes */}
      {category === "special" && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Formas Especiais</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: "cross", label: "Cruz / Mais" },
              { type: "heart", label: "Coração" },
              { type: "speech", label: "Balão de Fala" },
              { type: "badge", label: "Estrela Badge" },
            ].map((s) => (
              <button
                key={s.type}
                onClick={() => addSpecial(s.type)}
                className="flex flex-col items-center gap-1 py-3 rounded border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <svg width="40" height="40" viewBox="0 0 100 100">
                  {s.type === "cross" && <path d="M 40 0 L 60 0 L 60 40 L 100 40 L 100 60 L 60 60 L 60 100 L 40 100 L 40 60 L 0 60 L 0 40 L 40 40 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />}
                  {s.type === "heart" && <path d="M 50 85 C 50 85 5 55 5 30 C 5 10 20 0 35 0 C 43 0 50 8 50 8 C 50 8 57 0 65 0 C 80 0 95 10 95 30 C 95 55 50 85 50 85 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />}
                  {s.type === "speech" && <path d="M 10 10 L 90 10 Q 100 10 100 20 L 100 60 Q 100 70 90 70 L 40 70 L 20 90 L 25 70 L 10 70 Q 0 70 0 60 L 0 20 Q 0 10 10 10 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />}
                  {s.type === "badge" && <path d="M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />}
                </svg>
                <span className="text-[9px] text-muted-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
