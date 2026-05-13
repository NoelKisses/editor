"use client";

import { useCallback, useState } from "react";
import { Frame, Upload } from "lucide-react";
import { toast } from "sonner";

interface PhotoFramesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type FrameShape = "circle" | "rounded" | "diamond" | "star" | "hexagon" | "heart" | "arch" | "square" | "octagon" | "wave";

const FRAME_SHAPES: { value: FrameShape; label: string; path?: string }[] = [
  { value: "circle", label: "Círculo" },
  { value: "rounded", label: "Arredondado" },
  { value: "square", label: "Quadrado" },
  { value: "diamond", label: "Diamante" },
  { value: "hexagon", label: "Hexágono" },
  { value: "octagon", label: "Octógono" },
  { value: "star", label: "Estrela" },
  { value: "heart", label: "Coração" },
  { value: "arch", label: "Arco" },
  { value: "wave", label: "Ondulado" },
];

const BORDER_COLORS = [
  "#ffffff", "#000000", "#6366f1", "#ef4444", "#22c55e",
  "#f59e0b", "#a855f7", "#3b82f6", "#ec4899", "#d97706",
];

const BORDER_STYLES = [
  { value: "solid", label: "Sólida" },
  { value: "dashed", label: "Tracejada" },
  { value: "double", label: "Dupla" },
];

function getClipPath(shape: FrameShape, w: number, h: number): string {
  const cx = w / 2, cy = h / 2;
  switch (shape) {
    case "circle":
      return `M ${cx} 0 A ${cx} ${cy} 0 1 1 ${cx - 0.01} 0 Z`;
    case "rounded":
      return `M ${w * 0.1} 0 L ${w * 0.9} 0 Q ${w} 0 ${w} ${h * 0.1} L ${w} ${h * 0.9} Q ${w} ${h} ${w * 0.9} ${h} L ${w * 0.1} ${h} Q 0 ${h} 0 ${h * 0.9} L 0 ${h * 0.1} Q 0 0 ${w * 0.1} 0 Z`;
    case "square":
      return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
    case "diamond":
      return `M ${cx} 0 L ${w} ${cy} L ${cx} ${h} L 0 ${cy} Z`;
    case "hexagon": {
      const r = Math.min(cx, cy);
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    case "octagon": {
      const s = Math.min(w, h) * 0.293;
      return `M ${s} 0 L ${w - s} 0 L ${w} ${s} L ${w} ${h - s} L ${w - s} ${h} L ${s} ${h} L 0 ${h - s} L 0 ${s} Z`;
    }
    case "star": {
      const outerR = Math.min(cx, cy);
      const innerR = outerR * 0.4;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      });
      return `M ${pts.join(" L ")} Z`;
    }
    case "heart":
      return `M ${cx} ${h * 0.85} C ${cx} ${h * 0.85} ${w * 0.05} ${h * 0.55} ${w * 0.05} ${h * 0.3} C ${w * 0.05} ${h * 0.1} ${w * 0.2} 0 ${cx} ${h * 0.2} C ${w * 0.8} 0 ${w * 0.95} ${h * 0.1} ${w * 0.95} ${h * 0.3} C ${w * 0.95} ${h * 0.55} ${cx} ${h * 0.85} ${cx} ${h * 0.85} Z`;
    case "arch":
      return `M 0 ${h} L 0 ${h * 0.4} A ${cx} ${h * 0.4} 0 1 1 ${w} ${h * 0.4} L ${w} ${h} Z`;
    case "wave":
      return `M 0 ${h * 0.1} Q ${w * 0.25} 0 ${cx} ${h * 0.1} Q ${w * 0.75} ${h * 0.2} ${w} ${h * 0.1} L ${w} ${h * 0.9} Q ${w * 0.75} ${h} ${cx} ${h * 0.9} Q ${w * 0.25} ${h * 0.8} 0 ${h * 0.9} Z`;
    default:
      return `M ${cx} 0 A ${cx} ${cy} 0 1 1 ${cx - 0.01} 0 Z`;
  }
}

