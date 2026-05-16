"use client";

import { useEffect, useRef, useState } from "react";
import { Layers3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Text3dBlockPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

// Module-level helpers
function clampHex(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeHex(hex: string): string {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) {
    return "000000";
  }
  return h.toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex);
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clampHex(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - Math.max(0, Math.min(1, amount));
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    r + (255 - r) * factor,
    g + (255 - g) * factor,
    b + (255 - b) * factor,
  );
}

export function getThemeColors(
  theme: string,
): { front: string; side: string; outline: string } {
  switch (theme) {
    case "cartoon":
      return { front: "#ffcc00", side: darken("#ffcc00", 0.35), outline: "#000000" };
    case "game":
      return { front: "#00ffe1", side: "#1a0033", outline: "#000000" };
    case "madeira":
      return { front: "#a0673b", side: darken("#a0673b", 0.4), outline: "#3a1f0a" };
    case "metal":
      return { front: "#d8d8d8", side: "#3a3a3a", outline: "#1a1a1a" };
    case "bloco":
      return { front: "#ff5252", side: darken("#ff5252", 0.45), outline: "#000000" };
    case "sombra-longa":
      return { front: "#ffffff", side: "#222222", outline: "#000000" };
    default:
      return { front: "#ffcc00", side: "#7a6200", outline: "#000000" };
  }
}

const THEMES: { id: string; label: string }[] = [
  { id: "cartoon", label: "Cartoon" },
  { id: "game", label: "Game" },
  { id: "madeira", label: "Madeira" },
  { id: "metal", label: "Metal" },
  { id: "bloco", label: "Bloco" },
  { id: "sombra-longa", label: "Sombra Longa" },
];

const TEXT_TYPES = ["text", "i-text", "textbox"];

