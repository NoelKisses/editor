"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = any;

type LayoutType = "grade" | "linha" | "coluna" | "círculo" | "escada" | "espiral";

interface LayoutPosition {
  index: number;
  left: number;
  top: number;
}

interface SavedPosition {
  index: number;
  left: number;
  top: number;
}

const LAYOUT_OPTIONS: { value: LayoutType; label: string }[] = [
  { value: "grade", label: "Grade" },
  { value: "linha", label: "Linha" },
  { value: "coluna", label: "Coluna" },
  { value: "círculo", label: "Círculo" },
  { value: "escada", label: "Escada" },
  { value: "espiral", label: "Espiral" },
];

function arrangeGrid(
  objects: AnyObject[],
  cols: number,
  gap: number,
  canvasW: number,
  canvasH: number,
  padding: number,
  center: boolean
): LayoutPosition[] {
  if (objects.length === 0) return [];
  const safeCols = Math.max(1, Math.min(cols, objects.length));
  const positions: LayoutPosition[] = [];
  let x = padding;
  let y = padding;
  let rowMaxHeight = 0;

  objects.forEach((obj, i) => {
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    if (i > 0 && i % safeCols === 0) {
      x = padding;
      y += rowMaxHeight + gap;
      rowMaxHeight = 0;
    }
    positions.push({ index: i, left: x, top: y });
    x += w + gap;
    if (h > rowMaxHeight) rowMaxHeight = h;
  });

  if (center) {
    const allLeft = positions.map((p) => p.left);
    const allTop = positions.map((p) => p.top);
    const minLeft = Math.min(...allLeft);
    const minTop = Math.min(...allTop);
    const lastPos = positions[positions.length - 1];
    const lastObj = objects[lastPos.index];
    const maxRight = lastPos.left + (lastObj.width ?? 0) * (lastObj.scaleX ?? 1);
    const maxBottom = lastPos.top + (lastObj.height ?? 0) * (lastObj.scaleY ?? 1);
    const totalW = maxRight - minLeft;
    const totalH = maxBottom - minTop;
    const offsetX = (canvasW - totalW) / 2 - minLeft;
    const offsetY = (canvasH - totalH) / 2 - minTop;
    return positions.map((p) => ({ ...p, left: p.left + offsetX, top: p.top + offsetY }));
  }

  return positions;
}

function arrangeRow(
  objects: AnyObject[],
  gap: number,
  canvasH: number,
  padding: number,
  center: boolean
): LayoutPosition[] {
  if (objects.length === 0) return [];
  const positions: LayoutPosition[] = [];
  let x = padding;
  const maxH = Math.max(...objects.map((o) => (o.height ?? 0) * (o.scaleY ?? 1)));
  const topY = center ? (canvasH - maxH) / 2 : padding;

  objects.forEach((obj, i) => {
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    const objTop = center ? (canvasH - h) / 2 : topY;
    positions.push({ index: i, left: x, top: objTop });
    x += w + gap;
  });

  return positions;
}

function arrangeColumn(
  objects: AnyObject[],
  gap: number,
  canvasW: number,
  padding: number,
  center: boolean
): LayoutPosition[] {
  if (objects.length === 0) return [];
  const positions: LayoutPosition[] = [];
  let y = padding;
  const maxW = Math.max(...objects.map((o) => (o.width ?? 0) * (o.scaleX ?? 1)));
  const leftX = center ? (canvasW - maxW) / 2 : padding;

  objects.forEach((obj, i) => {
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    const objLeft = center ? (canvasW - w) / 2 : leftX;
    positions.push({ index: i, left: objLeft, top: y });
    y += h + gap;
  });

  return positions;
}

function arrangeCircle(
  objects: AnyObject[],
  canvasW: number,
  canvasH: number
): LayoutPosition[] {
  if (objects.length === 0) return [];
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const radius = Math.min(canvasW, canvasH) * 0.35;
  const angleStep = (2 * Math.PI) / objects.length;

  return objects.map((obj, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    return {
      index: i,
      left: cx + radius * Math.cos(angle) - w / 2,
      top: cy + radius * Math.sin(angle) - h / 2,
    };
  });
}

function arrangeStaircase(
  objects: AnyObject[],
  gap: number
): LayoutPosition[] {
  if (objects.length === 0) return [];
  let x = 0;
  let y = 0;

  return objects.map((obj, i) => {
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    const pos = { index: i, left: x, top: y };
    x += w + gap;
    y += h + gap;
    return pos;
  });
}

function arrangeSpiral(
  objects: AnyObject[],
  canvasW: number,
  canvasH: number
): LayoutPosition[] {
  if (objects.length === 0) return [];
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  const angleStep = 0.6;
  const radiusStep = 18;

  return objects.map((obj, i) => {
    const angle = i * angleStep;
    const radius = radiusStep * i * 0.4;
    const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
    return {
      index: i,
      left: cx + radius * Math.cos(angle) - w / 2,
      top: cy + radius * Math.sin(angle) - h / 2,
    };
  });
}

