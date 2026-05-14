"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Blend } from "lucide-react";
import { toast } from "sonner";

interface CanvasBlendModesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type BlendMode =
  | "source-over"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion";

interface BlendModeOption {
  value: BlendMode;
  label: string;
}

const BLEND_MODES: BlendModeOption[] = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiplicar" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Escurecer" },
  { value: "lighten", label: "Clarear" },
  { value: "color-dodge", label: "Dodge" },
  { value: "color-burn", label: "Burn" },
  { value: "hard-light", label: "Luz Dura" },
  { value: "soft-light", label: "Luz Suave" },
  { value: "difference", label: "Diferença" },
  { value: "exclusion", label: "Exclusão" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSelectedObjects(canvas: any): any[] {
  if (!canvas) return [];
  const active = canvas.getActiveObject();
  if (!active) return [];
  if (active.type === "activeSelection") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (active as any).getObjects() as any[];
  }
  return [active];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readFirstObjectState(canvas: any): { mode: BlendMode; opacity: number } {
  const objs = getSelectedObjects(canvas);
  if (objs.length === 0) return { mode: "source-over", opacity: 100 };
  const first = objs[0];
  const mode = (first.globalCompositeOperation as BlendMode) ?? "source-over";
  const opacity = Math.round((first.opacity ?? 1) * 100);
  return { mode, opacity };
}

export function CanvasBlendModesPanel({ fabricCanvas }: CanvasBlendModesPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [activeMode, setActiveMode] = useState<BlendMode>("source-over");
  const [opacity, setOpacity] = useState(100);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const syncFromSelection = () => {
      const objs = getSelectedObjects(canvas);
      const state = readFirstObjectState(canvas);
      queueMicrotask(() => {
        setSelectedCount(objs.length);
        setActiveMode(state.mode);
        setOpacity(state.opacity);
      });
    };

    const handleCleared = () => {
      queueMicrotask(() => {
        setSelectedCount(0);
        setActiveMode("source-over");
        setOpacity(100);
      });
    };

    canvas.on("selection:created", syncFromSelection);
    canvas.on("selection:updated", syncFromSelection);
    canvas.on("selection:cleared", handleCleared);

    // Sync on mount if there's already a selection
    syncFromSelection();

    return () => {
      canvas.off("selection:created", syncFromSelection);
      canvas.off("selection:updated", syncFromSelection);
      canvas.off("selection:cleared", handleCleared);
    };
  }, [fabricCanvas]);

  const applyBlendMode = useCallback(
    (mode: BlendMode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const objs = getSelectedObjects(canvas);
      if (objs.length === 0) {
        toast.error("Selecione ao menos um objeto");
        return;
      }
      objs.forEach((obj) => {
        obj.set({ globalCompositeOperation: mode });
      });
      canvas.requestRenderAll();
      setActiveMode(mode);
      toast.success(`Blend "${mode}" aplicado`);
    },
    []
  );

  const handleOpacityChange = useCallback((value: number) => {
    setOpacity(value);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objs = getSelectedObjects(canvas);
    objs.forEach((obj) => {
      obj.set({ opacity: value / 100 });
    });
    canvas.requestRenderAll();
  }, []);

  const applyToAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      void f;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allObjects: any[] = canvas.getObjects();
      if (allObjects.length === 0) {
        toast.error("Nenhum objeto no canvas");
        return;
      }
      allObjects.forEach((obj) => {
        obj.set({
          globalCompositeOperation: activeMode,
          opacity: opacity / 100,
        });
      });
      canvas.requestRenderAll();
      toast.success(`Blend aplicado a todos (${allObjects.length} objetos)`);
    });
  }, [activeMode, opacity]);

  const resetSelection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const objs = getSelectedObjects(canvas);
    if (objs.length === 0) {
      toast.error("Selecione ao menos um objeto");
      return;
    }
    objs.forEach((obj) => {
      obj.set({ globalCompositeOperation: "source-over", opacity: 1 });
    });
    canvas.requestRenderAll();
    setActiveMode("source-over");
    setOpacity(100);
    toast.success("Seleção resetada");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Blend className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Modos de Blend</span>
        {selectedCount > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            {selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* 3×4 Blend Mode Grid */}
      <div className="grid grid-cols-3 gap-1">
        {BLEND_MODES.map((bm) => (
          <button
            key={bm.value}
            onClick={() => applyBlendMode(bm.value)}
            className={`px-1 py-1.5 rounded border text-[10px] font-medium transition-colors truncate ${
              activeMode === bm.value
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
            title={bm.value}
          >
            {bm.label}
          </button>
        ))}
      </div>

      {/* Opacity Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Opacidade</span>
          <span className="text-[10px] tabular-nums">{opacity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={opacity}
          onChange={(e) => handleOpacityChange(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={applyToAll}
          className="py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          Aplicar a Todos
        </button>
        <button
          onClick={resetSelection}
          className="py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 hover:text-foreground transition-colors"
        >
          Resetar Seleção
        </button>
      </div>
    </div>
  );
}