export function PhotoFramesPanel({ fabricCanvas }: PhotoFramesPanelProps) {
  const [selectedShape, setSelectedShape] = useState<FrameShape>("circle");
  const [frameSize, setFrameSize] = useState(200);
  const [borderWidth, setBorderWidth] = useState(6);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [shadow, setShadow] = useState(true);
  const [bgColor, setBgColor] = useState("#1f2937");

  const addEmptyFrame = useCallback(async () => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);

    const w = frameSize, h = frameSize;
    const pathData = getClipPath(selectedShape, w, h);

    const dashArray = borderStyle === "dashed" ? [borderWidth * 3, borderWidth * 2] : undefined;

    // Background fill shape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bg = new (fabric as any).Path(pathData, {
      fill: bgColor,
      stroke: borderColor,
      strokeWidth: borderWidth,
      strokeDashArray: dashArray,
      selectable: false,
      evented: false,
    });

    // Placeholder text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const label = new (fabric as any).IText("Arraste uma imagem\nou clique duplo", {
      fontSize: 12,
      fontFamily: "Arial",
      fill: "rgba(255,255,255,0.5)",
      textAlign: "center",
      originX: "center",
      originY: "center",
      left: w / 2,
      top: h / 2,
      selectable: false,
      evented: false,
    });

    const objects: unknown[] = [bg, label];

    // Double border effect
    if (borderStyle === "double" && borderWidth > 2) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const innerBg = new (fabric as any).Path(pathData, {
        fill: "transparent",
        stroke: borderColor,
        strokeWidth: 1,
        scaleX: 0.9,
        scaleY: 0.9,
        left: w * 0.05,
        top: h * 0.05,
        selectable: false,
        evented: false,
      });
      objects.splice(1, 0, innerBg);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const frameShadow = shadow ? new (fabric as any).Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 4, offsetY: 4 }) : undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = new (fabric as any).Group(objects as any[], {
      left: 80,
      top: 80,
      selectable: true,
      evented: true,
      shadow: frameShadow,
      data: { type: "photoFrame", shape: selectedShape, w, h },
    });

    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.requestRenderAll();
    toast.success(`Moldura "${FRAME_SHAPES.find((f) => f.value === selectedShape)?.label}" adicionada`);
  }, [fabricCanvas, selectedShape, frameSize, borderWidth, borderColor, borderStyle, shadow, bgColor]);

  const addImageWithFrame = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !fabricCanvas) return;

      const { fabric } = await import("fabric").then((m) => m);
      const url = URL.createObjectURL(file);
      const w = frameSize, h = frameSize;
      const pathData = getClipPath(selectedShape, w, h);
      const dashArray = borderStyle === "dashed" ? [borderWidth * 3, borderWidth * 2] : undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fabric as any).Image.fromURL(url, (img: any) => {
        URL.revokeObjectURL(url);

        // Scale image to fill frame
        const scaleX = w / img.width;
        const scaleY = h / img.height;
        const scale = Math.max(scaleX, scaleY);
        img.set({ scaleX: scale, scaleY: scale, left: 0, top: 0, selectable: false, evented: false });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clipPath = new (fabric as any).Path(pathData, { absolutePositioned: false });
        img.set({ clipPath });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const border = new (fabric as any).Path(pathData, {
          fill: "transparent",
          stroke: borderColor,
          strokeWidth: borderWidth,
          strokeDashArray: dashArray,
          selectable: false,
          evented: false,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgShadow = shadow ? new (fabric as any).Shadow({ color: "rgba(0,0,0,0.5)", blur: 20, offsetX: 4, offsetY: 4 }) : undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const group = new (fabric as any).Group([img, border] as any[], {
          left: 80,
          top: 80,
          selectable: true,
          evented: true,
          shadow: imgShadow,
          data: { type: "photoFrame", shape: selectedShape },
        });

        fabricCanvas.add(group);
        fabricCanvas.setActiveObject(group);
        fabricCanvas.requestRenderAll();
        toast.success("Foto com moldura adicionada!");
      }, { crossOrigin: "anonymous" });
    };
    input.click();
  }, [fabricCanvas, selectedShape, frameSize, borderWidth, borderColor, borderStyle, shadow]);

  const previewPath = getClipPath(selectedShape, 60, 60);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Frame className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Molduras de Foto</span>
      </div>

      {/* Shape selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Forma da Moldura</span>
        <div className="grid grid-cols-5 gap-1.5">
          {FRAME_SHAPES.map((shape) => {
            const preview = getClipPath(shape.value, 40, 40);
            return (
              <button
                key={shape.value}
                onClick={() => setSelectedShape(shape.value)}
                title={shape.label}
                className={`flex flex-col items-center gap-1 p-1.5 rounded border transition-all ${selectedShape === shape.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
              >
                <svg width="36" height="36" viewBox="0 0 40 40">
                  <path
                    d={preview}
                    fill={selectedShape === shape.value ? "rgba(99,102,241,0.3)" : "rgba(100,116,139,0.2)"}
                    stroke={selectedShape === shape.value ? "#6366f1" : "#475569"}
                    strokeWidth="1.5"
                  />
                </svg>
                <span className="text-[7px] text-muted-foreground leading-tight text-center">{shape.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho</span>
          <span className="text-[10px] tabular-nums">{frameSize}×{frameSize}px</span>
        </div>
        <input
          type="range" min={80} max={400} step={20}
          value={frameSize}
          onChange={(e) => setFrameSize(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex gap-1">
          {[120, 180, 240, 320].map((s) => (
            <button
              key={s}
              onClick={() => setFrameSize(s)}
              className={`flex-1 text-[9px] py-0.5 rounded border transition-colors ${frameSize === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {s}px
            </button>
          ))}
        </div>
      </div>

      {/* Border settings */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Borda</span>
        <div className="grid grid-cols-3 gap-1">
          {BORDER_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setBorderStyle(s.value)}
              className={`text-[9px] py-1.5 rounded border transition-colors ${borderStyle === s.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground w-16">Espessura</span>
          <input
            type="range" min={0} max={20} step={1}
            value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-[10px] tabular-nums w-8">{borderWidth}px</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {BORDER_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setBorderColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${borderColor === c ? "border-primary ring-2 ring-primary/30" : "border-border/40"}`}
              style={{ background: c }}
            />
          ))}
          <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-6 h-6 rounded-full cursor-pointer border border-border" title="Cor personalizada" />
        </div>
      </div>

      {/* BG color (for empty frame) */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Fundo vazio:</span>
        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
        <span className="text-[9px] font-mono text-muted-foreground">{bgColor}</span>
      </div>

      {/* Shadow toggle */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <span className="text-[11px]">Sombra</span>
        <button
          onClick={() => setShadow((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${shadow ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${shadow ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center bg-muted/20 rounded-lg border border-border py-4">
        <svg width="80" height="80" viewBox="0 0 60 60">
          <path
            d={previewPath}
            fill={bgColor}
            stroke={borderColor}
            strokeWidth={Math.max(1, borderWidth * 0.4)}
            strokeDasharray={borderStyle === "dashed" ? "6,3" : undefined}
            filter={shadow ? "drop-shadow(2px 2px 4px rgba(0,0,0,0.5))" : undefined}
          />
        </svg>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={addImageWithFrame}
          disabled={!fabricCanvas}
          className="flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          Carregar Foto com Moldura
        </button>
        <button
          onClick={addEmptyFrame}
          disabled={!fabricCanvas}
          className="flex items-center justify-center gap-2 py-2 bg-muted/30 hover:bg-muted/50 text-foreground border border-border rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
        >
          <Frame className="w-3.5 h-3.5" />
          Adicionar Moldura Vazia
        </button>
      </div>
    </div>
  );
}
