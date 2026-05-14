"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ImageNoiseTexturePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type NoiseType = "grain" | "static" | "dots" | "lines" | "crosshatch" | "watercolor";
type BlendMode = "multiply" | "screen" | "overlay" | "soft-light" | "normal";

interface NoiseConfig {
  type: NoiseType;
  intensity: number;
  scale: number;
  opacity: number;
  color: string;
  blendMode: BlendMode;
  animated: boolean;
}

const DEFAULT_CONFIG: NoiseConfig = {
  type: "grain",
  intensity: 40,
  scale: 1,
  opacity: 0.35,
  color: "#000000",
  blendMode: "multiply",
  animated: false,
};

const NOISE_TYPES: { value: NoiseType; label: string }[] = [
  { value: "grain", label: "Grain" },
  { value: "static", label: "Estático" },
  { value: "dots", label: "Pontos" },
  { value: "lines", label: "Linhas" },
  { value: "crosshatch", label: "Xadrez" },
  { value: "watercolor", label: "Aquarela" },
];

function generateNoiseCanvas(type: NoiseType, w: number, h: number, config: NoiseConfig): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const { intensity, scale, color } = config;

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  if (type === "grain" || type === "static") {
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = type === "grain"
        ? Math.random() < 0.5 ? Math.random() * intensity : 0
        : Math.random() * intensity;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = n * 2.5;
    }
    ctx.putImageData(imageData, 0, 0);
  } else if (type === "dots") {
    const step = Math.max(2, Math.round(6 / scale));
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        if (Math.random() < intensity / 100) {
          ctx.fillStyle = `rgba(${r},${g},${b},${0.3 + Math.random() * 0.7})`;
          ctx.beginPath();
          ctx.arc(x, y, Math.random() * 1.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (type === "lines") {
    const spacing = Math.max(2, Math.round(8 / scale));
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += spacing) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${(Math.random() * 0.3 + 0.05) * (intensity / 100)})`;
      ctx.beginPath();
      ctx.moveTo(0, y + Math.random() * 2 - 1);
      ctx.lineTo(w, y + Math.random() * 2 - 1);
      ctx.stroke();
    }
  } else if (type === "crosshatch") {
    const spacing = Math.max(3, Math.round(10 / scale));
    ctx.lineWidth = 0.4;
    for (let x = -h; x < w + h; x += spacing) {
      const alpha = (Math.random() * 0.2 + 0.05) * (intensity / 100);
      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - h, h); ctx.stroke();
    }
  } else if (type === "watercolor") {
    for (let i = 0; i < (intensity * 0.8); i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const radius = 10 + Math.random() * 40 * scale;
      const alpha = 0.01 + Math.random() * 0.08;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas;
}

export function ImageNoiseTexturePanel({ fabricCanvas }: ImageNoiseTexturePanelProps) {
  const [config, setConfig] = useState<NoiseConfig>(DEFAULT_CONFIG);
  const [applying, setApplying] = useState(false);
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const set = useCallback(<K extends keyof NoiseConfig>(key: K, val: NoiseConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const applyTexture = useCallback(() => {
    const canvas = canvasRef.current as typeof fabricCanvas;
    if (!canvas) { toast.error("Canvas não disponível"); return; }
    setApplying(true);

    const cw = canvas.getWidth();
    const ch = canvas.getHeight();

    try {
      const noiseCanvas = generateNoiseCanvas(config.type, cw, ch, config);
      const dataURL = noiseCanvas.toDataURL();

      import("fabric").then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        f.Image.fromURL(dataURL, (img: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const imgObj = img as any;
          imgObj.set({
            left: 0,
            top: 0,
            opacity: config.opacity,
            selectable: true,
            evented: true,
            globalCompositeOperation: config.blendMode,
            data: { noiseTexture: true, noiseType: config.type },
          });
          canvas.add(imgObj);
          canvas.requestRenderAll();
          setApplying(false);
          toast.success(`Textura "${config.type}" aplicada`);
        });
      });
    } catch {
      setApplying(false);
      toast.error("Erro ao gerar textura");
    }
  }, [config]);

  const removeTextures = useCallback(() => {
    const canvas = canvasRef.current as typeof fabricCanvas;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toRemove = canvas.getObjects().filter((o: any) => o.data?.noiseTexture);
    toRemove.forEach((o: unknown) => canvas.remove(o));
    canvas.requestRenderAll();
    toast.success(`${toRemove.length} textura(s) removida(s)`);
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Textura de Ruído</span>
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Tipo de textura</span>
        <div className="grid grid-cols-3 gap-1">
          {NOISE_TYPES.map((t) => (
            <button key={t.value} onClick={() => set("type", t.value)}
              className={`py-1 rounded border text-[7px] transition-colors ${
                config.type === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground w-16">Intensidade</span>
          <input type="range" min={5} max={100} value={config.intensity}
            onChange={(e) => set("intensity", Number(e.target.value))}
            className="flex-1 h-1 accent-primary" />
          <span className="text-[7px] font-mono w-6">{config.intensity}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground w-16">Escala</span>
          <input type="range" min={0.5} max={4} step={0.25} value={config.scale}
            onChange={(e) => set("scale", Number(e.target.value))}
            className="flex-1 h-1 accent-primary" />
          <span className="text-[7px] font-mono w-6">{config.scale}x</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-muted-foreground w-16">Opacidade</span>
          <input type="range" min={0.05} max={1} step={0.05} value={config.opacity}
            onChange={(e) => set("opacity", Number(e.target.value))}
            className="flex-1 h-1 accent-primary" />
          <span className="text-[7px] font-mono w-8">{Math.round(config.opacity * 100)}%</span>
        </div>
      </div>

      {/* Color + blend */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Cor</span>
          <div className="flex items-center gap-1">
            <input type="color" value={config.color} onChange={(e) => set("color", e.target.value)}
              className="w-6 h-5 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{config.color}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Blend</span>
          <select value={config.blendMode} onChange={(e) => set("blendMode", e.target.value as BlendMode)}
            className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[7px] focus:outline-none focus:border-primary">
            {(["multiply", "screen", "overlay", "soft-light", "normal"] as BlendMode[]).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={applyTexture} disabled={applying}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-50">
          <Plus className="w-3 h-3" /> {applying ? "Gerando..." : "Aplicar textura"}
        </button>
        <button onClick={removeTextures}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Textura cobre o canvas inteiro · modo blend via globalCompositeOperation
      </p>
    </div>
  );
}
