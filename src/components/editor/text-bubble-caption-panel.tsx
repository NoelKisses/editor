"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface TextBubbleCaptionPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BubbleStyle = "rounded-rect" | "sharp-rect" | "cloud" | "thought" | "shout" | "pill";
type TailPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";

interface PanelState {
  text: string;
  fontSize: number;
  bubbleStyle: BubbleStyle;
  bgColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  tailPosition: TailPosition;
}

const DEFAULT_STATE: PanelState = {
  text: "",
  fontSize: 20,
  bubbleStyle: "rounded-rect",
  bgColor: "#ffffff",
  textColor: "#000000",
  borderColor: "#333333",
  borderWidth: 2,
  tailPosition: "bottom-left",
};

const BUBBLE_STYLES: { value: BubbleStyle; label: string; icon: string; rx: number; ry: number }[] = [
  { value: "rounded-rect", label: "Arredondado", icon: "💬", rx: 16, ry: 16 },
  { value: "sharp-rect",   label: "Reto",        icon: "🗨️",  rx: 2,  ry: 2  },
  { value: "cloud",        label: "Nuvem",       icon: "☁️",  rx: 30, ry: 24 },
  { value: "thought",      label: "Pensamento",  icon: "💭", rx: 40, ry: 32 },
  { value: "shout",        label: "Grito",       icon: "💥", rx: 4,  ry: 4  },
  { value: "pill",         label: "Pílula",      icon: "💊", rx: 50, ry: 50 },
];

const TAIL_OPTIONS: { value: TailPosition; label: string }[] = [
  { value: "bottom-left",  label: "↙ Inf. Esq." },
  { value: "bottom-right", label: "↘ Inf. Dir." },
  { value: "top-left",     label: "↖ Sup. Esq." },
  { value: "top-right",    label: "↗ Sup. Dir." },
];

function getTailPoints(
  tailPosition: TailPosition,
  bw: number,
  bh: number
): { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number } {
  const tw = 16;
  const th = 18;
  switch (tailPosition) {
    case "bottom-left":
      return { x1: 20, y1: bh, x2: 20 + tw, y2: bh, x3: 20, y3: bh + th };
    case "bottom-right":
      return { x1: bw - 20 - tw, y1: bh, x2: bw - 20, y2: bh, x3: bw - 20, y3: bh + th };
    case "top-left":
      return { x1: 20, y1: 0, x2: 20 + tw, y2: 0, x3: 20, y3: -th };
    case "top-right":
      return { x1: bw - 20 - tw, y1: 0, x2: bw - 20, y2: 0, x3: bw - 20, y3: -th };
  }
}

