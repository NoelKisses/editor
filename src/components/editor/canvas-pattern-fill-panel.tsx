"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Grid3X3 } from "lucide-react";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CanvasPatternFillPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type PatternType =
  | "stripes"
  | "dots"
  | "checkerboard"
  | "zigzag"
  | "diamonds"
  | "hexagons"
  | "crosshatch"
  | "waves";

const PATTERN_TYPES: { value: PatternType; label: string }[] = [
  { value: "stripes", label: "Listras" },
  { value: "dots", label: "Pontos" },
  { value: "checkerboard", label: "Xadrez" },
  { value: "zigzag", label: "Zigzag" },
  { value: "diamonds", label: "Diamantes" },
  { value: "hexagons", label: "Hexágonos" },
  { value: "crosshatch", label: "Cruzado" },
  { value: "waves", label: "Ondas" },
];

function generatePatternCanvas(
  type: PatternType,
  scale: number,
  rotation: number,
  color1: string,
  color2: string
): HTMLCanvasElement {
  const base = Math.round(20 * scale);
  const size = Math.max(base, 8);
  const offscreen = document.createElement("canvas");
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext("2d")!;

  // Background
  ctx.fillStyle = color2;
  ctx.fillRect(0, 0, size, size);

  // Apply rotation around center
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.fillStyle = color1;
  ctx.strokeStyle = color1;
  ctx.lineWidth = Math.max(1, size * 0.08);

  switch (type) {
    case "stripes": {
      const stripeW = size / 2;
      ctx.fillRect(0, 0, stripeW, size);
      break;
    }
    case "dots": {
      const r = size * 0.22;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "checkerboard": {
      const h = size / 2;
      ctx.fillRect(0, 0, h, h);
      ctx.fillRect(h, h, h, h);
      break;
    }
    case "zigzag": {
      const seg = size / 4;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(seg, 0);
      ctx.lineTo(seg * 2, cy);
      ctx.lineTo(seg * 3, 0);
      ctx.lineTo(size, cy);
      ctx.stroke();
      break;
    }
    case "diamonds": {
      ctx.beginPath();
      ctx.moveTo(cx, size * 0.1);
      ctx.lineTo(size * 0.9, cy);
      ctx.lineTo(cx, size * 0.9);
      ctx.lineTo(size * 0.1, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "hexagons": {
      const r2 = size * 0.38;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r2 * Math.cos(angle);
        const y = cy + r2 * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case "crosshatch": {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(0, size);
      ctx.stroke();
      break;
    }
    case "waves": {
      const amp = size * 0.18;
      const freq = (Math.PI * 2) / size;
      ctx.beginPath();
      for (let x = 0; x <= size; x++) {
        const y = cy + amp * Math.sin(freq * x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
  return offscreen;
}

export function CanvasPatternFillPanel({ fabricCanvas }: CanvasPatternFillPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const [selectedCount, setSelectedCount] = useState(0);
  const [patternType, setPatternType] = useState<PatternType>("stripes");
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [color1, setColor1] = useState("#000000");
  const [color2, setColor2] = useState("#ffffff");

  // Sync canvasRef without triggering re-renders
  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Update selection count when canvas or selection changes
  useEffect(() => {
    if (!fabricCanvas) return;
    const updateCount = () => {
      queueMicrotask(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active: any = fabricCanvas.getActiveObject();
        if (!active) {
          setSelectedCount(0);
        } else if (active.type === "activeSelection") {
          setSelectedCount(active.getObjects().length);
        } else {
          setSelectedCount(1);
        }
      });
    };
    fabricCanvas.on("selection:created", updateCount);
    fabricCanvas.on("selection:updated", updateCount);
    fabricCanvas.on("selection:cleared", updateCount);
    updateCount();
    return () => {
      fabricCanvas.off("selection:created", updateCount);
      fabricCanvas.off("selection:updated", updateCount);
      fabricCanvas.off("selection:cleared", updateCount);
    };
  }, [fabricCanvas]);

  // Update pattern preview canvas
  useEffect(() => {
    const previewEl = previewRef.current;
    if (!previewEl) return;
    const patternCanvas = generatePatternCanvas(patternType, scale, rotation, color1, color2);
    const ctx = previewEl.getContext("2d")!;
    const pw = previewCanvas(patternCanvas, previewEl.width, previewEl.height);
    ctx.clearRect(0, 0, previewEl.width, previewEl.height);
    ctx.drawImage(pw, 0, 0);
  }, [patternType, scale, rotation, color1, color2]);

  const applyPattern = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione um objeto no canvas");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targets: any[] = active.type === "activeSelection" ? active.getObjects() : [active];

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      const patternCanvas = generatePatternCanvas(patternType, scale, rotation, color1, color2);

      const pattern = new f.Pattern({
        source: patternCanvas,
        repeat: "repeat",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      targets.forEach((obj: any) => {
        obj.set({ fill: pattern });
        obj.setCoords();
      });

      canvas.requestRenderAll();
      toast.success(`Padrão "${patternType}" aplicado a ${targets.length} objeto(s)`);
    });
  }, [patternType, scale, rotation, color1, color2]);

  const removeFill = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any = canvas.getActiveObject();
    if (!active) {
      toast.error("Selecione um objeto no canvas");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targets: any[] = active.type === "activeSelection" ? active.getObjects() : [active];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targets.forEach((obj: any) => {
      obj.set({ fill: "" });
      obj.setCoords();
    });

    canvas.requestRenderAll();
    toast.success(`Preenchimento removido de ${targets.length} objeto(s)`);
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Grid3X3 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Preenchimento com Padrão</span>
      </div>

      {/* Selection info */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">
          {selectedCount === 0
            ? "Nenhum objeto selecionado"
            : `${selectedCount} objeto(s) selecionado(s)`}
        </span>
        {selectedCount > 0 && (
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
            {selectedCount}
          </span>
        )}
      </div>

      {/* Pattern type selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de Padrão</span>
        <div className="grid grid-cols-4 gap-1">
          {PATTERN_TYPES.map((p) => (
            <button
              key={p.value}
              onClick={() => setPatternType(p.value)}
              className={`py-1.5 rounded border text-[8px] transition-colors ${
                patternType === p.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scale slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Escala</span>
          <span className="text-[10px] tabular-nums">{scale.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={5}
          step={0.1}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex justify-between text-[8px] text-muted-foreground">
          <span>0.5x</span>
          <span>5x</span>
        </div>
      </div>

      {/* Rotation slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Rotação</span>
          <span className="text-[10px] tabular-nums">{rotation}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex justify-between text-[8px] text-muted-foreground">
          <span>0°</span>
          <span>360°</span>
        </div>
      </div>

      {/* Color pickers */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground">Cor Primária</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={color1}
              onChange={(e) => setColor1(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer bg-transparent"
            />
            <span className="text-[8px] font-mono text-muted-foreground">{color1}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground">Cor Secundária</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={color2}
              onChange={(e) => setColor2(e.target.value)}
              className="w-7 h-6 rounded border border-border cursor-pointer bg-transparent"
            />
            <span className="text-[8px] font-mono text-muted-foreground">{color2}</span>
          </div>
        </div>
      </div>

      {/* Pattern preview */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pré-visualização</span>
        <div className="flex items-center gap-2">
          <canvas
            ref={previewRef}
            width={60}
            height={60}
            className="rounded border border-border"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="text-[9px] text-muted-foreground">
            Padrão <strong className="text-foreground">{PATTERN_TYPES.find((p) => p.value === patternType)?.label}</strong> com escala {scale.toFixed(1)}x e rotação {rotation}°
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={applyPattern}
          disabled={selectedCount === 0}
          className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Grid3X3 className="w-3 h-3" />
          Aplicar Padrão
        </button>
        <button
          onClick={removeFill}
          disabled={selectedCount === 0}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-destructive/40 hover:text-destructive transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Remover Preenchimento
        </button>
      </div>
    </div>
  );
}

// --- module-level helper: tile the pattern canvas to fill a preview area ---
function previewCanvas(pattern: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;
  const pw = pattern.width;
  const ph = pattern.height;
  for (let x = 0; x < w; x += pw) {
    for (let y = 0; y < h; y += ph) {
      ctx.drawImage(pattern, x, y);
    }
  }
  return out;
}
