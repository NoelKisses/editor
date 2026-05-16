"use client";

import { useEffect, useRef, useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CanvasGradientMeshBgPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const MESH_PALETTES: Record<string, string[]> = {
  Sunset: ["#ff7e5f", "#feb47b", "#ff5e9c", "#a16ae8"],
  Ocean: ["#06b6d4", "#3b82f6", "#1e3a8a"],
  "Pastel Dream": ["#ffd1dc", "#c9b6ff", "#b6f5d8"],
  Vibrant: ["#ff00aa", "#fff200", "#00e5ff", "#a020f0"],
  Earth: ["#e7d3a1", "#9c8a4f", "#6b4f2a"],
  "Mono Blue": ["#dbeafe", "#60a5fa", "#1e3a8a"],
  Rosa: ["#ffb6c1", "#ff4d6d", "#ff7f50"],
  Floresta: ["#c8f0c0", "#3aaf5f", "#0b3d1f"],
};

const PALETTE_NAMES = Object.keys(MESH_PALETTES);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBlob(f: any, cx: number, cy: number, radius: number, color: string): any {
  const circle = new f.Circle({
    left: cx - radius,
    top: cy - radius,
    radius,
    originX: "left",
    originY: "top",
    selectable: false,
    evented: false,
    data: { meshBg: true },
  });

  const gradient = new f.Gradient({
    type: "radial",
    coords: {
      x1: radius,
      y1: radius,
      r1: 0,
      x2: radius,
      y2: radius,
      r2: radius,
    },
    colorStops: [
      { offset: 0, color: rgba(color, 1) },
      { offset: 0.6, color: rgba(color, 0.4) },
      { offset: 1, color: rgba(color, 0) },
    ],
  });

  circle.set("fill", gradient);
  return circle;
}

export function CanvasGradientMeshBgPanel({ fabricCanvas }: CanvasGradientMeshBgPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [paletteName, setPaletteName] = useState<string>("Sunset");
  const [blobCount, setBlobCount] = useState<number>(3);
  const [blobSize, setBlobSize] = useState<number>(0.7);
  const [opacity, setOpacity] = useState<number>(0.85);
  const [noiseOverlay, setNoiseOverlay] = useState<boolean>(false);
  const [randomize, setRandomize] = useState<boolean>(true);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const removeMesh = () => {
    const c = canvasRef.current;
    if (!c) {
      toast.error("Canvas não disponível");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs = c.getObjects().filter((o: any) => o?.data?.meshBg === true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objs.forEach((o: any) => c.remove(o));
    c.requestRenderAll();
  };

  const generateMesh = () => {
    const c = canvasRef.current;
    if (!c) {
      toast.error("Canvas não disponível");
      return;
    }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric ?? (m as any);

      // Remove existing mesh bg
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing = c.getObjects().filter((o: any) => o?.data?.meshBg === true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      existing.forEach((o: any) => c.remove(o));

      const palette = MESH_PALETTES[paletteName] ?? MESH_PALETTES.Sunset;
      const w = c.getWidth();
      const h = c.getHeight();

      // Base rect
      const base = new f.Rect({
        left: 0,
        top: 0,
        width: w,
        height: h,
        fill: palette[0],
        selectable: false,
        evented: false,
        opacity,
        data: { meshBg: true },
      });
      c.add(base);
      c.sendToBack(base);

      const radius = Math.max(w, h) * blobSize;

      for (let i = 0; i < blobCount; i++) {
        const color = palette[i % palette.length];
        let cx: number;
        let cy: number;

        if (randomize) {
          cx = Math.random() * w;
          cy = Math.random() * h;
        } else {
          const cols = Math.ceil(Math.sqrt(blobCount));
          const rows = Math.ceil(blobCount / cols);
          const col = i % cols;
          const row = Math.floor(i / cols);
          cx = ((col + 0.5) / cols) * w;
          cy = ((row + 0.5) / rows) * h;
        }

        const blob = buildBlob(f, cx, cy, radius, color);
        blob.set({
          opacity,
          globalCompositeOperation: i % 2 === 0 ? "multiply" : "screen",
        });
        c.add(blob);
      }

      if (noiseOverlay) {
        const grainCount = Math.floor((w * h) / 4000);
        for (let i = 0; i < grainCount; i++) {
          const grain = new f.Circle({
            left: Math.random() * w,
            top: Math.random() * h,
            radius: Math.random() * 0.8 + 0.2,
            fill: Math.random() > 0.5 ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            selectable: false,
            evented: false,
            data: { meshBg: true },
          });
          c.add(grain);
        }
      }

      c.requestRenderAll();
      toast.success("Fundo mesh gradient gerado");
    });
  };

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4" />
        <h3 className="text-sm font-semibold">Fundo Mesh Gradient</h3>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Paleta</span>
        <div className="grid grid-cols-2 gap-1.5">
          {PALETTE_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setPaletteName(name)}
              className={`rounded border px-2 py-1.5 text-xs transition ${
                paletteName === name
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="flex flex-col items-start gap-1">
                <span>{name}</span>
                <div className="flex gap-0.5">
                  {MESH_PALETTES[name].map((c, i) => (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-sm border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium">Quantidade de Blobs</span>
        <div className="grid grid-cols-4 gap-1.5">
          {[2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setBlobCount(n)}
              className={`rounded border px-2 py-1.5 text-xs transition ${
                blobCount === n
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Tamanho do Blob</span>
          <span className="text-xs text-muted-foreground">{blobSize.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.3}
          max={1.5}
          step={0.05}
          value={blobSize}
          onChange={(e) => setBlobSize(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Opacidade</span>
          <span className="text-xs text-muted-foreground">{opacity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={noiseOverlay}
          onChange={(e) => setNoiseOverlay(e.target.checked)}
        />
        <span>Overlay de ruído (grão)</span>
      </label>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={randomize}
          onChange={(e) => setRandomize(e.target.checked)}
        />
        <span>Aleatorizar posições</span>
      </label>

      <div className="flex flex-col gap-2">
        <Button type="button" onClick={generateMesh} className="w-full" size="sm">
          Gerar Fundo Mesh
        </Button>
        <Button
          type="button"
          onClick={removeMesh}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Remover Mesh
        </Button>
      </div>
    </div>
  );
}
