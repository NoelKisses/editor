"use client";

import { useEffect, useRef, useState } from "react";
import { Box } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Object3DCardTiltPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

function computeShadowOffset(
  tiltX: number,
  tiltY: number,
  depth: number,
): { offsetX: number; offsetY: number } {
  const scale = depth / 10;
  return {
    offsetX: -tiltX * scale,
    offsetY: -tiltY * scale,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyTiltToObject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  tiltX: number,
  tiltY: number,
  depth: number,
  shadowEnabled: boolean,
  shadowColor: string,
  shadowOpacity: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FabricNS: any,
) {
  obj.set({
    skewX: tiltX,
    skewY: tiltY,
  });

  if (shadowEnabled && FabricNS?.Shadow) {
    const { offsetX, offsetY } = computeShadowOffset(tiltX, tiltY, depth);
    const opacityHex = Math.round(shadowOpacity * 255)
      .toString(16)
      .padStart(2, "0");
    const colorWithAlpha = `${shadowColor}${opacityHex}`;
    obj.set(
      "shadow",
      new FabricNS.Shadow({
        color: colorWithAlpha,
        blur: 10 + depth,
        offsetX,
        offsetY,
      }),
    );
  } else {
    obj.set("shadow", null);
  }

  obj.data = { ...(obj.data || {}), card3dTilt: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addHighlightOverlay(canvas: any, obj: any, FabricNS: any) {
  if (!FabricNS?.Rect || !FabricNS?.Gradient) return;
  const bounds = obj.getBoundingRect();
  const overlay = new FabricNS.Rect({
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
    height: bounds.height,
    selectable: false,
    evented: false,
    fill: new FabricNS.Gradient({
      type: "linear",
      coords: { x1: 0, y1: 0, x2: bounds.width, y2: bounds.height },
      colorStops: [
        { offset: 0, color: "rgba(255,255,255,0.4)" },
        { offset: 1, color: "rgba(255,255,255,0)" },
      ],
    }),
    data: { card3dTiltOverlay: true },
  });
  canvas.add(overlay);
}

export function Object3DCardTiltPanel({
  fabricCanvas,
}: Object3DCardTiltPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [depth, setDepth] = useState(5);
  const [highlight, setHighlight] = useState(false);
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowOpacity, setShadowOpacity] = useState(0.3);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  function applyPreset(name: string) {
    queueMicrotask(() => {
      switch (name) {
        case "tl":
          setTiltX(-10);
          setTiltY(-10);
          break;
        case "tr":
          setTiltX(10);
          setTiltY(-10);
          break;
        case "bl":
          setTiltX(-10);
          setTiltY(10);
          break;
        case "br":
          setTiltX(10);
          setTiltY(10);
          break;
        case "strongL":
          setTiltX(-25);
          setTiltY(0);
          break;
        case "strongR":
          setTiltX(25);
          setTiltY(0);
          break;
        case "top":
          setTiltX(0);
          setTiltY(-25);
          break;
        case "reset":
        default:
          setTiltX(0);
          setTiltY(0);
          break;
      }
    });
  }

  function handleApply() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObjects?.() ?? [];
    if (!active.length) {
      toast.error("Selecione ao menos um objeto");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FabricNS: any =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).fabric ?? canvas.constructor?.fabric ?? canvas.fabric;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    active.forEach((obj: any) => {
      applyTiltToObject(
        obj,
        tiltX,
        tiltY,
        depth,
        shadowEnabled,
        shadowColor,
        shadowOpacity,
        FabricNS,
      );
      if (highlight) {
        addHighlightOverlay(canvas, obj, FabricNS);
      }
      obj.setCoords?.();
    });

    canvas.requestRenderAll?.();
    toast.success("Tilt 3D aplicado");
  }

  function handleReset() {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas não disponível");
      return;
    }
    const active = canvas.getActiveObjects?.() ?? [];
    if (!active.length) {
      toast.error("Selecione ao menos um objeto");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    active.forEach((obj: any) => {
      obj.set({ skewX: 0, skewY: 0, shadow: null });
      if (obj.data) obj.data.card3dTilt = false;
      obj.setCoords?.();
    });
    canvas.requestRenderAll?.();
    toast.success("Tilt resetado");
  }

  const presets: { key: string; label: string }[] = [
    { key: "tl", label: "Top-Left" },
    { key: "tr", label: "Top-Right" },
    { key: "bl", label: "Bottom-Left" },
    { key: "br", label: "Bottom-Right" },
    { key: "strongL", label: "Forte Esq." },
    { key: "strongR", label: "Forte Dir." },
    { key: "top", label: "Top View" },
    { key: "reset", label: "Reset" },
  ];

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Card 3D Tilt (Perspectiva)</h3>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Tilt X: {tiltX}°</label>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={tiltX}
          onChange={(e) => setTiltX(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Tilt Y: {tiltY}°</label>
        <input
          type="range"
          min={-30}
          max={30}
          step={1}
          value={tiltY}
          onChange={(e) => setTiltY(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Profundidade: {depth}</label>
        <input
          type="range"
          min={0}
          max={20}
          step={1}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Perspectivas predefinidas</label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <Button
              key={p.key}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(p.key)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="card3d-highlight"
          type="checkbox"
          checked={highlight}
          onChange={(e) => setHighlight(e.target.checked)}
        />
        <label htmlFor="card3d-highlight" className="text-xs">
          Adicionar realce (gradiente claro)
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="card3d-shadow"
          type="checkbox"
          checked={shadowEnabled}
          onChange={(e) => setShadowEnabled(e.target.checked)}
        />
        <label htmlFor="card3d-shadow" className="text-xs">
          Adicionar sombra
        </label>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">Cor da sombra</label>
        <Input
          type="color"
          value={shadowColor}
          onChange={(e) => setShadowColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium">
          Opacidade da sombra: {shadowOpacity.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.1}
          max={0.6}
          step={0.05}
          value={shadowOpacity}
          onChange={(e) => setShadowOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={handleApply} className="w-full">
          Aplicar Tilt 3D
        </Button>
        <Button onClick={handleReset} variant="outline" className="w-full">
          Resetar Tilt
        </Button>
      </div>
    </div>
  );
}
