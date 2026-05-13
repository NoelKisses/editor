"use client";

import { useCallback, useEffect, useState } from "react";
import { Spline, Play } from "lucide-react";
import { toast } from "sonner";

interface TextOnPathPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type PathShape = "circle" | "wave" | "arc-up" | "arc-down" | "zigzag" | "spiral";

const PATH_SHAPES: { value: PathShape; label: string; icon: string; description: string }[] = [
  { value: "circle", label: "Círculo", icon: "○", description: "Texto ao redor de um círculo" },
  { value: "arc-up", label: "Arco ↑", icon: "⌢", description: "Arco curvado para cima" },
  { value: "arc-down", label: "Arco ↓", icon: "⌣", description: "Arco curvado para baixo" },
  { value: "wave", label: "Onda", icon: "∿", description: "Texto em forma de onda" },
  { value: "zigzag", label: "Zigue-Zague", icon: "⋀", description: "Texto em zig-zag" },
  { value: "spiral", label: "Espiral", icon: "🌀", description: "Texto em espiral" },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
const FONT_FAMILIES = [
  "Arial", "Georgia", "Times New Roman", "Trebuchet MS",
  "Verdana", "Impact", "Comic Sans MS", "Courier New",
];

function buildPath(shape: PathShape, radius: number): string {
  const r = radius;
  const cx = r + 20;
  const cy = r + 20;

  switch (shape) {
    case "circle":
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx - r + 0.01} ${cy}`;
    case "arc-up":
      return `M ${cx - r} ${cy + r / 2} Q ${cx} ${cy - r} ${cx + r} ${cy + r / 2}`;
    case "arc-down":
      return `M ${cx - r} ${cy - r / 2} Q ${cx} ${cy + r} ${cx + r} ${cy - r / 2}`;
    case "wave": {
      const amp = r / 3;
      return `M ${cx - r} ${cy} C ${cx - r / 2} ${cy - amp} ${cx} ${cy + amp} ${cx + r / 2} ${cy - amp} S ${cx + r} ${cy} ${cx + r} ${cy}`;
    }
    case "zigzag": {
      const step = r / 2;
      const h = r / 4;
      return `M ${cx - r} ${cy} L ${cx - r + step} ${cy - h} L ${cx - r + step * 2} ${cy + h} L ${cx - r + step * 3} ${cy - h} L ${cx - r + step * 4} ${cy}`;
    }
    case "spiral": {
      const pts = [];
      for (let i = 0; i <= 36; i++) {
        const angle = (i / 36) * Math.PI * 4;
        const spiralR = (r / 2) * (i / 36);
        pts.push(`${cx + spiralR * Math.cos(angle)},${cy + spiralR * Math.sin(angle)}`);
      }
      return `M ${pts.join(" L ")}`;
    }
    default:
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx - r + 0.01} ${cy}`;
  }
}

