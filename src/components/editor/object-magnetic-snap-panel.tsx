"use client";

import { useEffect, useRef, useState } from "react";
import { Magnet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ObjectMagneticSnapPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface ObjectBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

interface SnapConfig {
  enabled: boolean;
  threshold: number;
  snapToCanvasEdges: boolean;
  snapToCanvasCenter: boolean;
  snapToObjects: boolean;
  visualFeedback: boolean;
}

const DEFAULT_CONFIG: SnapConfig = {
  enabled: true,
  threshold: 8,
  snapToCanvasEdges: true,
  snapToCanvasCenter: true,
  snapToObjects: true,
  visualFeedback: true,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getObjectBounds(obj: any): ObjectBounds {
  const scaleX = typeof obj.scaleX === "number" ? obj.scaleX : 1;
  const scaleY = typeof obj.scaleY === "number" ? obj.scaleY : 1;
  const rawWidth = typeof obj.width === "number" ? obj.width : 0;
  const rawHeight = typeof obj.height === "number" ? obj.height : 0;
  const width = rawWidth * scaleX;
  const height = rawHeight * scaleY;
  const left = typeof obj.left === "number" ? obj.left : 0;
  const top = typeof obj.top === "number" ? obj.top : 0;
  return {
    left,
    right: left + width,
    top,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    width,
    height,
  };
}

function findSnap(
  value: number,
  candidates: number[],
  threshold: number,
): number | null {
  let best: number | null = null;
  let bestDist = threshold;
  for (const c of candidates) {
    const dist = Math.abs(value - c);
    if (dist <= bestDist) {
      best = c - value;
      bestDist = dist;
    }
  }
  return best;
}

export function ObjectMagneticSnapPanel({
  fabricCanvas,
}: ObjectMagneticSnapPanelProps) {
  const [config, setConfig] = useState<SnapConfig>(DEFAULT_CONFIG);
  const configRef = useRef<SnapConfig>(DEFAULT_CONFIG);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (!fabricCanvas) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMoving = (e: any) => {
      const cfg = configRef.current;
      if (!cfg.enabled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const obj = e?.target;
      if (!obj) return;

      const bounds = getObjectBounds(obj);
      const threshold = cfg.threshold;

      const canvasWidth =
        typeof canvas.getWidth === "function" ? canvas.getWidth() : 0;
      const canvasHeight =
        typeof canvas.getHeight === "function" ? canvas.getHeight() : 0;

      const xCandidatesLeft: number[] = [];
      const xCandidatesRight: number[] = [];
      const xCandidatesCenter: number[] = [];
      const yCandidatesTop: number[] = [];
      const yCandidatesBottom: number[] = [];
      const yCandidatesCenter: number[] = [];

      if (cfg.snapToCanvasEdges) {
        xCandidatesLeft.push(0);
        xCandidatesRight.push(canvasWidth);
        yCandidatesTop.push(0);
        yCandidatesBottom.push(canvasHeight);
      }
      if (cfg.snapToCanvasCenter) {
        xCandidatesCenter.push(canvasWidth / 2);
        yCandidatesCenter.push(canvasHeight / 2);
      }
      if (cfg.snapToObjects && typeof canvas.getObjects === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const others = canvas.getObjects().filter((o: any) => o !== obj);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const other of others) {
          const ob = getObjectBounds(other);
          xCandidatesLeft.push(ob.left, ob.right);
          xCandidatesRight.push(ob.left, ob.right);
          xCandidatesCenter.push(ob.centerX);
          yCandidatesTop.push(ob.top, ob.bottom);
          yCandidatesBottom.push(ob.top, ob.bottom);
          yCandidatesCenter.push(ob.centerY);
        }
      }

      let deltaX: number | null = null;
      let deltaY: number | null = null;

      const dLeft = findSnap(bounds.left, xCandidatesLeft, threshold);
      if (dLeft !== null) deltaX = dLeft;
      const dRight = findSnap(bounds.right, xCandidatesRight, threshold);
      if (
        dRight !== null &&
        (deltaX === null || Math.abs(dRight) < Math.abs(deltaX))
      ) {
        deltaX = dRight;
      }
      const dCenterX = findSnap(
        bounds.centerX,
        xCandidatesCenter,
        threshold,
      );
      if (
        dCenterX !== null &&
        (deltaX === null || Math.abs(dCenterX) < Math.abs(deltaX))
      ) {
        deltaX = dCenterX;
      }

      const dTop = findSnap(bounds.top, yCandidatesTop, threshold);
      if (dTop !== null) deltaY = dTop;
      const dBottom = findSnap(bounds.bottom, yCandidatesBottom, threshold);
      if (
        dBottom !== null &&
        (deltaY === null || Math.abs(dBottom) < Math.abs(deltaY))
      ) {
        deltaY = dBottom;
      }
      const dCenterY = findSnap(
        bounds.centerY,
        yCandidatesCenter,
        threshold,
      );
      if (
        dCenterY !== null &&
        (deltaY === null || Math.abs(dCenterY) < Math.abs(deltaY))
      ) {
        deltaY = dCenterY;
      }

      let snapped = false;
      if (deltaX !== null && deltaX !== 0) {
        obj.left = (typeof obj.left === "number" ? obj.left : 0) + deltaX;
        snapped = true;
      }
      if (deltaY !== null && deltaY !== 0) {
        obj.top = (typeof obj.top === "number" ? obj.top : 0) + deltaY;
        snapped = true;
      }
      if (snapped && typeof obj.setCoords === "function") {
        obj.setCoords();
      }
      if (snapped && typeof canvas.requestRenderAll === "function") {
        canvas.requestRenderAll();
      }
    };

    if (typeof fabricCanvas.on === "function") {
      fabricCanvas.on("object:moving", handleMoving);
    }

    return () => {
      if (typeof fabricCanvas.off === "function") {
        fabricCanvas.off("object:moving", handleMoving);
      }
    };
  }, [fabricCanvas]);

  const updateConfig = <K extends keyof SnapConfig>(
    key: K,
    value: SnapConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    toast.success("Configurações de snap magnético resetadas");
  };

  const handleToggleEnabled = (checked: boolean) => {
    updateConfig("enabled", checked);
    toast.info(
      checked ? "Snap magnético ativado" : "Snap magnético desativado",
    );
  };

  const handleToggleVisualFeedback = (checked: boolean) => {
    updateConfig("visualFeedback", checked);
    toast.info(
      checked
        ? "Feedback visual de snap ativado"
        : "Feedback visual de snap desativado",
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Magnet className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Snap Magnético</h3>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
          />
          <span>Ativar snap magnético</span>
        </label>

        <div className="space-y-1">
          <label className="flex items-center justify-between text-sm">
            <span>Distância de snap (px)</span>
            <span className="font-mono text-xs">{config.threshold}</span>
          </label>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={config.threshold}
            onChange={(e) =>
              updateConfig("threshold", Number(e.target.value))
            }
            disabled={!config.enabled}
            className="w-full"
          />
        </div>

        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Alvos de snap
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.snapToCanvasEdges}
              onChange={(e) =>
                updateConfig("snapToCanvasEdges", e.target.checked)
              }
              disabled={!config.enabled}
            />
            <span>Snap às bordas do canvas</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.snapToCanvasCenter}
              onChange={(e) =>
                updateConfig("snapToCanvasCenter", e.target.checked)
              }
              disabled={!config.enabled}
            />
            <span>Snap ao centro do canvas</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.snapToObjects}
              onChange={(e) =>
                updateConfig("snapToObjects", e.target.checked)
              }
              disabled={!config.enabled}
            />
            <span>Snap a outros objetos</span>
          </label>
        </div>

        <div className="border-t pt-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.visualFeedback}
              onChange={(e) => handleToggleVisualFeedback(e.target.checked)}
              disabled={!config.enabled}
            />
            <span>Mostrar guias visuais durante snap</span>
          </label>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="w-full"
        >
          Resetar Configurações
        </Button>
      </div>
    </div>
  );
}