interface CanvasAutoLayoutPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasAutoLayoutPanel({ fabricCanvas }: CanvasAutoLayoutPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const prevPositionsRef = useRef<SavedPosition[] | null>(null);

  const [layoutType, setLayoutType] = useState<LayoutType>("grade");
  const [gap, setGap] = useState(20);
  const [cols, setCols] = useState(3);
  const [alignCenter, setAlignCenter] = useState(true);
  const [padding, setPadding] = useState(40);
  const [objectCount, setObjectCount] = useState(0);
  const [hasSavedLayout, setHasSavedLayout] = useState(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const updateCount = () => {
      queueMicrotask(() => {
        const cv2 = canvasRef.current;
        if (!cv2) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const all: any[] = cv2.getObjects ? cv2.getObjects() : [];
        const filtered = all.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (o: any) =>
            !(o.data?.mockupScene === true || o.data?.noiseTexture === true)
        );
        setObjectCount(filtered.length);
      });
    };

    updateCount();
    cv.on("object:added", updateCount);
    cv.on("object:removed", updateCount);

    return () => {
      cv.off("object:added", updateCount);
      cv.off("object:removed", updateCount);
    };
  }, [fabricCanvas]);

  const getLayoutObjects = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all: any[] = cv.getObjects ? cv.getObjects() : [];
    return all.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (o: any) =>
        !(o.data?.mockupScene === true || o.data?.noiseTexture === true)
    );
  }, []);

  const handleApply = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) {
      toast.error("Canvas não disponível.");
      return;
    }

    const objects = getLayoutObjects();
    if (objects.length === 0) {
      toast.error("Nenhum objeto encontrado no canvas.");
      return;
    }

    // Save current positions before applying
    const saved: SavedPosition[] = objects.map((obj, i) => ({
      index: i,
      left: obj.left ?? 0,
      top: obj.top ?? 0,
    }));
    prevPositionsRef.current = saved;
    setHasSavedLayout(true);

    const canvasW: number = cv.width ?? 800;
    const canvasH: number = cv.height ?? 600;

    let positions: LayoutPosition[] = [];

    if (layoutType === "grade") {
      positions = arrangeGrid(objects, cols, gap, canvasW, canvasH, padding, alignCenter);
    } else if (layoutType === "linha") {
      positions = arrangeRow(objects, gap, canvasH, padding, alignCenter);
    } else if (layoutType === "coluna") {
      positions = arrangeColumn(objects, gap, canvasW, padding, alignCenter);
    } else if (layoutType === "círculo") {
      positions = arrangeCircle(objects, canvasW, canvasH);
    } else if (layoutType === "escada") {
      positions = arrangeStaircase(objects, gap);
    } else if (layoutType === "espiral") {
      positions = arrangeSpiral(objects, canvasW, canvasH);
    }

    positions.forEach(({ index, left, top }) => {
      const obj = objects[index];
      if (obj) {
        obj.set({ left, top });
      }
    });

    cv.requestRenderAll();
    toast.success(`Layout "${layoutType}" aplicado a ${objects.length} objetos.`);
  }, [layoutType, gap, cols, alignCenter, padding, getLayoutObjects]);

  const handleUndo = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) {
      toast.error("Canvas não disponível.");
      return;
    }
    if (!prevPositionsRef.current) {
      toast.error("Nenhum layout anterior para desfazer.");
      return;
    }

    const objects = getLayoutObjects();
    prevPositionsRef.current.forEach(({ index, left, top }) => {
      const obj = objects[index];
      if (obj) {
        obj.set({ left, top });
      }
    });

    cv.requestRenderAll();
    prevPositionsRef.current = null;
    setHasSavedLayout(false);
    toast.success("Layout desfeito.");
  }, [getLayoutObjects]);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Auto Layout</span>
      </div>

      {/* Object count */}
      <div className="text-xs text-muted-foreground">
        {objectCount} objeto{objectCount !== 1 ? "s" : ""} no canvas
      </div>

      {/* Layout type selector — 2x3 grid */}
      <div>
        <span className="text-xs mb-2 block">Tipo de Layout</span>
        <div className="grid grid-cols-3 gap-1.5">
          {LAYOUT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLayoutType(opt.value)}
              className={`rounded border px-2 py-1.5 text-xs transition-colors ${
                layoutType === opt.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-background hover:bg-accent text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gap slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs">Espaçamento</span>
          <span className="text-xs text-muted-foreground">{gap}px</span>
        </div>
        <input type="range" min={0} max={80} step={1} value={gap}
          onChange={(e) => setGap(Number(e.target.value))}
          className="w-full h-1 accent-primary" />
      </div>

      {/* Columns input — only relevant for grid */}
      {layoutType === "grade" && (
        <div>
          <span className="text-xs mb-1 block">Colunas (grade)</span>
          <Input
            type="number"
            min={2}
            max={8}
            value={cols}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) setCols(Math.min(8, Math.max(2, val)));
            }}
            className="h-8 text-xs w-20"
          />
        </div>
      )}

      {/* Padding slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs">Margem da borda</span>
          <span className="text-xs text-muted-foreground">{padding}px</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full h-1 accent-primary" />
      </div>

      {/* Align to center checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={alignCenter}
          onChange={(e) => setAlignCenter(e.target.checked)}
          className="w-3 h-3 accent-primary"
        />
        <span className="text-xs">Centralizar no canvas</span>
      </label>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <Button size="sm" className="w-full text-xs" onClick={handleApply}>
          Aplicar Layout
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={handleUndo}
          disabled={!hasSavedLayout}
        >
          Desfazer Layout
        </Button>
      </div>
    </div>
  );
}