export function TextOnPathPanel({ fabricCanvas, selectionVersion }: TextOnPathPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [active, setActive] = useState<any>(null);
  const [text, setText] = useState("Escreva aqui seu texto");
  const [pathShape, setPathShape] = useState<PathShape>("circle");
  const [radius, setRadius] = useState(100);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [showPath, setShowPath] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = selectionVersion;

  useEffect(() => {
    const sync = () => {
      if (!fabricCanvas) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setActive(obj ?? null);
      if (obj?.data?.textOnPath) {
        const d = obj.data.textOnPath;
        setText(d.text ?? text);
        setPathShape(d.shape ?? pathShape);
        setRadius(d.radius ?? radius);
        setFontSize(d.fontSize ?? fontSize);
        setFontFamily(d.fontFamily ?? fontFamily);
        setFillColor(d.fill ?? fillColor);
      }
    };
    queueMicrotask(sync);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fabricCanvas, selectionVersion]);

  const createTextOnPath = useCallback(async () => {
    if (!fabricCanvas) return;
    const { fabric } = await import("fabric").then((m) => m);
    const pathData = buildPath(pathShape, radius);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const path = new (fabric as any).Path(pathData, {
      fill: "transparent",
      stroke: showPath ? "#6366f1" : "transparent",
      strokeWidth: 1,
      selectable: false,
      evented: false,
      objectCaching: false,
    });

    // Place characters along the path using path length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pathEl = (path as any).path;
    const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svgPath.setAttribute("d", pathData);
    document.body.appendChild(svgPath);
    const totalLength = svgPath.getTotalLength();
    document.body.removeChild(svgPath);

    const chars = text.split("");
    const charWidth = fontSize * 0.6 + letterSpacing;
    const totalCharWidth = chars.length * charWidth;
    let offset = (totalLength - totalCharWidth) / 2;

    const objects: unknown[] = [path];

    for (const char of chars) {
      const charSvg = document.createElementNS("http://www.w3.org/2000/svg", "path");
      charSvg.setAttribute("d", pathData);
      document.body.appendChild(charSvg);
      const pt = charSvg.getPointAtLength(Math.max(0, Math.min(offset, totalLength)));
      const pt2 = charSvg.getPointAtLength(Math.max(0, Math.min(offset + 1, totalLength)));
      document.body.removeChild(charSvg);

      const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * (180 / Math.PI);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const letter = new (fabric as any).Text(char, {
        left: pt.x,
        top: pt.y,
        fontSize,
        fontFamily,
        fill: fillColor,
        angle,
        originX: "center",
        originY: "bottom",
        selectable: false,
        evented: false,
      });

      objects.push(letter);
      offset += charWidth;
    }

    void pathEl; // mark as used

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const group = new (fabric as any).Group(objects as any[], {
      left: 100,
      top: 100,
      selectable: true,
      evented: true,
      data: {
        type: "textOnPath",
        textOnPath: { text, shape: pathShape, radius, fontSize, fontFamily, fill: fillColor },
      },
    });

    fabricCanvas.add(group);
    fabricCanvas.setActiveObject(group);
    fabricCanvas.requestRenderAll();
    toast.success("Texto em caminho criado!");
  }, [fabricCanvas, text, pathShape, radius, fontSize, fontFamily, fillColor, letterSpacing, showPath]);

  const pathPreviewD = buildPath(pathShape, 50);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Spline className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto em Caminho</span>
      </div>

      {/* Text input */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Texto</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="text-[11px] bg-background border border-border rounded px-2 py-1.5 text-foreground outline-none focus:border-primary/50 resize-none"
        />
      </div>

      {/* Path shape */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Forma do Caminho</span>
        <div className="grid grid-cols-3 gap-1.5">
          {PATH_SHAPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setPathShape(s.value)}
              className={`flex flex-col items-center gap-1 py-2 rounded border transition-all ${pathShape === s.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              title={s.description}
            >
              <svg width="36" height="24" viewBox="0 0 240 160">
                <path d={buildPath(s.value, 60)} fill="none" stroke={pathShape === s.value ? "#6366f1" : "#6b7280"} strokeWidth="3" transform="translate(0,0)" />
              </svg>
              <span className="text-[9px]">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Raio / Tamanho</span>
          <span className="text-[10px] tabular-nums">{radius}px</span>
        </div>
        <input
          type="range"
          min={50}
          max={300}
          step={10}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Font settings */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Fonte</span>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground outline-none focus:border-primary/50"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Tamanho</span>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="text-[10px] bg-background border border-border rounded px-1.5 py-1 text-foreground outline-none focus:border-primary/50"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>
      </div>

      {/* Color and spacing */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Cor do Texto</span>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-full h-8 rounded cursor-pointer border border-border"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-muted-foreground">Espaçamento ({letterSpacing}px)</span>
          <input
            type="range"
            min={-5}
            max={20}
            step={1}
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(Number(e.target.value))}
            className="w-full accent-primary mt-2"
          />
        </div>
      </div>

      {/* Show path toggle */}
      <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
        <span className="text-[11px]">Mostrar Caminho</span>
        <button
          onClick={() => setShowPath((v) => !v)}
          className={`relative w-10 h-5 rounded-full transition-colors ${showPath ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showPath ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      {/* Preview */}
      <div className="bg-muted/20 rounded-lg border border-border p-2">
        <div className="text-[8px] text-muted-foreground mb-1">Prévia do Caminho</div>
        <svg width="100%" height="80" viewBox="0 0 240 160">
          <path d={pathPreviewD} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 2" />
        </svg>
      </div>

      {active && (
        <div className="text-[9px] text-muted-foreground py-1 text-center">
          Elemento selecionado: clique em Criar para substituir
        </div>
      )}

      <button
        onClick={createTextOnPath}
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/40 rounded-lg text-[11px] font-medium transition-colors"
      >
        <Play className="w-3.5 h-3.5" />
        Criar Texto em Caminho
      </button>
    </div>
  );
}
