"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Type, Plus } from "lucide-react";
import { toast } from "sonner";

interface CanvasTextOnImagePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type TextPosition =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

type OverlayStyle = "none" | "dark" | "light" | "gradient-bottom" | "gradient-top" | "blur-band";

interface TextOverlayConfig {
  text: string;
  position: TextPosition;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  overlayStyle: OverlayStyle;
  overlayOpacity: number;
  paddingX: number;
  paddingY: number;
}

const DEFAULT_CONFIG: TextOverlayConfig = {
  text: "Seu Texto Aqui",
  position: "bottom-center",
  fontSize: 32,
  fontFamily: "Arial",
  color: "#ffffff",
  bold: true,
  italic: false,
  overlayStyle: "gradient-bottom",
  overlayOpacity: 0.6,
  paddingX: 20,
  paddingY: 16,
};

const FONT_OPTIONS = ["Arial", "Georgia", "Verdana", "Trebuchet MS", "Impact", "Courier New", "Times New Roman"];

const POSITION_GRID: TextPosition[][] = [
  ["top-left", "top-center", "top-right"],
  ["middle-left", "middle-center", "middle-right"],
  ["bottom-left", "bottom-center", "bottom-right"],
];

function computeXY(
  position: TextPosition,
  objLeft: number,
  objTop: number,
  objW: number,
  objH: number,
  paddingX: number,
  paddingY: number
): { x: number; y: number; originX: string; originY: string } {
  const [vert, horiz] = position.split("-") as [string, string];
  let x = objLeft;
  let y = objTop;
  let originX = "left";
  let originY = "top";

  if (horiz === "center") { x = objLeft + objW / 2; originX = "center"; }
  else if (horiz === "right") { x = objLeft + objW - paddingX; originX = "right"; }
  else { x = objLeft + paddingX; }

  if (vert === "middle") { y = objTop + objH / 2; originY = "center"; }
  else if (vert === "bottom") { y = objTop + objH - paddingY; originY = "bottom"; }
  else { y = objTop + paddingY; }

  return { x, y, originX, originY };
}

