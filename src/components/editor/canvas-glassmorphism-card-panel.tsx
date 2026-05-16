"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasGlassmorphismCardPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type PresetSize = {
  id: string;
  label: string;
  width: number;
  height: number;
};

type PositionKey = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

const PRESETS: PresetSize[] = [
  { id: "small", label: "Pequeno", width: 300, height: 200 },
  { id: "medium", label: "Médio", width: 500, height: 300 },
  { id: "large", label: "Grande", width: 700, height: 400 },
  { id: "wide", label: "Wide", width: 800, height: 250 },
  { id: "tall", label: "Tall", width: 350, height: 500 },
];

const POSITIONS: { id: PositionKey; label: string }[] = [
  { id: "top-left", label: "Topo Esquerda" },
  { id: "top-right", label: "Topo Direita" },
  { id: "bottom-left", label: "Base Esquerda" },
  { id: "bottom-right", label: "Base Direita" },
  { id: "center", label: "Centro" },
];

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(255,255,255,${a})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function computeCardPosition(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  canvas: any,
  position: string,
  w: number,
  h: number,
): { x: number; y: number } {
  const cw = canvas?.getWidth?.() ?? 1280;
  const ch = canvas?.getHeight?.() ?? 720;
  const margin = 40;
  switch (position) {
    case "top-left":
      return { x: margin, y: margin };
    case "top-right":
      return { x: Math.max(margin, cw - w - margin), y: margin };
    case "bottom-left":
      return { x: margin, y: Math.max(margin, ch - h - margin) };
    case "bottom-right":
      return {
        x: Math.max(margin, cw - w - margin),
        y: Math.max(margin, ch - h - margin),
      };
    case "center":
    default:
      return { x: (cw - w) / 2, y: (ch - h) / 2 };
  }
}

