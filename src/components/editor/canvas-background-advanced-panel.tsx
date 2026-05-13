"use client";

import { useCallback, useState } from "react";
import { ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CanvasBackgroundAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BgMode = "solid" | "gradient" | "pattern" | "image";

const GRADIENT_PRESETS = [
  { name: "Pôr do Sol", stops: [{ offset: 0, color: "#f97316" }, { offset: 1, color: "#ec4899" }] },
  { name: "Oceano", stops: [{ offset: 0, color: "#06b6d4" }, { offset: 1, color: "#3b82f6" }] },
  { name: "Floresta", stops: [{ offset: 0, color: "#22c55e" }, { offset: 1, color: "#14b8a6" }] },
  { name: "Noite", stops: [{ offset: 0, color: "#1e1b4b" }, { offset: 1, color: "#0f172a" }] },
  { name: "Aurora", stops: [{ offset: 0, color: "#a855f7" }, { offset: 1, color: "#3b82f6" }] },
  { name: "Ouro", stops: [{ offset: 0, color: "#f59e0b" }, { offset: 1, color: "#fde68a" }] },
];

const PATTERN_SIZES = [10, 20, 30, 40, 60];
const PATTERN_TYPES = [
  { label: "Grade", value: "grid" },
  { label: "Pontos", value: "dots" },
  { label: "Xadrez", value: "checker" },
  { label: "Linhas H", value: "horizontal" },
  { label: "Linhas V", value: "vertical" },
  { label: "Diagonal", value: "diagonal" },
];

function drawPatternCanvas(type: string, size: number, color: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "transparent";
  ctx.clearRect(0, 0, size, size);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;

  switch (type) {
    case "grid":
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(size, 0);
      ctx.moveTo(0, 0); ctx.lineTo(0, size);
      ctx.stroke();
      break;
    case "dots":
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "checker":
      ctx.fillRect(0, 0, size / 2, size / 2);
      ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
      break;
    case "horizontal":
      ctx.beginPath();
      ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
      ctx.stroke();
      break;
    case "vertical":
      ctx.beginPath();
      ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
      ctx.stroke();
      break;
    case "diagonal":
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(size, size);
      ctx.stroke();
      break;
  }
  return c;
}

export function CanvasBackgroundAdvancedPanel({ fabricCanvas }: CanvasBackgroundAdvancedPanelProps) {
  const [mode, setMode] = useState<BgMode>("solid");
  const [solidColor, setSolidColor] = useState("#ffffff");
  const [grad1, setGrad1] = useState("#6366f1");
  const [grad2, setGrad2] = useState("#ec4899");
  const [gradAngle, setGradAngle] = useState(90);
  const [patternType, setPatternType] = useState("grid");
  const [patternSize, setPatternSize] = useState(20);
  const [patternColor, setPatternColor] = useState("#e2e8f0");
  const [patternBg, setPatternBg] = useState("#0f172a");

  const apply = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import("fabric").then(m => m.fabric);
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();

    if (mode === "solid") {
      fabricCanvas.setBackgroundColor(solidColor, () => fabricCanvas.requestRenderAll());
      toast.success("Fundo sólido aplicado");
      return;
    }

    if (mode === "gradient") {
      const angle = (gradAngle * Math.PI) / 180;
      const x1 = cw / 2 - (Math.cos(angle) * cw) / 2;
      const y1 = ch / 2 - (Math.sin(angle) * ch) / 2;
      const x2 = cw / 2 + (Math.cos(angle) * cw) / 2;
      const y2 = ch / 2 + (Math.sin(angle) * ch) / 2;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const grad = new (fabric as any).Gradient({
        type: "linear",
        coords: { x1, y1, x2, y2 },
        colorStops: [
          { offset: 0, color: grad1 },
          { offset: 1, color: grad2 },
        ],
      });
      fabricCanvas.setBackgroundColor(grad, () => fabricCanvas.requestRenderAll());
      toast.success("Gradiente aplicado");
      return;
    }

    if (mode === "pattern") {
      const patCanvas = drawPatternCanvas(patternType, patternSize, patternColor);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pat = new (fabric as any).Pattern({
        source: patCanvas,
        repeat: "repeat",
      });
      fabricCanvas.setBackgroundColor(patternBg, () => {
        fabricCanvas.setBackgroundColor(pat, () => fabricCanvas.requestRenderAll());
      });
      toast.success("Padrão aplicado");
    }
  }, [fabricCanvas, mode, solidColor, grad1, grad2, gradAngle, patternType, patternSize, patternColor, patternBg]);

  const applyGradientPreset = useCallback((preset: typeof GRADIENT_PRESETS[0]) => {
    setMode("gradient");
    setGrad1(preset.stops[0].color);
    setGrad2(preset.stops[1].color);
    toast.success(`Preset "${preset.name}" selecionado — clique em Aplicar`);
  }, []);

  const clearBackground = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.setBackgroundColor("", () => fabricCanvas.requestRenderAll());
    toast.success("Fundo removido");
  }, [fabricCanvas]);

  const MODES: { label: string; value: BgMode }[] = [
    { label: "Sólido", value: "solid" },
    { label: "Gradiente", value: "gradient" },
    { label: "Padrão", value: "pattern" },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Fundo Avançado</span>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1">
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`flex-1 py-1.5 rounded border text-[10px] transition-colors ${mode === m.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "solid" && (
        <div className="flex flex-col gap-2">
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Cor do fundo</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={solidColor}
              onChange={e => setSolidColor(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer border border-border"
            />
            <input
              type="text"
              value={solidColor}
              onChange={e => setSolidColor(e.target.value)}
              className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {["#ffffff", "#000000", "#1e1b4b", "#0f172a", "#f8fafc", "#fef2f2", "#f0fdf4", "#eff6ff"].map(c => (
              <button
                key={c}
                onClick={() => setSolidColor(c)}
                className="w-6 h-6 rounded-sm border border-border/50 hover:scale-110 transition-transform"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {mode === "gradient" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[9px] text-muted-foreground">Cor 1</span>
              <input type="color" value={grad1} onChange={e => setGrad1(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-border" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-[9px] text-muted-foreground">Cor 2</span>
              <input type="color" value={grad2} onChange={e => setGrad2(e.target.value)} className="w-full h-8 rounded cursor-pointer border border-border" />
            </div>
          </div>
          <div
            className="w-full h-8 rounded border border-border"
            style={{ background: `linear-gradient(${gradAngle}deg, ${grad1}, ${grad2})` }}
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Ângulo</span>
              <span className="text-[9px] tabular-nums">{gradAngle}°</span>
            </div>
            <input type="range" min={0} max={360} step={5} value={gradAngle} onChange={e => setGradAngle(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-3 gap-1">
              {GRADIENT_PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => applyGradientPreset(p)}
                  className="h-8 rounded border border-border/50 hover:scale-105 transition-transform text-[8px] text-white/80 font-medium"
                  style={{ background: `linear-gradient(135deg, ${p.stops[0].color}, ${p.stops[1].color})` }}
                  title={p.name}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "pattern" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Tipo de Padrão</span>
            <div className="grid grid-cols-3 gap-1">
              {PATTERN_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setPatternType(t.value)}
                  className={`py-1.5 rounded border text-[9px] transition-colors ${patternType === t.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Tamanho da célula</span>
              <span className="text-[9px] tabular-nums">{patternSize}px</span>
            </div>
            <div className="flex gap-1">
              {PATTERN_SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setPatternSize(s)}
                  className={`flex-1 py-1 rounded border text-[9px] transition-colors ${patternSize === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground">Cor do padrão</span>
              <input type="color" value={patternColor} onChange={e => setPatternColor(e.target.value)} className="w-full h-7 rounded cursor-pointer border border-border" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground">Fundo base</span>
              <input type="color" value={patternBg} onChange={e => setPatternBg(e.target.value)} className="w-full h-7 rounded cursor-pointer border border-border" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={apply}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Aplicar
        </button>
        <button
          onClick={clearBackground}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
        >
          <ImageIcon className="w-3 h-3" /> Limpar
        </button>
      </div>
    </div>
  );
}
