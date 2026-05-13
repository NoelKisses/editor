"use client";

import { useCallback, useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";

interface PatternsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type PatternType =
  | "dots" | "grid" | "diagonal" | "cross-hatch" | "chevron" | "hexagon"
  | "triangles" | "waves" | "bricks" | "circles" | "stars" | "diamonds";

const PATTERNS: { value: PatternType; label: string }[] = [
  { value: "dots", label: "Pontos" },
  { value: "grid", label: "Grade" },
  { value: "diagonal", label: "Diagonal" },
  { value: "cross-hatch", label: "Xadrez" },
  { value: "chevron", label: "Chevron" },
  { value: "hexagon", label: "Hexágonos" },
  { value: "triangles", label: "Triângulos" },
  { value: "waves", label: "Ondas" },
  { value: "bricks", label: "Tijolos" },
  { value: "circles", label: "Círculos" },
  { value: "stars", label: "Estrelas" },
  { value: "diamonds", label: "Diamantes" },
];

const PALETTE_PRESETS = [
  { label: "Noturno", bg: "#0f172a", fg: "#334155" },
  { label: "Azul", bg: "#1e3a5f", fg: "#3b82f6" },
  { label: "Rosa", bg: "#4a0030", fg: "#ec4899" },
  { label: "Verde", bg: "#052e16", fg: "#22c55e" },
  { label: "Dourado", bg: "#451a03", fg: "#d97706" },
  { label: "Roxo", bg: "#2e1065", fg: "#a855f7" },
  { label: "Cinza", bg: "#111827", fg: "#374151" },
  { label: "Branco", bg: "#f9fafb", fg: "#d1d5db" },
];

function buildPatternSVG(type: PatternType, fg: string, size: number): string {
  const s = size;
  switch (type) {
    case "dots":
      return `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 8}" fill="${fg}"/>`;
    case "grid":
      return `<path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${fg}" stroke-width="0.5"/>`;
    case "diagonal":
      return `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${fg}" stroke-width="1"/>`;
    case "cross-hatch":
      return `<line x1="0" y1="${s}" x2="${s}" y2="0" stroke="${fg}" stroke-width="0.5"/>
              <line x1="0" y1="0" x2="${s}" y2="${s}" stroke="${fg}" stroke-width="0.5"/>`;
    case "chevron": {
      const h = s / 2;
      return `<polyline points="0,${h} ${s / 2},0 ${s},${h}" fill="none" stroke="${fg}" stroke-width="1"/>
              <polyline points="0,${s} ${s / 2},${h} ${s},${s}" fill="none" stroke="${fg}" stroke-width="1"/>`;
    }
    case "hexagon": {
      const r = s * 0.45;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${s / 2 + r * Math.cos(a)},${s / 2 + r * Math.sin(a)}`;
      }).join(" ");
      return `<polygon points="${pts}" fill="none" stroke="${fg}" stroke-width="1"/>`;
    }
    case "triangles":
      return `<polygon points="${s / 2},0 ${s},${s} 0,${s}" fill="${fg}" opacity="0.5"/>`;
    case "waves":
      return `<path d="M 0 ${s * 0.5} Q ${s * 0.25} ${s * 0.25} ${s * 0.5} ${s * 0.5} Q ${s * 0.75} ${s * 0.75} ${s} ${s * 0.5}" fill="none" stroke="${fg}" stroke-width="1"/>`;
    case "bricks":
      return `<rect x="0" y="0" width="${s}" height="${s / 2}" fill="none" stroke="${fg}" stroke-width="0.5"/>
              <line x1="${s / 2}" y1="${s / 2}" x2="${s / 2}" y2="${s}" stroke="${fg}" stroke-width="0.5"/>
              <line x1="0" y1="${s / 2}" x2="${s}" y2="${s / 2}" stroke="${fg}" stroke-width="0.5"/>`;
    case "circles":
      return `<circle cx="${s / 2}" cy="${s / 2}" r="${s * 0.35}" fill="none" stroke="${fg}" stroke-width="1"/>`;
    case "stars": {
      const pts2 = Array.from({ length: 10 }, (_, i) => {
        const r2 = i % 2 === 0 ? s * 0.4 : s * 0.18;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${s / 2 + r2 * Math.cos(a)},${s / 2 + r2 * Math.sin(a)}`;
      }).join(" ");
      return `<polygon points="${pts2}" fill="${fg}" opacity="0.6"/>`;
    }
    case "diamonds":
      return `<polygon points="${s / 2},0 ${s},${s / 2} ${s / 2},${s} 0,${s / 2}" fill="none" stroke="${fg}" stroke-width="1"/>`;
    default:
      return `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 8}" fill="${fg}"/>`;
  }
}

