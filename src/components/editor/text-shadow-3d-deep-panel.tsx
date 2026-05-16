"use client";

import { useEffect, useRef, useState } from "react";
import { Layers3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TextShadow3DDeepPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

function hexToRgbObj(hex: string): { r: number; g: number; b: number } {
  let normalized = hex.replace("#", "").trim();
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: (num >> 16) & 0xff,
    g: (num >> 8) & 0xff,
    b: num & 0xff,
  };
}

function rgbObjToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const a = hexToRgbObj(c1);
  const b = hexToRgbObj(c2);
  const clamped = Math.max(0, Math.min(1, t));
  return rgbObjToHex({
    r: a.r + (b.r - a.r) * clamped,
    g: a.g + (b.g - a.g) * clamped,
    b: a.b + (b.b - a.b) * clamped,
  });
}

const TEXT_TYPES = ["text", "i-text", "textbox"];

export function TextShadow3DDeepPanel({ fabricCanvas }: TextShadow3DDeepPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [depth, setDepth] = useState<number>(8);
  const [angle, setAngle] = useState<number>(45);
  const [step, setStep] = useState<number>(2);
  const [shadowColor, setShadowColor] = useState<string>("#333333");
  const [fadeColor, setFadeColor] = useState<string>("#aaaaaa");
  const [gradient, setGradient] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }

    const active = canvas.getActiveObjects
      ? canvas.getActiveObjects()
      : canvas.getActiveObject
        ? [canvas.getActiveObject()].filter(Boolean)
        : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textObjects = active.filter((obj: any) => obj && TEXT_TYPES.includes(obj.type));

    if (textObjects.length === 0) {
      toast.message("Selecione ao menos um texto para aplicar a sombra 3D");
      return;
    }

    setBusy(true);

    import("fabric")
      .then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        void f;

        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const clonePromises: Promise<any>[] = [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        textObjects.forEach((obj: any) => {
          for (let i = 1; i <= depth; i++) {
            const layerIndex = i;
            const t = depth > 1 ? (layerIndex - 1) / (depth - 1) : 0;
            const layerColor = gradient ? lerpColor(shadowColor, fadeColor, t) : shadowColor;

            clonePromises.push(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              new Promise<any>((resolve) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                obj.clone((cloned: any) => {
                  cloned.set({
                    left: obj.left + dx * step * layerIndex,
                    top: obj.top + dy * step * layerIndex,
                    fill: layerColor,
                    stroke: null,
                    selectable: false,
                  });
                  cloned.data = {
                    shadow3dLayer: true,
                    parentLeft: obj.left,
                    parentTop: obj.top,
                  };
                  canvas.add(cloned);
                  for (let k = 0; k < layerIndex; k++) {
                    if (typeof canvas.sendBackwards === "function") {
                      canvas.sendBackwards(cloned);
                    }
                  }
                  resolve(cloned);
                });
              }),
            );
          }
        });

        return Promise.all(clonePromises);
      })
      .then(() => {
        if (canvasRef.current && typeof canvasRef.current.requestRenderAll === "function") {
          canvasRef.current.requestRenderAll();
        }
        queueMicrotask(() => setBusy(false));
        toast.success("Sombra 3D aplicada");
      })
      .catch((err) => {
        queueMicrotask(() => setBusy(false));
        toast.error(`Falha ao aplicar sombra 3D: ${err?.message ?? "erro desconhecido"}`);
      });
  };

  const handleRemove = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    const all = canvas.getObjects ? canvas.getObjects() : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers = all.filter((o: any) => o && o.data && o.data.shadow3dLayer === true);
    if (layers.length === 0) {
      toast.message("Nenhuma sombra 3D para remover");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers.forEach((o: any) => canvas.remove(o));
    if (typeof canvas.requestRenderAll === "function") {
      canvas.requestRenderAll();
    }
    toast.success(`${layers.length} camada(s) removida(s)`);
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Layers3 className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Sombra 3D Profunda</h3>
      </div>

      <div className="space-y-1">
        <label htmlFor="depth-3d" className="text-xs font-medium">
          Profundidade: {depth} camadas
        </label>
        <input
          id="depth-3d"
          type="range"
          min={3}
          max={20}
          step={1}
          value={depth}
          onChange={(e) => setDepth(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="angle-3d" className="text-xs font-medium">
          Direção: {angle}°
        </label>
        <input
          id="angle-3d"
          type="range"
          min={0}
          max={360}
          step={1}
          value={angle}
          onChange={(e) => setAngle(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="step-3d" className="text-xs font-medium">
          Passo por camada: {step}px
        </label>
        <input
          id="step-3d"
          type="range"
          min={1}
          max={4}
          step={1}
          value={step}
          onChange={(e) => setStep(parseInt(e.target.value, 10))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="shadow-color-3d" className="text-xs font-medium">
          Cor da sombra
        </label>
        <Input
          id="shadow-color-3d"
          type="color"
          value={shadowColor}
          onChange={(e) => setShadowColor(e.target.value)}
          className="h-9 w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="gradient-3d"
          type="checkbox"
          checked={gradient}
          onChange={(e) => setGradient(e.target.checked)}
        />
        <label htmlFor="gradient-3d" className="text-xs font-medium">
          Gradiente entre cores
        </label>
      </div>

      <div className="space-y-1">
        <label htmlFor="fade-color-3d" className="text-xs font-medium">
          Cor final (gradiente)
        </label>
        <Input
          id="fade-color-3d"
          type="color"
          value={fadeColor}
          onChange={(e) => setFadeColor(e.target.value)}
          disabled={!gradient}
          className="h-9 w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={handleApply} disabled={busy}>
          {busy ? "Aplicando..." : "Aplicar 3D"}
        </Button>
        <Button type="button" variant="outline" onClick={handleRemove}>
          Remover Sombras 3D
        </Button>
      </div>
    </div>
  );
}