function genParentId(): string {
  return `t3db-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function Text3dBlockPanel({ fabricCanvas }: Text3dBlockPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  const [theme, setTheme] = useState<string>("cartoon");
  const [frontColor, setFrontColor] = useState<string>("#ffcc00");
  const [sideColor, setSideColor] = useState<string>(darken("#ffcc00", 0.35));
  const [outlineColor, setOutlineColor] = useState<string>("#000000");
  const [outlineWidth, setOutlineWidth] = useState<number>(3);
  const [depth, setDepth] = useState<number>(12);
  const [angle, setAngle] = useState<number>(45);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    queueMicrotask(() => {
      const colors = getThemeColors(theme);
      setFrontColor(colors.front);
      setSideColor(colors.side);
      setOutlineColor(colors.outline);
    });
  }, [theme]);

  const applyText3d = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }

    const activeObjects = canvas.getActiveObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textTargets = activeObjects.filter((obj: any) =>
      TEXT_TYPES.includes(obj?.type),
    );

    if (textTargets.length === 0) {
      toast.error("Selecione ao menos um objeto de texto");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric as any;
      if (!f) {
        toast.error("Falha ao carregar Fabric");
        return;
      }

      const rad = (angle * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      const step = 1;
      const count = Math.max(1, Math.round(depth));

      let createdCount = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      textTargets.forEach((target: any) => {
        const parentId = genParentId();
        const baseLeft = target.left ?? 0;
        const baseTop = target.top ?? 0;

        // Outline clone (deepest layer)
        target.clone(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (outlineClone: any) => {
            outlineClone.set({
              left: baseLeft + dx * (count + 1) * step,
              top: baseTop + dy * (count + 1) * step,
              fill: outlineColor,
              stroke: outlineColor,
              strokeWidth: Math.max(outlineWidth, 1) + 2,
              selectable: false,
              evented: false,
              data: { text3dBlock: true, parentId },
            });
            canvas.add(outlineClone);
            canvas.sendBackwards(outlineClone);
            createdCount++;

            // Side clones from deep to shallow
            for (let i = count; i >= 1; i--) {
              target.clone(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (sideClone: any) => {
                  sideClone.set({
                    left: baseLeft + dx * i * step,
                    top: baseTop + dy * i * step,
                    fill: sideColor,
                    stroke: theme === "bloco" ? sideColor : darken(sideColor, 0.1),
                    strokeWidth: theme === "bloco" ? 0 : 1,
                    selectable: false,
                    evented: false,
                    data: { text3dBlock: true, parentId },
                  });
                  canvas.add(sideClone);
                  canvas.sendBackwards(sideClone);
                  createdCount++;
                },
              );
            }

            // Style the original (front)
            target.set({
              fill: frontColor,
              stroke: outlineColor,
              strokeWidth: outlineWidth,
            });

            // Special theme tweaks for the original
            if (theme === "game") {
              target.set({
                shadow: new f.Shadow({
                  color: lighten(frontColor, 0.2),
                  blur: 18,
                  offsetX: 0,
                  offsetY: 0,
                }),
              });
            } else if (theme === "sombra-longa") {
              target.set({ stroke: outlineColor, strokeWidth: outlineWidth });
            } else if (theme === "metal") {
              target.set({
                shadow: new f.Shadow({
                  color: "rgba(0,0,0,0.4)",
                  blur: 4,
                  offsetX: 1,
                  offsetY: 1,
                }),
              });
            } else if (theme === "cartoon") {
              target.set({
                shadow: new f.Shadow({
                  color: "rgba(0,0,0,0.35)",
                  blur: 0,
                  offsetX: dx * 4,
                  offsetY: dy * 4,
                }),
              });
            }

            target.set({ data: { ...(target.data ?? {}), text3dBlockParent: parentId } });
            canvas.bringToFront(target);
          },
        );
      });

      canvas.requestRenderAll?.();
      toast.success(`Texto 3D Block aplicado (${createdCount} camadas)`);
    }).catch(() => {
      toast.error("Erro ao carregar fabric");
    });
  };

  const removeText3d = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }

    const allObjects = canvas.getObjects?.() ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = allObjects.filter((obj: any) => obj?.data?.text3dBlock === true);

    if (toRemove.length === 0) {
      toast.info("Nenhuma camada 3D Block encontrada");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toRemove.forEach((obj: any) => canvas.remove(obj));
    canvas.requestRenderAll?.();
    toast.success(`${toRemove.length} camada(s) removida(s)`);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Layers3 className="h-5 w-5" />
        <h3 className="text-sm font-semibold">Texto 3D Block</h3>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Tema</span>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`rounded-md border px-2 py-2 text-xs transition-colors ${
                theme === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">Cor frontal</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={frontColor}
            onChange={(e) => setFrontColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={frontColor}
            onChange={(e) => setFrontColor(e.target.value)}
            className="h-8"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">Cor lateral (profundidade)</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={sideColor}
            onChange={(e) => setSideColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={sideColor}
            onChange={(e) => setSideColor(e.target.value)}
            className="h-8"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium">Cor do contorno</span>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={outlineColor}
            onChange={(e) => setOutlineColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
          />
          <Input
            value={outlineColor}
            onChange={(e) => setOutlineColor(e.target.value)}
            className="h-8"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Espessura do contorno</span>
          <span className="text-xs text-muted-foreground">{outlineWidth}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={8}
          step={1}
          value={outlineWidth}
          onChange={(e) => setOutlineWidth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Profundidade</span>
          <span className="text-xs text-muted-foreground">{depth}px</span>
        </div>
        <input
          type="range"
          min={3}
          max={30}
          step={1}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Ângulo (direção)</span>
          <span className="text-xs text-muted-foreground">{angle}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={angle}
          onChange={(e) => setAngle(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button onClick={applyText3d} className="w-full">
          Aplicar Texto 3D
        </Button>
        <Button onClick={removeText3d} variant="outline" className="w-full">
          Remover Texto 3D
        </Button>
      </div>
    </div>
  );
}