export function TextBubbleCaptionPanel({ fabricCanvas }: TextBubbleCaptionPanelProps) {
  const [state, setState] = useState<PanelState>(DEFAULT_STATE);
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const set = useCallback(<K extends keyof PanelState>(key: K, val: PanelState[K]) => {
    setState((prev) => ({ ...prev, [key]: val }));
  }, []);

  const insertBubble = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = canvasRef.current as any;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;

      const bw = 220;
      const bh = 80;
      const styleConf = BUBBLE_STYLES.find((s) => s.value === state.bubbleStyle)!;

      const bubbleRect = new f.Rect({
        left: 0,
        top: 0,
        width: bw,
        height: bh,
        rx: styleConf.rx,
        ry: styleConf.ry,
        fill: state.bgColor,
        stroke: state.borderColor,
        strokeWidth: state.borderWidth,
        originX: "left",
        originY: "top",
      });

      const tailPts = getTailPoints(state.tailPosition, bw, bh);
      const triangle = new f.Polygon(
        [
          { x: tailPts.x1, y: tailPts.y1 },
          { x: tailPts.x2, y: tailPts.y2 },
          { x: tailPts.x3, y: tailPts.y3 },
        ],
        {
          left: 0,
          top: 0,
          fill: state.bgColor,
          stroke: state.borderColor,
          strokeWidth: state.borderWidth,
          originX: "left",
          originY: "top",
        }
      );

      const displayText = state.text.trim() || "Balão de texto";
      const textObj = new f.IText(displayText, {
        left: bw / 2,
        top: bh / 2,
        fontSize: state.fontSize,
        fill: state.textColor,
        fontFamily: "Arial",
        originX: "center",
        originY: "center",
        textAlign: "center",
        width: bw - 24,
      });

      const canvasWidth: number = canvas.getWidth?.() ?? 800;
      const canvasHeight: number = canvas.getHeight?.() ?? 600;

      const group = new f.Group([bubbleRect, triangle, textObj], {
        left: canvasWidth / 2 - bw / 2,
        top: canvasHeight / 2 - bh / 2,
        selectable: true,
        data: { bubbleCaption: true },
      });

      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.requestRenderAll();
      toast.success("Balão inserido no canvas");
    });
  }, [state]);

  const removeBubbles = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas = canvasRef.current as any;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objects: any[] = canvas.getObjects() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = objects.filter((obj: any) => obj?.data?.bubbleCaption === true);
    if (toRemove.length === 0) {
      toast.info("Nenhum balão encontrado");
      return;
    }
    toRemove.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} balão(ões) removido(s)`);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Balão de Texto</span>
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Texto</span>
        <input
          type="text"
          value={state.text}
          onChange={(e) => set("text", e.target.value)}
          placeholder="Digite o texto do balão..."
          className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary"
        />
      </div>

      {/* Font size slider */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">
          Tamanho da fonte: <strong>{state.fontSize}px</strong>
        </span>
        <input
          type="range"
          min={12}
          max={72}
          value={state.fontSize}
          onChange={(e) => set("fontSize", Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Bubble style 2x3 grid */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Estilo do balão</span>
        <div className="grid grid-cols-3 gap-1">
          {BUBBLE_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => set("bubbleStyle", s.value)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded border text-[7px] transition-colors ${
                state.bubbleStyle === s.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span className="text-[14px]">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color pickers */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Cores</span>
        <div className="grid grid-cols-2 gap-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-muted-foreground">Fundo</span>
            <input
              type="color"
              value={state.bgColor}
              onChange={(e) => set("bgColor", e.target.value)}
              className="w-full h-6 rounded border border-border cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] text-muted-foreground">Texto</span>
            <input
              type="color"
              value={state.textColor}
              onChange={(e) => set("textColor", e.target.value)}
              className="w-full h-6 rounded border border-border cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Border color + border width */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Borda</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={state.borderColor}
            onChange={(e) => set("borderColor", e.target.value)}
            className="w-8 h-6 rounded border border-border cursor-pointer flex-shrink-0"
          />
          <div className="flex flex-col gap-0.5 flex-1">
            <span className="text-[7px] text-muted-foreground">
              Espessura: <strong>{state.borderWidth}px</strong>
            </span>
            <input
              type="range"
              min={0}
              max={8}
              value={state.borderWidth}
              onChange={(e) => set("borderWidth", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Tail position */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Posição do rabo</span>
        <div className="grid grid-cols-2 gap-1">
          {TAIL_OPTIONS.map((t) => (
            <button
              key={t.value}
              onClick={() => set("tailPosition", t.value)}
              className={`py-1 rounded border text-[7px] transition-colors ${
                state.tailPosition === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insert button */}
      <button
        onClick={insertBubble}
        className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
      >
        <MessageSquare className="w-3 h-3" />
        Inserir Balão
      </button>

      {/* Remove button */}
      <button
        onClick={removeBubbles}
        className="flex items-center justify-center gap-1 py-1.5 rounded border border-destructive text-destructive text-[9px] font-medium hover:bg-destructive/10 transition-colors"
      >
        Remover Balões
      </button>
    </div>
  );
}
