"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";

interface CanvasSpeechBubblePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BubbleStyle = "speech" | "thought" | "shout" | "whisper" | "cloud" | "rectangular";
type TailPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right" | "left" | "right";

interface BubbleConfig {
  style: BubbleStyle;
  text: string;
  fillColor: string;
  strokeColor: string;
  textColor: string;
  strokeWidth: number;
  fontSize: number;
  tailPosition: TailPosition;
  width: number;
  height: number;
  posX: number;
  posY: number;
  cornerRadius: number;
}

const DEFAULT_CONFIG: BubbleConfig = {
  style: "speech",
  text: "Olá! Como posso ajudar?",
  fillColor: "#ffffff",
  strokeColor: "#333333",
  textColor: "#222222",
  strokeWidth: 2,
  fontSize: 16,
  tailPosition: "bottom-left",
  width: 200,
  height: 80,
  posX: 80,
  posY: 80,
  cornerRadius: 16,
};

const STYLE_OPTIONS: { value: BubbleStyle; label: string; icon: string }[] = [
  { value: "speech", label: "Fala", icon: "💬" },
  { value: "thought", label: "Pensamento", icon: "💭" },
  { value: "shout", label: "Grito", icon: "📢" },
  { value: "whisper", label: "Sussurro", icon: "🗣" },
  { value: "cloud", label: "Nuvem", icon: "☁" },
  { value: "rectangular", label: "Retangular", icon: "⬜" },
];

const TAIL_OPTIONS: { value: TailPosition; label: string }[] = [
  { value: "bottom-left", label: "↙ Inf. Esq." },
  { value: "bottom-right", label: "↘ Inf. Dir." },
  { value: "top-left", label: "↖ Sup. Esq." },
  { value: "top-right", label: "↗ Sup. Dir." },
  { value: "left", label: "← Esq." },
  { value: "right", label: "→ Dir." },
];

const COLOR_PRESETS: { fill: string; stroke: string; text: string }[] = [
  { fill: "#ffffff", stroke: "#333333", text: "#222222" },
  { fill: "#000000", stroke: "#ffffff", text: "#ffffff" },
  { fill: "#ffd93d", stroke: "#e6b800", text: "#333333" },
  { fill: "#6bcb77", stroke: "#3a9e47", text: "#ffffff" },
  { fill: "#4d96ff", stroke: "#1a6fe8", text: "#ffffff" },
  { fill: "#ff6b6b", stroke: "#e63939", text: "#ffffff" },
];