export function CanvasGlassmorphismCardPanel({
  fabricCanvas,
}: CanvasGlassmorphismCardPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [selectedPreset, setSelectedPreset] = useState<string>("medium");
  const [cardColor, setCardColor] = useState<string>("#ffffff");
  const [cardOpacity, setCardOpacity] = useState<number>(0.2);
  const [borderColor, setBorderColor] = useState<string>("#ffffff");
  const [borderOpacity, setBorderOpacity] = useState<number>(0.3);
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [cornerRadius, setCornerRadius] = useState<number>(24);
  const [shadowBlur, setShadowBlur] = useState<number>(30);
  const [highlight, setHighlight] = useState<boolean>(true);
  const [position, setPosition] = useState<PositionKey>("center");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsertCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const preset = PRESETS.find((p) => p.id === selectedPreset) ?? PRESETS[1];
    const { width: w, height: h } = preset;
    const { x, y } = computeCardPosition(canvas, position, w, h);

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        if (!f) {
          toast.error("Fabric não carregado");
          return;
        }

        const baseRect = new f.Rect({
          left: 0,
          top: 0,
          width: w,
          height: h,
          rx: cornerRadius,
          ry: cornerRadius,
          fill: hexToRgba(cardColor, cardOpacity),
          stroke: hexToRgba(borderColor, borderOpacity),
          strokeWidth: borderWidth,
          shadow: new f.Shadow({
            color: hexToRgba("#ffffff", 0.4),
            blur: shadowBlur,
            offsetX: 0,
            offsetY: 0,
          }),
          originX: "left",
          originY: "top",
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parts: any[] = [baseRect];

        if (highlight) {
          const inset = Math.max(2, borderWidth + 2);
          const highlightHeight = Math.max(20, Math.min(h * 0.4, h / 2));
          const highlightRect = new f.Rect({
            left: inset,
            top: inset,
            width: Math.max(1, w - inset * 2),
            height: highlightHeight,
            rx: Math.max(0, cornerRadius - inset),
            ry: Math.max(0, cornerRadius - inset),
            originX: "left",
            originY: "top",
          });
          highlightRect.set(
            "fill",
            new f.Gradient({
              type: "linear",
              coords: { x1: 0, y1: 0, x2: 0, y2: highlightHeight },
              colorStops: [
                { offset: 0, color: "rgba(255,255,255,0.3)" },
                { offset: 1, color: "rgba(255,255,255,0)" },
              ],
            }),
          );
          parts.push(highlightRect);
        }

        const group = new f.Group(parts, {
          left: x,
          top: y,
          originX: "left",
          originY: "top",
          data: { glassCard: true },
        });

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        toast.success("Card glassmorphism inserido");
      })
      .catch(() => {
        toast.error("Falha ao carregar Fabric");
      });
  };

  const handleRemoveCards = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = canvas.getObjects?.() ?? [];
    const toRemove = objs.filter((o) => o?.data?.glassCard === true);
    if (toRemove.length === 0) {
      toast.info("Nenhum card glass para remover");
      return;
    }
    toRemove.forEach((o) => canvas.remove(o));
    canvas.discardActiveObject?.();
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} card(s) removido(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Sparkle className="h-5 w-5" />
        <h3 className="text-base font-semibold">Cards Glassmorphism</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Tamanho</span>
        <div className="flex flex-col gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPreset(p.id)}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition ${
                selectedPreset === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span>{p.label}</span>
              <span className="text-xs text-muted-foreground">
                {p.width}x{p.height}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="glass-card-color">
          Cor do Card
        </label>
        <Input
          id="glass-card-color"
          type="color"
          value={cardColor}
          onChange={(e) => setCardColor(e.target.value)}
          className="h-9 w-full p-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="glass-card-opacity">
          Opacidade do Card: {cardOpacity.toFixed(2)}
        </label>
        <input
          id="glass-card-opacity"
          type="range"
          min={0.05}
          max={0.5}
          step={0.01}
          value={cardOpacity}
          onChange={(e) => setCardOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="glass-border-color">
          Cor da Borda
        </label>
        <Input
          id="glass-border-color"
          type="color"
          value={borderColor}
          onChange={(e) => setBorderColor(e.target.value)}
          className="h-9 w-full p-1"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor="glass-border-opacity"
        >
          Opacidade da Borda: {borderOpacity.toFixed(2)}
        </label>
        <input
          id="glass-border-opacity"
          type="range"
          min={0.1}
          max={0.8}
          step={0.01}
          value={borderOpacity}
          onChange={(e) => setBorderOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="glass-border-width">
          Espessura da Borda: {borderWidth}px
        </label>
        <input
          id="glass-border-width"
          type="range"
          min={1}
          max={4}
          step={1}
          value={borderWidth}
          onChange={(e) => setBorderWidth(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="glass-corner-radius">
          Raio dos Cantos: {cornerRadius}px
        </label>
        <input
          id="glass-corner-radius"
          type="range"
          min={8}
          max={48}
          step={1}
          value={cornerRadius}
          onChange={(e) => setCornerRadius(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="glass-shadow-blur">
          Desfoque da Sombra: {shadowBlur}
        </label>
        <input
          id="glass-shadow-blur"
          type="range"
          min={0}
          max={60}
          step={1}
          value={shadowBlur}
          onChange={(e) => setShadowBlur(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
        <label htmlFor="glass-highlight" className="text-sm">
          Gradiente de Destaque
        </label>
        <input
          id="glass-highlight"
          type="checkbox"
          checked={highlight}
          onChange={(e) => setHighlight(e.target.checked)}
          className="h-4 w-4"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Posição</span>
        <div className="grid grid-cols-2 gap-2">
          {POSITIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPosition(p.id)}
              className={`rounded-md border px-2 py-2 text-xs transition ${
                position === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" onClick={handleInsertCard} className="w-full">
          Inserir Card Glass
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleRemoveCards}
          className="w-full"
        >
          Remover Cards Glass
        </Button>
      </div>
    </div>
  );
}
