"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ruler } from "lucide-react";
import { toast } from "sonner";

interface CanvasRulerSnapPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const GUIDE_LINE_OPTS = {
  strokeDashArray: [5, 5],
  stroke: "#3b82f6",
  opacity: 0.5,
  selectable: false,
  evented: false,
};

const ANGLE_STEPS = [15, 30, 45, 90];

export function CanvasRulerSnapPanel({ fabricCanvas }: CanvasRulerSnapPanelProps) {
  const canvasRef = useRef<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >(null);

  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [snapToObjects, setSnapToObjects] = useState(false);
  const [rotationSnap, setRotationSnap] = useState(false);
  const [angleStep, setAngleStep] = useState(45);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Sync rotation snap with Fabric canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (rotationSnap) {
      canvas.set({ snapAngle: angleStep });
    } else {
      canvas.set({ snapAngle: 0 });
    }
  }, [rotationSnap, angleStep]);

  // Sync grid snap (disable snapAngle from grid toggle perspective)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!snapToGrid) {
      // Only reset snapAngle if rotation snap is also off
      if (!rotationSnap) {
        canvas.set({ snapAngle: 0 });
      }
    }
  }, [snapToGrid, rotationSnap]);

  const handleSnapToGridToggle = useCallback(() => {
    setSnapToGrid((prev) => {
      const next = !prev;
      const canvas = canvasRef.current;
      if (canvas && !next) {
        if (!rotationSnap) {
          canvas.set({ snapAngle: 0 });
        }
      }
      queueMicrotask(() => {
        toast.success(next ? "Snap à grade ativado" : "Snap à grade desativado");
      });
      return next;
    });
  }, [rotationSnap]);

  const handleSnapToObjectsToggle = useCallback(() => {
    setSnapToObjects((prev) => {
      const next = !prev;
      queueMicrotask(() => {
        toast.success(next ? "Snap visual ativado" : "Snap visual desativado");
      });
      return next;
    });
  }, []);

  const handleRotationSnapToggle = useCallback(() => {
    setRotationSnap((prev) => {
      const next = !prev;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.set({ snapAngle: next ? angleStep : 0 });
      }
      queueMicrotask(() => {
        toast.success(next ? `Snap de rotação ativado (${angleStep}°)` : "Snap de rotação desativado");
      });
      return next;
    });
  }, [angleStep]);

  const handleAngleStepChange = useCallback(
    (value: number) => {
      setAngleStep(value);
      if (rotationSnap) {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.set({ snapAngle: value });
        }
      }
    },
    [rotationSnap]
  );

  const applyGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabric = m.fabric as any;
      const cw: number = canvas.width ?? 800;
      const ch: number = canvas.height ?? 600;

      for (let x = 0; x <= cw; x += gridSize) {
        const line = new fabric.Line([x, 0, x, ch], {
          ...GUIDE_LINE_OPTS,
          data: { rulerGrid: true },
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }
      for (let y = 0; y <= ch; y += gridSize) {
        const line = new fabric.Line([0, y, cw, y], {
          ...GUIDE_LINE_OPTS,
          data: { rulerGrid: true },
        });
        canvas.add(line);
        canvas.sendToBack(line);
      }
      canvas.requestRenderAll();
      toast.success("Grade aplicada");
    });
  }, [gridSize]);

  const removeGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gridObjs = canvas.getObjects().filter((o: any) => o.data?.rulerGrid === true);
    gridObjs.forEach((o: unknown) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success("Grade removida");
  }, []);

  const addHorizontalGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabric = m.fabric as any;
      const cw: number = canvas.width ?? 800;
      const ch: number = canvas.height ?? 600;

      const line = new fabric.Line([0, ch / 2, cw, ch / 2], {
        ...GUIDE_LINE_OPTS,
        data: { rulerGuide: true, orientation: "h" },
      });
      canvas.add(line);
      canvas.requestRenderAll();
      toast.success("Guia horizontal adicionada");
    });
  }, []);

  const addVerticalGuide = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabric = m.fabric as any;
      const cw: number = canvas.width ?? 800;
      const ch: number = canvas.height ?? 600;

      const line = new fabric.Line([cw / 2, 0, cw / 2, ch], {
        ...GUIDE_LINE_OPTS,
        data: { rulerGuide: true, orientation: "v" },
      });
      canvas.add(line);
      canvas.requestRenderAll();
      toast.success("Guia vertical adicionada");
    });
  }, []);

  const clearGuides = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guides = canvas.getObjects().filter((o: any) => o.data?.rulerGuide === true);
    guides.forEach((o: unknown) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success("Guias removidas");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Ruler className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Régua &amp; Snap</span>
      </div>

      {/* Snap to Grid */}
      <div className="flex flex-col gap-2 rounded border border-border p-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Snap à Grade
          </span>
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={handleSnapToGridToggle}
            className="accent-primary cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Tamanho da grade</span>
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-1.5 py-0.5 text-[8px] font-medium tabular-nums">
              {gridSize}px
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={gridSize}
            onChange={(e) => setGridSize(Number(e.target.value))}
            className="w-full accent-primary h-1"
          />
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={applyGrid}
            className="flex-1 rounded border border-border bg-muted py-1 text-[9px] font-medium transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            Aplicar Grade
          </button>
          <button
            onClick={removeGrid}
            className="flex-1 rounded border border-border bg-muted py-1 text-[9px] font-medium transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
          >
            Remover Grade
          </button>
        </div>
      </div>

      {/* Snap to Objects */}
      <div className="flex flex-col gap-2 rounded border border-border p-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Snap a Objetos
          </span>
          <input
            type="checkbox"
            checked={snapToObjects}
            onChange={handleSnapToObjectsToggle}
            className="accent-primary cursor-pointer"
          />
        </div>
        {snapToObjects && (
          <p className="text-[8px] text-muted-foreground/70 italic">
            Snap visual ativado
          </p>
        )}
      </div>

      {/* Rotation Snap */}
      <div className="flex flex-col gap-2 rounded border border-border p-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Snap de Rotação
          </span>
          <input
            type="checkbox"
            checked={rotationSnap}
            onChange={handleRotationSnapToggle}
            className="accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Ângulo</span>
          <select
            value={angleStep}
            onChange={(e) => handleAngleStepChange(Number(e.target.value))}
            disabled={!rotationSnap}
            className="flex-1 rounded border border-border bg-background px-1.5 py-0.5 text-[9px] disabled:opacity-50"
          >
            {ANGLE_STEPS.map((a) => (
              <option key={a} value={a}>
                {a}°
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ruler Guides */}
      <div className="flex flex-col gap-2 rounded border border-border p-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Guias de Régua
        </span>

        <div className="flex gap-1.5">
          <button
            onClick={addHorizontalGuide}
            className="flex-1 rounded border border-border bg-muted py-1 text-[9px] font-medium transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            Adicionar Guia H
          </button>
          <button
            onClick={addVerticalGuide}
            className="flex-1 rounded border border-border bg-muted py-1 text-[9px] font-medium transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          >
            Adicionar Guia V
          </button>
        </div>

        <button
          onClick={clearGuides}
          className="w-full rounded border border-border bg-muted py-1 text-[9px] font-medium transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        >
          Limpar Guias
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Guias e grade não são exportadas com o design
      </p>
    </div>
  );
}
