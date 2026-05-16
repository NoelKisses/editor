"use client";

import { useEffect, useRef, useState } from "react";
import { Stamp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ObjectStampWatermarkPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type StampStyle =
  | "aprovado"
  | "visto"
  | "confidencial"
  | "pago"
  | "novo"
  | "vintage";

type Corner = "tl" | "tr" | "bl" | "br" | "center";

interface StampConfig {
  text: string;
  rotation: number;
  opacity: number;
  color: string;
  size: number;
  borderWidth: number;
  position: Corner;
}

const STAMP_STYLES: { id: StampStyle; label: string; defaultText: string; defaultColor: string }[] = [
  { id: "aprovado", label: "APROVADO", defaultText: "APROVADO", defaultColor: "#16a34a" },
  { id: "visto", label: "VISTO", defaultText: "VISTO", defaultColor: "#2563eb" },
  { id: "confidencial", label: "CONFIDENCIAL", defaultText: "CONFIDENCIAL", defaultColor: "#dc2626" },
  { id: "pago", label: "PAGO", defaultText: "PAGO", defaultColor: "#15803d" },
  { id: "novo", label: "NOVO", defaultText: "NOVO", defaultColor: "#eab308" },
  { id: "vintage", label: "VINTAGE", defaultText: "VINTAGE", defaultColor: "#92400e" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computePosition(canvas: any, size: number, corner: Corner): { left: number; top: number } {
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const margin = 20;
  switch (corner) {
    case "tl":
      return { left: margin + size / 2, top: margin + size / 2 };
    case "tr":
      return { left: w - margin - size / 2, top: margin + size / 2 };
    case "bl":
      return { left: margin + size / 2, top: h - margin - size / 2 };
    case "br":
      return { left: w - margin - size / 2, top: h - margin - size / 2 };
    case "center":
    default:
      return { left: w / 2, top: h / 2 };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAprovado(f: any, cfg: StampConfig) {
  const r = cfg.size / 2;
  const outer = new f.Circle({
    radius: r,
    fill: "transparent",
    stroke: cfg.color,
    strokeWidth: cfg.borderWidth,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const inner = new f.Circle({
    radius: r - cfg.borderWidth * 2 - 4,
    fill: "transparent",
    stroke: cfg.color,
    strokeWidth: cfg.borderWidth / 2,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const text = new f.IText(cfg.text.toUpperCase(), {
    fontFamily: "Impact, Arial Black, sans-serif",
    fontSize: cfg.size / 6,
    fill: cfg.color,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    fontWeight: "bold",
  });
  return new f.Group([outer, inner, text], { originX: "center", originY: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVisto(f: any, cfg: StampConfig) {
  const w = cfg.size;
  const h = cfg.size / 2.5;
  const outer = new f.Rect({
    width: w,
    height: h,
    fill: "transparent",
    stroke: cfg.color,
    strokeWidth: cfg.borderWidth,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const inner = new f.Rect({
    width: w - cfg.borderWidth * 4,
    height: h - cfg.borderWidth * 4,
    fill: "transparent",
    stroke: cfg.color,
    strokeWidth: cfg.borderWidth / 2,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const text = new f.IText(cfg.text.toUpperCase(), {
    fontFamily: "Impact, Arial Black, sans-serif",
    fontSize: h / 2,
    fill: cfg.color,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    fontWeight: "bold",
  });
  return new f.Group([outer, inner, text], { originX: "center", originY: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildConfidencial(f: any, cfg: StampConfig) {
  const w = cfg.size * 1.6;
  const h = cfg.size / 3;
  const banner = new f.Rect({
    width: w,
    height: h,
    fill: cfg.color,
    stroke: "#ffffff",
    strokeWidth: cfg.borderWidth,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const text = new f.IText(cfg.text.toUpperCase(), {
    fontFamily: "Impact, Arial Black, sans-serif",
    fontSize: h / 2,
    fill: "#ffffff",
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    fontWeight: "bold",
  });
  return new f.Group([banner, text], { originX: "center", originY: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPago(f: any, cfg: StampConfig) {
  const w = cfg.size;
  const h = cfg.size / 3;
  const pill = new f.Rect({
    width: w,
    height: h,
    fill: cfg.color,
    rx: h / 2,
    ry: h / 2,
    stroke: "#ffffff",
    strokeWidth: cfg.borderWidth,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const bullet = new f.Circle({
    radius: h / 4,
    fill: "#ffffff",
    originX: "center",
    originY: "center",
    left: -w / 2 + h / 1.5,
    top: 0,
  });
  const text = new f.IText(cfg.text.toUpperCase(), {
    fontFamily: "Impact, Arial Black, sans-serif",
    fontSize: h / 2,
    fill: "#ffffff",
    originX: "center",
    originY: "center",
    left: h / 4,
    top: 0,
    fontWeight: "bold",
  });
  return new f.Group([pill, bullet, text], { originX: "center", originY: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildNovo(f: any, cfg: StampConfig) {
  const points: { x: number; y: number }[] = [];
  const spikes = 12;
  const outerR = cfg.size / 2;
  const innerR = outerR * 0.75;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  const star = new f.Polygon(points, {
    fill: cfg.color,
    stroke: "#ffffff",
    strokeWidth: cfg.borderWidth,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const text = new f.IText(cfg.text.toUpperCase(), {
    fontFamily: "Impact, Arial Black, sans-serif",
    fontSize: cfg.size / 5,
    fill: "#ffffff",
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    fontWeight: "bold",
  });
  return new f.Group([star, text], { originX: "center", originY: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildVintage(f: any, cfg: StampConfig) {
  const rx = cfg.size / 2;
  const ry = cfg.size / 3;
  const ellipse = new f.Ellipse({
    rx,
    ry,
    fill: "transparent",
    stroke: cfg.color,
    strokeWidth: cfg.borderWidth,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const inner = new f.Ellipse({
    rx: rx - cfg.borderWidth * 2 - 4,
    ry: ry - cfg.borderWidth * 2 - 4,
    fill: "transparent",
    stroke: cfg.color,
    strokeWidth: cfg.borderWidth / 2,
    strokeDashArray: [4, 3],
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });
  const text = new f.IText(cfg.text.toUpperCase(), {
    fontFamily: "Georgia, serif",
    fontSize: ry / 1.5,
    fill: cfg.color,
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    fontStyle: "italic",
    fontWeight: "bold",
  });
  return new f.Group([ellipse, inner, text], { originX: "center", originY: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildStamp(f: any, style: StampStyle, cfg: StampConfig) {
  switch (style) {
    case "aprovado":
      return buildAprovado(f, cfg);
    case "visto":
      return buildVisto(f, cfg);
    case "confidencial":
      return buildConfidencial(f, cfg);
    case "pago":
      return buildPago(f, cfg);
    case "novo":
      return buildNovo(f, cfg);
    case "vintage":
      return buildVintage(f, cfg);
  }
}

export function ObjectStampWatermarkPanel({ fabricCanvas }: ObjectStampWatermarkPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [style, setStyle] = useState<StampStyle>("aprovado");
  const [text, setText] = useState("APROVADO");
  const [rotation, setRotation] = useState(-15);
  const [opacity, setOpacity] = useState(0.7);
  const [color, setColor] = useState("#16a34a");
  const [size, setSize] = useState(180);
  const [borderWidth, setBorderWidth] = useState(3);
  const [position, setPosition] = useState<Corner>("center");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function handleSelectStyle(s: StampStyle) {
    const meta = STAMP_STYLES.find((x) => x.id === s);
    setStyle(s);
    if (meta) {
      setText(meta.defaultText);
      setColor(meta.defaultColor);
    }
  }

  function applyStamp() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const cfg: StampConfig = { text, rotation, opacity, color, size, borderWidth, position };
      const group = buildStamp(f, style, cfg);
      const pos = computePosition(canvas, size, position);
      group.set({
        left: pos.left,
        top: pos.top,
        angle: rotation,
        opacity,
        originX: "center",
        originY: "center",
        data: { stampWatermark: true },
      });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success("Carimbo aplicado");
    }).catch(() => toast.error("Falha ao carregar fabric"));
  }

  function applyWatermarkPattern() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      const smallSize = Math.max(60, size / 2.5);
      const cfg: StampConfig = {
        text,
        rotation,
        opacity: Math.min(opacity, 0.4),
        color,
        size: smallSize,
        borderWidth: Math.max(1, borderWidth - 1),
        position: "center",
      };
      const stepX = smallSize * 1.8;
      const stepY = smallSize * 1.8;
      let row = 0;
      for (let y = stepY / 2; y < h; y += stepY) {
        const offsetX = row % 2 === 0 ? 0 : stepX / 2;
        for (let x = stepX / 2 + offsetX; x < w; x += stepX) {
          const group = buildStamp(f, style, cfg);
          group.set({
            left: x,
            top: y,
            angle: rotation,
            opacity: Math.min(opacity, 0.4),
            originX: "center",
            originY: "center",
            selectable: false,
            evented: false,
            data: { stampWatermark: true },
          });
          canvas.add(group);
        }
        row++;
      }
      canvas.requestRenderAll();
      toast.success("Marca d'água aplicada");
    }).catch(() => toast.error("Falha ao carregar fabric"));
  }

  function removeStamps() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects = canvas.getObjects().filter((o: any) => o.data && o.data.stampWatermark === true);
    objects.forEach((o: unknown) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${objects.length} carimbo(s) removido(s)`);
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Stamp className="h-5 w-5" />
        <h3 className="font-semibold text-sm">Carimbo & Marca d&apos;Água</h3>
      </div>

      <div>
        <label className="text-xs font-medium block mb-1">Estilo</label>
        <div className="grid grid-cols-2 gap-2">
          {STAMP_STYLES.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={style === s.id ? "default" : "outline"}
              onClick={() => handleSelectStyle(s.id)}
              className="text-xs"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium block mb-1">Texto</label>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="APROVADO" />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1">
          Rotação: {rotation}°
        </label>
        <input
          type="range"
          min={-45}
          max={45}
          step={1}
          value={rotation}
          onChange={(e) => setRotation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1">
          Opacidade: {opacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1">Cor</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-9 rounded border"
        />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1">Tamanho: {size}px</label>
        <input
          type="range"
          min={60}
          max={400}
          step={5}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1">
          Espessura da Borda: {borderWidth}px
        </label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={borderWidth}
          onChange={(e) => setBorderWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium block mb-2">Posição</label>
        <div className="grid grid-cols-3 gap-1 max-w-[180px] mx-auto">
          <Button
            size="sm"
            variant={position === "tl" ? "default" : "outline"}
            onClick={() => setPosition("tl")}
            className="text-xs"
          >
            ↖
          </Button>
          <div />
          <Button
            size="sm"
            variant={position === "tr" ? "default" : "outline"}
            onClick={() => setPosition("tr")}
            className="text-xs"
          >
            ↗
          </Button>
          <div />
          <Button
            size="sm"
            variant={position === "center" ? "default" : "outline"}
            onClick={() => setPosition("center")}
            className="text-xs"
          >
            ●
          </Button>
          <div />
          <Button
            size="sm"
            variant={position === "bl" ? "default" : "outline"}
            onClick={() => setPosition("bl")}
            className="text-xs"
          >
            ↙
          </Button>
          <div />
          <Button
            size="sm"
            variant={position === "br" ? "default" : "outline"}
            onClick={() => setPosition("br")}
            className="text-xs"
          >
            ↘
          </Button>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Button onClick={applyStamp} className="w-full" size="sm">
          Aplicar Carimbo
        </Button>
        <Button onClick={applyWatermarkPattern} className="w-full" size="sm" variant="secondary">
          Adicionar como Marca d&apos;Água Repetida
        </Button>
        <Button onClick={removeStamps} className="w-full" size="sm" variant="destructive">
          Remover Carimbos
        </Button>
      </div>
    </div>
  );
}