export function PatternsPanel({ fabricCanvas }: PatternsPanelProps) {
  const [selected, setSelected] = useState<PatternType>("dots");
  const [bgColor, setBgColor] = useState("#0f172a");
  const [fgColor, setFgColor] = useState("#334155");
  const [patternSize, setPatternSize] = useState(20);
  const [opacity, setOpacity] = useState(100);
  const [applyTo, setApplyTo] = useState<"background" | "selected">("background");

  const applyPattern = useCallback(async () => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);

    const svgInner = buildPatternSVG(selected, fgColor, patternSize);
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${patternSize}" height="${patternSize}">
      <rect width="${patternSize}" height="${patternSize}" fill="${bgColor}"/>
      ${svgInner}
    </svg>`;

    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fabric as any).Image.fromURL(url, (img: any) => {
      URL.revokeObjectURL(url);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pattern = new (fabric as any).Pattern({
        source: img.getElement(),
        repeat: "repeat",
      });

      if (applyTo === "background") {
        fabricCanvas.setBackgroundColor(pattern, () => {
          fabricCanvas.requestRenderAll();
        });
        toast.success(`Padrão "${PATTERNS.find((p) => p.value === selected)?.label}" aplicado ao fundo`);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = fabricCanvas.getActiveObject();
        if (!obj) {
          toast.error("Selecione um elemento primeiro");
          return;
        }
        obj.set({ fill: pattern, opacity: opacity / 100 });
        fabricCanvas.requestRenderAll();
        toast.success("Padrão aplicado ao elemento");
      }
    });
  }, [fabricCanvas, selected, bgColor, fgColor, patternSize, opacity, applyTo]);

  const applyGradientBackground = useCallback(async (preset: typeof PALETTE_PRESETS[0]) => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);
    const w = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const h = fabricCanvas.getHeight() / fabricCanvas.getZoom();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gradient = new (fabric as any).Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: w, y2: h },
      colorStops: [
        { offset: 0, color: preset.bg },
        { offset: 1, color: preset.fg },
      ],
    });

    fabricCanvas.setBackgroundColor(gradient, () => fabricCanvas.requestRenderAll());
    toast.success("Gradiente aplicado ao fundo");
  }, [fabricCanvas]);

  const previewSvg = buildPatternSVG(selected, fgColor, 20);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Padrões e Texturas</span>
      </div>

      {/* Apply to */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
        {[
          { value: "background" as const, label: "Fundo" },
          { value: "selected" as const, label: "Elemento" },
        ].map((o) => (
          <button
            key={o.value}
            onClick={() => setApplyTo(o.value)}
            className={`flex-1 text-[10px] py-1.5 rounded-md transition-colors font-medium ${applyTo === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Pattern grid */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Padrão</span>
        <div className="grid grid-cols-4 gap-1.5">
          {PATTERNS.map((p) => {
            const svg = buildPatternSVG(p.value, fgColor, 20);
            const fullSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="${bgColor}"/>${svg}</svg>`)}`;
            return (
              <button
                key={p.value}
                onClick={() => setSelected(p.value)}
                title={p.label}
                className={`aspect-square rounded border-2 transition-all hover:scale-105 ${selected === p.value ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                style={{ backgroundImage: `url("${fullSvg}")`, backgroundRepeat: "repeat", backgroundSize: "20px" }}
              />
            );
          })}
        </div>
        <span className="text-[9px] text-muted-foreground">
          Selecionado: {PATTERNS.find((p) => p.value === selected)?.label}
        </span>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Cor de Fundo</span>
          <div className="flex items-center gap-1.5">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border" />
            <span className="text-[9px] font-mono text-muted-foreground">{bgColor}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Cor do Padrão</span>
          <div className="flex items-center gap-1.5">
            <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-border" />
            <span className="text-[9px] font-mono text-muted-foreground">{fgColor}</span>
          </div>
        </div>
      </div>

      {/* Pattern size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Escala do Padrão</span>
          <span className="text-[10px] tabular-nums">{patternSize}px</span>
        </div>
        <input
          type="range"
          min={8}
          max={80}
          step={4}
          value={patternSize}
          onChange={(e) => setPatternSize(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex gap-1">
          {[10, 20, 40, 60].map((v) => (
            <button
              key={v}
              onClick={() => setPatternSize(v)}
              className={`flex-1 text-[9px] py-0.5 rounded border transition-colors ${patternSize === v ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {v}px
            </button>
          ))}
        </div>
      </div>

      {/* Opacity (for selected element mode) */}
      {applyTo === "selected" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Opacidade</span>
            <span className="text-[10px] tabular-nums">{opacity}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}

      {/* Preview */}
      <div
        className="rounded-lg border border-border h-16 overflow-hidden"
        style={{
          background: bgColor,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${patternSize}" height="${patternSize}"><rect width="${patternSize}" height="${patternSize}" fill="${bgColor}"/>${previewSvg}</svg>`)}")`,
          backgroundRepeat: "repeat",
          backgroundSize: `${patternSize}px`,
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-[10px] font-medium text-white/50 bg-black/20 px-2 py-1 rounded">Prévia</span>
        </div>
      </div>

      <button
        onClick={applyPattern}
        disabled={!fabricCanvas}
        className="flex items-center justify-center gap-2 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
      >
        Aplicar Padrão {applyTo === "background" ? "ao Fundo" : "ao Elemento"}
      </button>

      {/* Gradient presets */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Gradientes de Fundo</span>
        <div className="grid grid-cols-4 gap-1.5">
          {PALETTE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyGradientBackground(preset)}
              className="aspect-square rounded border border-border hover:border-primary/50 hover:scale-105 transition-all"
              title={preset.label}
              style={{ background: `linear-gradient(135deg, ${preset.bg}, ${preset.fg})` }}
            />
          ))}
        </div>
        <div className="text-[8px] text-muted-foreground text-center">Clique para aplicar gradiente ao fundo</div>
      </div>
    </div>
  );
}
