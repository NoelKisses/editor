"use client";

import { useCallback, useState } from "react";
import { Shapes, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectTextOnShapePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type PathShape = "circle" | "wave" | "arc-up" | "arc-down" | "diagonal";

const PATH_SHAPES: { value: PathShape; label: string }[] = [
  { value: "circle", label: "Círculo" },
  { value: "arc-up", label: "Arco cima" },
  { value: "arc-down", label: "Arco baixo" },
  { value: "wave", label: "Onda" },
  { value: "diagonal", label: "Diagonal" },
];

const SHAPE_TAG = "__textOnShape__";

function buildPath(shape: PathShape, cx: number, cy: number, r: number): string {
  switch (shape) {
    case "circle":
      return `M ${cx - r},${cy} A ${r},${r} 0 1,1 ${cx + r},${cy} A ${r},${r} 0 1,1 ${cx - r},${cy}`;
    case "arc-up":
      return `M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`;
    case "arc-down":
      return `M ${cx - r},${cy} A ${r},${r} 0 0,0 ${cx + r},${cy}`;
    case "wave": {
      const w = r * 2;
      return `M ${cx - r},${cy} C ${cx - r + w * 0.25},${cy - 30} ${cx - r + w * 0.5},${cy + 30} ${cx},${cy} C ${cx + w * 0.25},${cy - 30} ${cx + r},${cy + 30} ${cx + r},${cy}`;
    }
    case "diagonal":
      return `M ${cx - r},${cy + r * 0.5} L ${cx + r},${cy - r * 0.5}`;
    default:
      return "";
  }
}

export function ObjectTextOnShapePanel({ fabricCanvas }: ObjectTextOnShapePanelProps) {
  const [text, setText] = useState("Seu texto aqui");
  const [shape, setShape] = useState<PathShape>("circle");
  const [radius, setRadius] = useState(80);
  const [fontSize, setFontSize] = useState(16);
  const [color, setColor] = useState("#ffffff");
  const [centerX, setCenterX] = useState(200);
  const [centerY, setCenterY] = useState(200);
  const [showPath, setShowPath] = useState(false);

  const applyTextOnShape = useCallback(() => {
    if (!fabricCanvas) return;
    if (!text.trim()) { toast.error("Digite um texto"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      // Remove old text-on-shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fabricCanvas.getObjects().filter((o: any) => o.data?.[SHAPE_TAG]).forEach((o: unknown) => fabricCanvas.remove(o));

      const pathData = buildPath(shape, centerX, centerY, radius);

      const textPath = new f.Text(text, {
        path: new f.Path(pathData),
        fontSize,
        fill: color,
        fontFamily: "sans-serif",
        selectable: true,
        data: { [SHAPE_TAG]: true },
      });

      if (showPath) {
        const pathObj = new f.Path(pathData, {
          fill: "transparent",
          stroke: color + "44",
          strokeWidth: 1,
          selectable: false,
          evented: false,
          data: { [SHAPE_TAG]: true },
        });
        fabricCanvas.add(pathObj);
      }

      fabricCanvas.add(textPath);
      fabricCanvas.setActiveObject(textPath);
      fabricCanvas.requestRenderAll();
      toast.success(`Texto na forma "${shape}" aplicado`);
    });
  }, [fabricCanvas, text, shape, radius, fontSize, color, centerX, centerY, showPath]);

  const removeTextOnShape = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().filter((o: any) => o.data?.[SHAPE_TAG]).forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas.requestRenderAll();
    toast.success("Texto na forma removido");
  }, [fabricCanvas]);

  const pickCenter = useCallback(() => {
    if (!fabricCanvas) return;
    toast.success("Clique no canvas para definir o centro");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      const pt = e.absolutePointer ?? e.pointer;
      if (pt) {
        setCenterX(Math.round(pt.x));
        setCenterY(Math.round(pt.y));
      }
      fabricCanvas.off("mouse:down", handler);
    };
    fabricCanvas.on("mouse:down", handler);
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Shapes className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Texto na Forma</span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Texto</span>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
          className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary resize-none" />
      </div>

      {/* Shape */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Forma</span>
        <div className="flex flex-col gap-0.5">
          {PATH_SHAPES.map(s => (
            <button key={s.value} onClick={() => setShape(s.value)}
              className={`py-1 px-2 rounded border text-left text-[8px] transition-colors ${shape === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Radius */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Raio</span>
          <span className="text-[9px] tabular-nums">{radius}px</span>
        </div>
        <input type="range" min={30} max={200} step={10} value={radius}
          onChange={e => setRadius(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Font size */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground">Tamanho da fonte</span>
          <span className="text-[9px] tabular-nums">{fontSize}px</span>
        </div>
        <input type="range" min={8} max={36} step={2} value={fontSize}
          onChange={e => setFontSize(Number(e.target.value))} className="w-full accent-primary h-1" />
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Cor</span>
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          className="w-7 h-6 rounded border border-border cursor-pointer" />
      </div>

      {/* Center position */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Centro do caminho</span>
        <div className="grid grid-cols-2 gap-1">
          <input type="number" value={centerX} onChange={e => setCenterX(Number(e.target.value))}
            placeholder="X"
            className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
          <input type="number" value={centerY} onChange={e => setCenterY(Number(e.target.value))}
            placeholder="Y"
            className="bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
        </div>
        <button onClick={pickCenter}
          className="py-1 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          Capturar centro
        </button>
      </div>

      {/* Show path toggle */}
      <button onClick={() => setShowPath(p => !p)}
        className={`py-1 rounded border text-[8px] transition-colors ${showPath ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
        {showPath ? "Ocultar caminho" : "Mostrar caminho"}
      </button>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={removeTextOnShape}
          className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
          <RotateCcw className="w-3 h-3" /> Remover
        </button>
        <button onClick={applyTextOnShape}
          className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
          <Shapes className="w-3 h-3" /> Aplicar
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Usa fabric.Text com path SVG
      </p>
    </div>
  );
}