function buildOverlayRect(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  style: OverlayStyle,
  objLeft: number,
  objTop: number,
  objW: number,
  objH: number,
  opacity: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | null {
  if (style === "none") return null;

  if (style === "dark") {
    return new f.Rect({
      left: objLeft, top: objTop, width: objW, height: objH,
      fill: `rgba(0,0,0,${opacity})`,
      selectable: false, evented: false,
      data: { textOverlayBg: true },
    });
  }
  if (style === "light") {
    return new f.Rect({
      left: objLeft, top: objTop, width: objW, height: objH,
      fill: `rgba(255,255,255,${opacity})`,
      selectable: false, evented: false,
      data: { textOverlayBg: true },
    });
  }
  if (style === "gradient-bottom") {
    return new f.Rect({
      left: objLeft, top: objTop + objH * 0.5, width: objW, height: objH * 0.5,
      fill: new f.Gradient({
        type: "linear",
        coords: { x1: 0, y1: 0, x2: 0, y2: objH * 0.5 },
        colorStops: [
          { offset: 0, color: "rgba(0,0,0,0)" },
          { offset: 1, color: `rgba(0,0,0,${opacity})` },
        ],
      }),
      selectable: false, evented: false,
      data: { textOverlayBg: true },
    });
  }
  if (style === "gradient-top") {
    return new f.Rect({
      left: objLeft, top: objTop, width: objW, height: objH * 0.5,
      fill: new f.Gradient({
        type: "linear",
        coords: { x1: 0, y1: 0, x2: 0, y2: objH * 0.5 },
        colorStops: [
          { offset: 0, color: `rgba(0,0,0,${opacity})` },
          { offset: 1, color: "rgba(0,0,0,0)" },
        ],
      }),
      selectable: false, evented: false,
      data: { textOverlayBg: true },
    });
  }
  if (style === "blur-band") {
    return new f.Rect({
      left: objLeft, top: objTop + objH * 0.65, width: objW, height: objH * 0.35,
      fill: `rgba(0,0,0,${opacity})`,
      selectable: false, evented: false,
      data: { textOverlayBg: true },
    });
  }
  return null;
}

export function CanvasTextOnImagePanel({ fabricCanvas, selectionVersion }: CanvasTextOnImagePanelProps) {
  const [hasImage, setHasImage] = useState(false);
  const [config, setConfig] = useState<TextOverlayConfig>(DEFAULT_CONFIG);
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasImage(!!obj && (obj.type === "image" || obj.type === "Image"));
    });
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(<K extends keyof TextOverlayConfig>(key: K, val: TextOverlayConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const applyOverlay = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj || (obj.type !== "image" && obj.type !== "Image")) {
      toast.error("Selecione uma imagem no canvas");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const objLeft = obj.left ?? 0;
      const objTop = obj.top ?? 0;
      const objW = obj.getScaledWidth();
      const objH = obj.getScaledHeight();

      const overlay = buildOverlayRect(f, config.overlayStyle, objLeft, objTop, objW, objH, config.overlayOpacity);
      if (overlay) {
        cv.add(overlay);
      }

      const { x, y, originX, originY } = computeXY(
        config.position, objLeft, objTop, objW, objH, config.paddingX, config.paddingY
      );

      const textObj = new f.IText(config.text, {
        left: x,
        top: y,
        fontSize: config.fontSize,
        fontFamily: config.fontFamily,
        fill: config.color,
        fontWeight: config.bold ? "bold" : "normal",
        fontStyle: config.italic ? "italic" : "normal",
        originX,
        originY,
        data: { textOnImage: true },
      });

      cv.add(textObj);
      cv.setActiveObject(textObj);
      cv.requestRenderAll();
      toast.success("Texto adicionado sobre imagem");
    });
  }, [config]);

  const positionLabel = (p: TextPosition) => {
    const map: Record<TextPosition, string> = {
      "top-left": "↖", "top-center": "↑", "top-right": "↗",
      "middle-left": "←", "middle-center": "·", "middle-right": "→",
      "bottom-left": "↙", "bottom-center": "↓", "bottom-right": "↘",
    };
    return map[p];
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto sobre Imagem</span>
      </div>

      {!hasImage ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione uma imagem no canvas</p>
        </div>
      ) : (
        <>
          {/* Text input */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Texto</span>
            <textarea
              value={config.text}
              onChange={(e) => set("text", e.target.value)}
              rows={2}
              className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Position grid */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Posição</span>
            <div className="grid grid-cols-3 gap-0.5 w-24">
              {POSITION_GRID.map((row) =>
                row.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => set("position", pos)}
                    className={`h-7 rounded border text-[10px] transition-colors ${
                      config.position === pos
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {positionLabel(pos)}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Font */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Fonte</span>
            <select
              value={config.fontFamily}
              onChange={(e) => set("fontFamily", e.target.value)}
              className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Size + color */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Tamanho</span>
              <input type="number" min={8} max={120} value={config.fontSize}
                onChange={(e) => set("fontSize", Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Cor</span>
              <div className="flex items-center gap-1">
                <input type="color" value={config.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="w-6 h-5 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{config.color}</span>
              </div>
            </div>
          </div>

          {/* Bold/italic */}
          <div className="flex gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={config.bold}
                onChange={(e) => set("bold", e.target.checked)}
                className="w-3 h-3 accent-primary" />
              <span className="text-[8px] font-bold">Negrito</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={config.italic}
                onChange={(e) => set("italic", e.target.checked)}
                className="w-3 h-3 accent-primary" />
              <span className="text-[8px] italic">Itálico</span>
            </label>
          </div>

          {/* Overlay */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border">
            <span className="text-[8px] font-medium">Fundo sobre imagem</span>
            <div className="grid grid-cols-3 gap-1">
              {(["none", "dark", "light", "gradient-bottom", "gradient-top", "blur-band"] as OverlayStyle[]).map((s) => (
                <button key={s} onClick={() => set("overlayStyle", s)}
                  className={`py-0.5 rounded border text-[7px] transition-colors ${
                    config.overlayStyle === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}>
                  {s === "none" ? "Nenhum" : s === "dark" ? "Escuro" : s === "light" ? "Claro" : s === "gradient-bottom" ? "Grad↓" : s === "gradient-top" ? "Grad↑" : "Banda"}
                </button>
              ))}
            </div>
            {config.overlayStyle !== "none" && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[7px] text-muted-foreground w-16">Opacidade</span>
                <input type="range" min={0.1} max={0.95} step={0.05} value={config.overlayOpacity}
                  onChange={(e) => set("overlayOpacity", Number(e.target.value))}
                  className="flex-1 h-1 accent-primary" />
                <span className="text-[7px] font-mono w-6">{Math.round(config.overlayOpacity * 100)}%</span>
              </div>
            )}
          </div>

          {/* Padding */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-muted-foreground">Padding X</span>
              <input type="number" min={0} max={100} value={config.paddingX}
                onChange={(e) => set("paddingX", Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[7px] text-muted-foreground">Padding Y</span>
              <input type="number" min={0} max={100} value={config.paddingY}
                onChange={(e) => set("paddingY", Number(e.target.value))}
                className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
            </div>
          </div>

          <button onClick={applyOverlay}
            className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
            <Plus className="w-3 h-3" /> <Type className="w-3 h-3" /> Inserir texto
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Fundo e texto são objetos editáveis independentes
          </p>
        </>
      )}
    </div>
  );
}
