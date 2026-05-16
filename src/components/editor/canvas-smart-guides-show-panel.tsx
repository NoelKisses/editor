"use client";

import { useEffect, useRef, useState } from "react";
import { Ruler } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CanvasSmartGuidesShowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface ObjectEdges {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectEdges(obj: any): ObjectEdges {
  const left = obj.left ?? 0;
  const top = obj.top ?? 0;
  const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
  const height = (obj.height ?? 0) * (obj.scaleY ?? 1);
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
  };
}

function findNearestSnap(
  value: number,
  candidates: number[],
  threshold: number
): number | null {
  let bestDelta: number | null = null;
  let bestAbs = Infinity;
  for (const c of candidates) {
    const delta = c - value;
    const abs = Math.abs(delta);
    if (abs <= threshold && abs < bestAbs) {
      bestAbs = abs;
      bestDelta = delta;
    }
  }
  return bestDelta;
}

export function CanvasSmartGuidesShowPanel({
  fabricCanvas,
}: CanvasSmartGuidesShowPanelProps) {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(8);
  const [guideColor, setGuideColor] = useState("#ff00ff");
  const [guideWidth, setGuideWidth] = useState(1);
  const [showIndicators, setShowIndicators] = useState(true);
  const [snapObjectCenters, setSnapObjectCenters] = useState(true);
  const [snapObjectEdges, setSnapObjectEdges] = useState(true);
  const [snapCanvasCenter, setSnapCanvasCenter] = useState(true);
  const [snapCanvasEdges, setSnapCanvasEdges] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const configRef = useRef({
    threshold,
    guideColor,
    guideWidth,
    showIndicators,
    snapObjectCenters,
    snapObjectEdges,
    snapCanvasCenter,
    snapCanvasEdges,
  });

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    configRef.current = {
      threshold,
      guideColor,
      guideWidth,
      showIndicators,
      snapObjectCenters,
      snapObjectEdges,
      snapCanvasCenter,
      snapCanvasEdges,
    };
  }, [
    threshold,
    guideColor,
    guideWidth,
    showIndicators,
    snapObjectCenters,
    snapObjectEdges,
    snapCanvasCenter,
    snapCanvasEdges,
  ]);

  useEffect(() => {
    if (!enabled || !fabricCanvas) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let movingHandler: ((e: any) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let modifiedHandler: ((e: any) => void) | null = null;

    import("fabric").then((m) => {
      if (cancelled) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const canvas = fabricCanvas;
      if (!canvas) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clearGuides = (c: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leftovers = c.getObjects().filter((o: any) => o?.data?.smartGuide);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        leftovers.forEach((o: any) => c.remove(o));
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drawGuide = (c: any, x1: number, y1: number, x2: number, y2: number) => {
        const cfg = configRef.current;
        const line = new f.Line([x1, y1, x2, y2], {
          stroke: cfg.guideColor,
          strokeWidth: cfg.guideWidth,
          selectable: false,
          evented: false,
          excludeFromExport: true,
          strokeDashArray: [4, 4],
          data: { smartGuide: true },
        });
        c.add(line);
        c.bringToFront(line);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      movingHandler = (e: any) => {
        const target = e.target;
        if (!target || target?.data?.smartGuide) return;
        const cfg = configRef.current;

        clearGuides(canvas);

        const cw = canvas.getWidth();
        const ch = canvas.getHeight();
        const me = getObjectEdges(target);

        const vCandidates: { value: number; line: [number, number, number, number] }[] = [];
        const hCandidates: { value: number; line: [number, number, number, number] }[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const others = canvas.getObjects().filter((o: any) => o !== target && !o?.data?.smartGuide);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        others.forEach((o: any) => {
          const oe = getObjectEdges(o);
          if (cfg.snapObjectEdges) {
            vCandidates.push({ value: oe.left, line: [oe.left, 0, oe.left, ch] });
            vCandidates.push({ value: oe.right, line: [oe.right, 0, oe.right, ch] });
            hCandidates.push({ value: oe.top, line: [0, oe.top, cw, oe.top] });
            hCandidates.push({ value: oe.bottom, line: [0, oe.bottom, cw, oe.bottom] });
          }
          if (cfg.snapObjectCenters) {
            vCandidates.push({ value: oe.centerX, line: [oe.centerX, 0, oe.centerX, ch] });
            hCandidates.push({ value: oe.centerY, line: [0, oe.centerY, cw, oe.centerY] });
          }
        });

        if (cfg.snapCanvasCenter) {
          vCandidates.push({ value: cw / 2, line: [cw / 2, 0, cw / 2, ch] });
          hCandidates.push({ value: ch / 2, line: [0, ch / 2, cw, ch / 2] });
        }
        if (cfg.snapCanvasEdges) {
          vCandidates.push({ value: 0, line: [0, 0, 0, ch] });
          vCandidates.push({ value: cw, line: [cw, 0, cw, ch] });
          hCandidates.push({ value: 0, line: [0, 0, cw, 0] });
          hCandidates.push({ value: ch, line: [0, ch, cw, ch] });
        }

        const myVValues = [
          { key: "left", val: me.left },
          { key: "right", val: me.right },
          { key: "centerX", val: me.centerX },
        ];
        const myHValues = [
          { key: "top", val: me.top },
          { key: "bottom", val: me.bottom },
          { key: "centerY", val: me.centerY },
        ];

        let bestVDelta: number | null = null;
        let bestVAbs = Infinity;
        let bestVLine: [number, number, number, number] | null = null;

        for (const mv of myVValues) {
          for (const cand of vCandidates) {
            const delta = cand.value - mv.val;
            const abs = Math.abs(delta);
            if (abs <= cfg.threshold && abs < bestVAbs) {
              bestVAbs = abs;
              bestVDelta = delta;
              bestVLine = cand.line;
            }
          }
        }

        let bestHDelta: number | null = null;
        let bestHAbs = Infinity;
        let bestHLine: [number, number, number, number] | null = null;

        for (const mh of myHValues) {
          for (const cand of hCandidates) {
            const delta = cand.value - mh.val;
            const abs = Math.abs(delta);
            if (abs <= cfg.threshold && abs < bestHAbs) {
              bestHAbs = abs;
              bestHDelta = delta;
              bestHLine = cand.line;
            }
          }
        }

        if (bestVDelta !== null) {
          target.set({ left: (target.left ?? 0) + bestVDelta });
          if (bestVLine && cfg.showIndicators) {
            drawGuide(canvas, bestVLine[0], bestVLine[1], bestVLine[2], bestVLine[3]);
          }
        }
        if (bestHDelta !== null) {
          target.set({ top: (target.top ?? 0) + bestHDelta });
          if (bestHLine && cfg.showIndicators) {
            drawGuide(canvas, bestHLine[0], bestHLine[1], bestHLine[2], bestHLine[3]);
          }
        }

        target.setCoords();
        canvas.requestRenderAll();
      };

      modifiedHandler = () => {
        clearGuides(canvas);
        canvas.requestRenderAll();
      };

      canvas.on("object:moving", movingHandler);
      canvas.on("object:modified", modifiedHandler);
      canvas.on("mouse:up", modifiedHandler);

      queueMicrotask(() => {
        toast.success("Smart Guides ativados");
      });
    });

    return () => {
      cancelled = true;
      const canvas = fabricCanvas;
      if (canvas) {
        if (movingHandler) canvas.off("object:moving", movingHandler);
        if (modifiedHandler) {
          canvas.off("object:modified", modifiedHandler);
          canvas.off("mouse:up", modifiedHandler);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const leftovers = canvas.getObjects().filter((o: any) => o?.data?.smartGuide);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        leftovers.forEach((o: any) => canvas.remove(o));
        canvas.requestRenderAll();
      }
    };
  }, [enabled, fabricCanvas]);

  const handleClearGuides = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leftovers = canvas.getObjects().filter((o: any) => o?.data?.smartGuide);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    leftovers.forEach((o: any) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${leftovers.length} guia(s) removida(s)`);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Ruler className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Smart Guides em Tempo Real</h3>
      </div>

      <label className="flex items-center justify-between gap-2 text-sm">
        <span>Ativar Smart Guides</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
      </label>

      <div className="space-y-2">
        <label className="block text-xs font-medium">
          Snap threshold: {threshold}px
        </label>
        <input
          type="range"
          min={3}
          max={25}
          step={1}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium">Cor das guias</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={guideColor}
            onChange={(e) => setGuideColor(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded border"
          />
          <Input
            value={guideColor}
            onChange={(e) => setGuideColor(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium">
          Espessura da linha: {guideWidth}px
        </label>
        <input
          type="range"
          min={1}
          max={4}
          step={1}
          value={guideWidth}
          onChange={(e) => setGuideWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center justify-between gap-2 text-sm">
        <span>Mostrar indicadores de snap</span>
        <input
          type="checkbox"
          checked={showIndicators}
          onChange={(e) => setShowIndicators(e.target.checked)}
          className="h-4 w-4"
        />
      </label>

      <div className="space-y-2 rounded border p-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Alvos de snap
        </p>

        <label className="flex items-center justify-between gap-2 text-sm">
          <span>Centros de outros objetos</span>
          <input
            type="checkbox"
            checked={snapObjectCenters}
            onChange={(e) => setSnapObjectCenters(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-2 text-sm">
          <span>Bordas de outros objetos</span>
          <input
            type="checkbox"
            checked={snapObjectEdges}
            onChange={(e) => setSnapObjectEdges(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-2 text-sm">
          <span>Centro do canvas</span>
          <input
            type="checkbox"
            checked={snapCanvasCenter}
            onChange={(e) => setSnapCanvasCenter(e.target.checked)}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-2 text-sm">
          <span>Bordas do canvas</span>
          <input
            type="checkbox"
            checked={snapCanvasEdges}
            onChange={(e) => setSnapCanvasEdges(e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      </div>

      <Button onClick={handleClearGuides} variant="outline" className="w-full">
        Limpar Guias
      </Button>
    </div>
  );
}
