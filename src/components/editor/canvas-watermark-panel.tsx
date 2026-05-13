"use client";

import { useCallback, useEffect, useState } from "react";
import { Droplets, RotateCcw, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface CanvasWatermarkPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "tile";

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "center", label: "Centro" },
  { value: "top-left", label: "Sup. Esq." },
  { value: "top-right", label: "Sup. Dir." },
  { value: "bottom-left", label: "Inf. Esq." },
  { value: "bottom-right", label: "Inf. Dir." },
  { value: "tile", label: "Mosaico" },
];

const WATERMARK_DATA_KEY = "__watermark__";

function calcPosition(
  position: WatermarkPosition,
  cw: number,
  ch: number,
  objW: number,
  objH: number,
  padding: number
): { left: number; top: number } {
  switch (position) {
    case "top-left": return { left: padding, top: padding };
    case "top-right": return { left: cw - objW - padding, top: padding };
    case "bottom-left": return { left: padding, top: ch - objH - padding };
    case "bottom-right": return { left: cw - objW - padding, top: ch - objH - padding };
    default: return { left: (cw - objW) / 2, top: (ch - objH) / 2 };
  }
}

export function CanvasWatermarkPanel({ fabricCanvas }: CanvasWatermarkPanelProps) {
  const [text, setText] = useState("© Meu Design");
  const [fontSize, setFontSize] = useState(24);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.35);
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [angle, setAngle] = useState(0);
  const [padding, setPadding] = useState(20);
  const [tileGap, setTileGap] = useState(120);
  const [hasWatermark, setHasWatermark] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = fabricCanvas.getObjects().find((o: any) => o.data?.isWatermark);
      setHasWatermark(!!existing);
    });
  }, [fabricCanvas]);

  const removeExisting = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = fabricCanvas.getObjects().filter((o: any) => o.data?.isWatermark);
    objs.forEach((o: unknown) => fabricCanvas.remove(o));
  }, [fabricCanvas]);

  const applyWatermark = useCallback(() => {
    if (!fabricCanvas) { toast.error("Canvas não disponível"); return; }
    if (!text.trim()) { toast.error("Digite o texto da marca d'água"); return; }

    removeExisting();

    import("fabric").then(m => {
      const fabric = m.fabric;
      const cw = fabricCanvas.width ?? 800;
      const ch = fabricCanvas.height ?? 600;

      const makeText = (left: number, top: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new (fabric as any).Text(text, {
          left,
          top,
          fontSize,
          fill: color,
          opacity,
          angle,
          selectable: false,
          evented: false,
          data: { isWatermark: true, key: WATERMARK_DATA_KEY },
          fontFamily: "Arial",
        });
      };

      if (position === "tile") {
        // Create tiled watermarks
        for (let y = 0; y < ch + tileGap; y += tileGap + fontSize) {
          for (let x = 0; x < cw + tileGap; x += tileGap + text.length * fontSize * 0.6) {
            const t = makeText(x, y);
            fabricCanvas.add(t);
          }
        }
      } else {
        // Estimate text size (rough approximation)
        const approxW = text.length * fontSize * 0.6;
        const approxH = fontSize;
        const pos = calcPosition(position, cw, ch, approxW, approxH, padding);
        const t = makeText(pos.left, pos.top);
        fabricCanvas.add(t);
      }

      fabricCanvas.requestRenderAll();
      setHasWatermark(true);
      toast.success("Marca d'água adicionada");
    });
  }, [fabricCanvas, text, fontSize, color, opacity, position, angle, padding, tileGap, removeExisting]);

  const doRemove = useCallback(() => {
    removeExisting();
    fabricCanvas?.requestRenderAll();
    setHasWatermark(false);
    toast.success("Marca d'água removida");
  }, [removeExisting, fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Marca d&apos;água</span>
      </div>

      {hasWatermark && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded border border-primary/30 bg-primary/5">
          <span className="text-[9px] text-primary">Marca d&apos;água ativa</span>
          <button onClick={doRemove} className="text-[8px] text-destructive hover:underline">Remover</button>
        </div>
      )}

      {/* Text */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Texto</span>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="© Seu texto aqui"
          className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-primary"
        />
      </div>

      {/* Font size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Tamanho</span>
          <span className="text-[9px] tabular-nums">{fontSize}px</span>
        </div>
        <input type="range" min={8} max={120} step={2} value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Opacity */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Opacidade</span>
          <span className="text-[9px] tabular-nums">{Math.round(opacity * 100)}%</span>
        </div>
        <input type="range" min={0.05} max={1} step={0.05} value={opacity}
          onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Angle */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Rotação</span>
          <span className="text-[9px] tabular-nums">{angle}°</span>
        </div>
        <input type="range" min={-90} max={90} step={5} value={angle}
          onChange={e => setAngle(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Cor</span>
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          className="w-8 h-6 rounded border border-border cursor-pointer" />
        <span className="text-[8px] text-muted-foreground">{color}</span>
      </div>

      {/* Position */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Posição</span>
        <div className="grid grid-cols-3 gap-1">
          {POSITIONS.map(p => (
            <button key={p.value} onClick={() => setPosition(p.value)}
              className={`py-1.5 rounded border text-[8px] font-medium transition-colors ${position === p.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tile gap */}
      {position === "tile" && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Espaçamento mosaico</span>
            <span className="text-[9px] tabular-nums">{tileGap}px</span>
          </div>
          <input type="range" min={20} max={300} step={10} value={tileGap}
            onChange={e => setTileGap(Number(e.target.value))} className="w-full accent-primary h-1" />
        </div>
      )}

      {/* Padding */}
      {position !== "tile" && position !== "center" && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Margem</span>
            <span className="text-[9px] tabular-nums">{padding}px</span>
          </div>
          <input type="range" min={0} max={100} step={5} value={padding}
            onChange={e => setPadding(Number(e.target.value))} className="w-full accent-primary h-1" />
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={doRemove}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-destructive/30 hover:text-destructive transition-colors">
          <RotateCcw className="w-3 h-3" /> Remover
        </button>
        <button onClick={applyWatermark}
          className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors">
          <RefreshCw className="w-3 h-3" /> Aplicar
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        A marca d&apos;água não é selecionável no canvas
      </p>
    </div>
  );
}
