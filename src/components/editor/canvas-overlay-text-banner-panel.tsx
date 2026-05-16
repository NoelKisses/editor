"use client";

import { useEffect, useRef, useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasOverlayTextBannerPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BannerMode = "solid" | "striped" | "gradient" | "double";
type BannerPosition = "top" | "middle" | "bottom";

function lightenColor(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function darkenColor(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function computeTop(position: BannerPosition, canvasHeight: number, bannerHeight: number): number {
  if (position === "top") return 0;
  if (position === "bottom") return canvasHeight - bannerHeight;
  return Math.round((canvasHeight - bannerHeight) / 2);
}

function buildStripedPattern(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  bgColor: string,
  width: number,
  height: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const canvasEl = document.createElement("canvas");
  const size = 20;
  canvasEl.width = size;
  canvasEl.height = size;
  const ctx = canvasEl.getContext("2d");
  if (ctx) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = darkenColor(bgColor, 0.25);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-5, size + 5);
    ctx.lineTo(size + 5, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, size / 2 + 5);
    ctx.lineTo(size / 2 + 5, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size / 2 - 5, size + 5);
    ctx.lineTo(size + 5, size / 2 - 5);
    ctx.stroke();
  }
  return new f.Rect({
    left: 0,
    top: 0,
    width,
    height,
    fill: new f.Pattern({ source: canvasEl, repeat: "repeat" }),
    originX: "left",
    originY: "top",
    selectable: false,
  });
}

export function buildBanner(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: any,
  mode: BannerMode,
  w: number,
  h: number,
  bgColor: string,
  textColor: string,
  text: string,
  fontSize: number,
  fontWeight: string,
  letterSpacing: number,
  italic: boolean,
  position: BannerPosition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  if (mode === "solid") {
    parts.push(
      new f.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: bgColor,
        originX: "left",
        originY: "top",
        selectable: false,
      })
    );
  } else if (mode === "striped") {
    parts.push(buildStripedPattern(f, bgColor, w, h));
  } else if (mode === "gradient") {
    parts.push(
      new f.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        originX: "left",
        originY: "top",
        selectable: false,
        fill: new f.Gradient({
          type: "linear",
          coords: { x1: 0, y1: 0, x2: w, y2: 0 },
          colorStops: [
            { offset: 0, color: bgColor },
            { offset: 1, color: lightenColor(bgColor, 0.5) },
          ],
        }),
      })
    );
  } else if (mode === "double") {
    const stripH = Math.max(4, Math.round(h * 0.25));
    parts.push(
      new f.Rect({
        left: 0,
        top: 0,
        width: w,
        height: stripH,
        fill: bgColor,
        originX: "left",
        originY: "top",
        selectable: false,
      })
    );
    parts.push(
      new f.Rect({
        left: 0,
        top: h - stripH,
        width: w,
        height: stripH,
        fill: bgColor,
        originX: "left",
        originY: "top",
        selectable: false,
      })
    );
  }

  const textObj = new f.IText(text, {
    left: w / 2,
    top: h / 2,
    fontSize,
    fontWeight,
    fontStyle: italic ? "italic" : "normal",
    fill: textColor,
    originX: "center",
    originY: "center",
    charSpacing: letterSpacing * 100,
    textAlign: "center",
    selectable: false,
  });
  parts.push(textObj);

  const topPos = computeTop(position, h === 0 ? 0 : h, h);

  const group = new f.Group(parts, {
    left: 0,
    top: topPos,
    originX: "left",
    originY: "top",
    selectable: true,
    hasControls: true,
    data: { overlayBanner: true },
  });

  return group;
}

export function CanvasOverlayTextBannerPanel({ fabricCanvas }: CanvasOverlayTextBannerPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [text, setText] = useState("EM BREVE");
  const [position, setPosition] = useState<BannerPosition>("bottom");
  const [bannerHeight, setBannerHeight] = useState(60);
  const [bgColor, setBgColor] = useState("#ef4444");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(28);
  const [fontWeight, setFontWeight] = useState("bold");
  const [letterSpacing, setLetterSpacing] = useState(2);
  const [italic, setItalic] = useState(false);
  const [mode, setMode] = useState<BannerMode>("solid");

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleInsert = () => {
    if (!canvasRef.current) {
      toast.error("Canvas não disponível");
      return;
    }
    const canvas = canvasRef.current;
    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = (m as any).fabric as any;
        const w = canvas.getWidth();
        const h = canvas.getHeight();

        const group = buildBanner(
          f,
          mode,
          w,
          bannerHeight,
          bgColor,
          textColor,
          text || "EM BREVE",
          fontSize,
          fontWeight,
          letterSpacing,
          italic,
          position
        );

        const topPos = computeTop(position, h, bannerHeight);
        group.set({ left: 0, top: topPos });
        group.setCoords();

        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        toast.success("Banner inserido");
      })
      .catch(() => {
        toast.error("Falha ao carregar fabric");
      });
  };

  const handleRemove = () => {
    if (!canvasRef.current) {
      toast.error("Canvas não disponível");
      return;
    }
    const canvas = canvasRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = canvas.getObjects().filter((o: any) => o?.data?.overlayBanner === true);
    if (toRemove.length === 0) {
      toast.info("Nenhum banner para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} banner(s) removido(s)`);
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4" />
        <h3 className="text-sm font-semibold">Banner Sobreposto</h3>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Texto</span>
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="EM BREVE"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Posição</span>
        <div className="grid grid-cols-3 gap-1">
          <Button
            type="button"
            variant={position === "top" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("top")}
          >
            Topo
          </Button>
          <Button
            type="button"
            variant={position === "middle" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("middle")}
          >
            Meio
          </Button>
          <Button
            type="button"
            variant={position === "bottom" ? "default" : "outline"}
            size="sm"
            onClick={() => setPosition("bottom")}
          >
            Rodapé
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Altura do banner: {bannerHeight}px</span>
        <input
          type="range"
          min={30}
          max={120}
          step={1}
          value={bannerHeight}
          onChange={(e) => setBannerHeight(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Fundo</span>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-full h-9 rounded border"
          />
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Texto</span>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-full h-9 rounded border"
          />
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Tamanho da fonte: {fontSize}px</span>
        <input
          type="range"
          min={16}
          max={60}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Peso da fonte</span>
        <select
          value={fontWeight}
          onChange={(e) => setFontWeight(e.target.value)}
          className="w-full h-9 px-2 rounded border bg-background text-sm"
        >
          <option value="normal">normal</option>
          <option value="bold">bold</option>
          <option value="900">900</option>
        </select>
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Espaçamento entre letras: {letterSpacing}px</span>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Estilo</span>
        <div className="grid grid-cols-2 gap-1">
          <Button
            type="button"
            variant={mode === "solid" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("solid")}
          >
            Sólido
          </Button>
          <Button
            type="button"
            variant={mode === "striped" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("striped")}
          >
            Listrado
          </Button>
          <Button
            type="button"
            variant={mode === "gradient" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("gradient")}
          >
            Gradiente
          </Button>
          <Button
            type="button"
            variant={mode === "double" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("double")}
          >
            Faixa Dupla
          </Button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={italic}
          onChange={(e) => setItalic(e.target.checked)}
        />
        <span>Itálico</span>
      </label>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button type="button" onClick={handleInsert} size="sm">
          Inserir Banner
        </Button>
        <Button type="button" onClick={handleRemove} size="sm" variant="outline">
          Remover Banners
        </Button>
      </div>
    </div>
  );
}