function buildBubbleSVGPath(style: BubbleStyle, w: number, h: number, tail: TailPosition, r: number): string {
  const tw = 20;
  const th = 18;

  if (style === "rectangular") {
    return `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
  }

  if (style === "thought") {
    return `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
  }

  if (style === "shout") {
    const cx = w / 2;
    const cy = h / 2;
    let path = `M ${cx},0`;
    const spikes = 8;
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const radius = i % 2 === 0 ? Math.min(cx, cy) : Math.min(cx, cy) * 0.75;
      path += ` L ${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }
    return path + " Z";
  }

  let tailPath = "";
  const my = h / 2;

  if (tail === "bottom-left") {
    tailPath = ` L ${r + tw * 2},${h} L ${r + tw},${h + th} L ${r + tw * 0.5},${h}`;
  } else if (tail === "bottom-right") {
    tailPath = ` L ${w - r - tw * 0.5},${h} L ${w - r - tw},${h + th} L ${w - r - tw * 2},${h}`;
  } else if (tail === "top-left") {
    tailPath = ` L ${r + tw * 0.5},0 L ${r + tw},${-th} L ${r + tw * 2},0`;
  } else if (tail === "top-right") {
    tailPath = ` L ${w - r - tw * 2},0 L ${w - r - tw},${-th} L ${w - r - tw * 0.5},0`;
  } else if (tail === "left") {
    tailPath = ` M 0,${my - tw * 0.5} L ${-th},${my} L 0,${my + tw * 0.5}`;
  } else if (tail === "right") {
    tailPath = ` M ${w},${my - tw * 0.5} L ${w + th},${my} L ${w},${my + tw * 0.5}`;
  }

  return `M ${r},0 L ${w - r},0 Q ${w},0 ${w},${r} L ${w},${h - r} Q ${w},${h} ${w - r},${h}${tailPath} L ${r},${h} Q 0,${h} 0,${h - r} L 0,${r} Q 0,0 ${r},0 Z`;
}

export function CanvasSpeechBubblePanel({ fabricCanvas }: CanvasSpeechBubblePanelProps) {
  const [config, setConfig] = useState<BubbleConfig>(DEFAULT_CONFIG);
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const set = useCallback(<K extends keyof BubbleConfig>(key: K, val: BubbleConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const insertBubble = useCallback(() => {
    const canvas = canvasRef.current as typeof fabricCanvas;
    if (!canvas) { toast.error("Canvas não disponível"); return; }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const { style, text, fillColor, strokeColor, textColor, strokeWidth, fontSize, tailPosition, width, height, posX, posY, cornerRadius } = config;

      const pathData = buildBubbleSVGPath(style, width, height, tailPosition, cornerRadius);

      const bubble = new f.Path(pathData, {
        left: posX,
        top: posY,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth,
        selectable: true,
        data: { speechBubble: true, bubbleStyle: style },
      });

      const textObj = new f.IText(text, {
        left: posX + width / 2,
        top: posY + height / 2,
        fontSize,
        fill: textColor,
        fontFamily: "Arial",
        originX: "center",
        originY: "center",
        textAlign: "center",
        data: { speechBubbleText: true },
      });

      canvas.add(bubble);
      canvas.add(textObj);

      // Group bubble + text
      const group = new f.Group([bubble, textObj], {
        left: posX,
        top: posY,
        selectable: true,
      });
      canvas.remove(bubble);
      canvas.remove(textObj);
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success(`Balão "${STYLE_OPTIONS.find((s) => s.value === style)?.label}" inserido`);
    });
  }, [config]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Balão de Fala</span>
      </div>

      {/* Style */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Estilo</span>
        <div className="grid grid-cols-3 gap-1">
          {STYLE_OPTIONS.map((s) => (
            <button key={s.value} onClick={() => set("style", s.value)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded border text-[7px] transition-colors ${
                config.style === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              <span className="text-[14px]">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Texto</span>
        <textarea value={config.text} onChange={(e) => set("text", e.target.value)}
          rows={2} className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary resize-none" />
      </div>

      {/* Color presets */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Esquema de cores</span>
        <div className="flex gap-1">
          {COLOR_PRESETS.map((p, i) => (
            <button key={i} onClick={() => setConfig((prev) => ({ ...prev, fillColor: p.fill, strokeColor: p.stroke, textColor: p.text }))}
              className="w-8 h-6 rounded border border-border hover:border-primary transition-colors"
              style={{ background: p.fill, border: `2px solid ${p.stroke}` }}
              title={`Fill: ${p.fill}`} />
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-3 gap-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Fundo</span>
          <input type="color" value={config.fillColor} onChange={(e) => set("fillColor", e.target.value)}
            className="w-full h-5 rounded border border-border cursor-pointer" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Borda</span>
          <input type="color" value={config.strokeColor} onChange={(e) => set("strokeColor", e.target.value)}
            className="w-full h-5 rounded border border-border cursor-pointer" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Texto</span>
          <input type="color" value={config.textColor} onChange={(e) => set("textColor", e.target.value)}
            className="w-full h-5 rounded border border-border cursor-pointer" />
        </div>
      </div>

      {/* Tail position */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Posição do rabo</span>
        <div className="grid grid-cols-3 gap-1">
          {TAIL_OPTIONS.map((t) => (
            <button key={t.value} onClick={() => set("tailPosition", t.value)}
              className={`py-0.5 rounded border text-[7px] transition-colors ${
                config.tailPosition === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Largura</span>
          <input type="number" min={60} max={600} value={config.width}
            onChange={(e) => set("width", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Altura</span>
          <input type="number" min={40} max={400} value={config.height}
            onChange={(e) => set("height", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Fonte px</span>
          <input type="number" min={8} max={80} value={config.fontSize}
            onChange={(e) => set("fontSize", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Raio canto</span>
          <input type="number" min={0} max={40} value={config.cornerRadius}
            onChange={(e) => set("cornerRadius", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Pos X</span>
          <input type="number" min={0} max={2000} value={config.posX}
            onChange={(e) => set("posX", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[7px] text-muted-foreground">Pos Y</span>
          <input type="number" min={0} max={2000} value={config.posY}
            onChange={(e) => set("posY", Number(e.target.value))}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
        </div>
      </div>

      <button onClick={insertBubble}
        className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
        <Plus className="w-3 h-3" /> <MessageCircle className="w-3 h-3" /> Inserir balão
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Balão agrupado com o texto · duplo clique para editar
      </p>
    </div>
  );
}
