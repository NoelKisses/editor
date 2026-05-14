"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Waves } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// --- module-level helpers (pure, outside component) ---

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

type WaveType = "horizontal" | "vertical" | "radial" | "noise";

const WAVE_TYPES: { value: WaveType; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "radial", label: "Radial" },
  { value: "noise", label: "Ruído" },
];

// Simple pseudo-noise helper (module-level)
function pseudoNoise(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

// Apply wave pixel transformation to an ImageData
function applyWavePixels(
  srcData: ImageData,
  waveType: WaveType,
  amplitude: number,
  frequency: number,
  phase: number
): ImageData {
  const { width, height, data } = srcData;
  const output = new ImageData(width, height);
  const phaseRad = degToRad(phase);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let srcX = x;
      let srcY = y;

      switch (waveType) {
        case "horizontal":
          srcY = y + amplitude * Math.sin(2 * Math.PI * frequency * x + phaseRad);
          break;
        case "vertical":
          srcX = x + amplitude * Math.sin(2 * Math.PI * frequency * y + phaseRad);
          break;
        case "radial": {
          const cx = width / 2;
          const cy = height / 2;
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const angle = Math.atan2(y - cy, x - cx);
          const r = dist + amplitude * Math.sin(2 * Math.PI * frequency * dist + phaseRad);
          srcX = cx + r * Math.cos(angle);
          srcY = cy + r * Math.sin(angle);
          break;
        }
        case "noise":
          srcX = x + amplitude * (pseudoNoise(x * frequency, y * frequency + phaseRad / (2 * Math.PI)) * 2 - 1);
          srcY = y + amplitude * (pseudoNoise(x * frequency + 100, y * frequency + phaseRad / (2 * Math.PI)) * 2 - 1);
          break;
      }

      const sx = clamp(Math.round(srcX), 0, width - 1);
      const sy = clamp(Math.round(srcY), 0, height - 1);
      const srcIdx = (sy * width + sx) * 4;
      const dstIdx = (y * width + x) * 4;
      output.data[dstIdx] = data[srcIdx];
      output.data[dstIdx + 1] = data[srcIdx + 1];
      output.data[dstIdx + 2] = data[srcIdx + 2];
      output.data[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  return output;
}

// --- Component ---

interface ObjectWaveDistortionPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function ObjectWaveDistortionPanel({ fabricCanvas }: ObjectWaveDistortionPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const animatingRef = useRef(false);

  const [waveType, setWaveType] = useState<WaveType>("horizontal");
  const [amplitude, setAmplitude] = useState(20);
  const [frequency, setFrequency] = useState(0.05);
  const [phase, setPhase] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [speed, setSpeed] = useState(2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedObj, setSelectedObj] = useState<any>(null);

  // Sync canvasRef with fabricCanvas prop — ONLY inside useEffect
  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  // Track selected object
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onSelection = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = canvas.getActiveObject();
      queueMicrotask(() => {
        setSelectedObj(obj ?? null);
      });
    };

    const onCleared = () => {
      queueMicrotask(() => {
        setSelectedObj(null);
      });
    };

    canvas.on("selection:created", onSelection);
    canvas.on("selection:updated", onSelection);
    canvas.on("selection:cleared", onCleared);

    return () => {
      canvas.off("selection:created", onSelection);
      canvas.off("selection:updated", onSelection);
      canvas.off("selection:cleared", onCleared);
    };
  }, [fabricCanvas]);

  // Manage wave animation via Fabric.js animate (skewX oscillation)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (animate && selectedObj) {
      animatingRef.current = true;

      import("fabric").then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        const obj = selectedObj;

        const runAnim = () => {
          if (!animatingRef.current) return;
          obj.animate("skewX", amplitude, {
            duration: Math.round(1000 / frequency) / speed,
            onChange: canvas.renderAll.bind(canvas),
            onComplete: () => {
              if (!animatingRef.current) return;
              obj.animate("skewX", -amplitude, {
                duration: Math.round(1000 / frequency) / speed,
                onChange: canvas.renderAll.bind(canvas),
                onComplete: () => {
                  if (animatingRef.current) runAnim();
                },
                easing: f?.util?.ease?.easeInOutSine ?? undefined,
              });
            },
            easing: f?.util?.ease?.easeInOutSine ?? undefined,
          });
        };

        runAnim();
      });
    } else {
      animatingRef.current = false;
      if (selectedObj) {
        selectedObj.set({ skewX: 0, skewY: 0 });
        const canvas2 = canvasRef.current;
        if (canvas2) canvas2.renderAll();
      }
    }

    return () => {
      animatingRef.current = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [animate, selectedObj, amplitude, frequency, speed]);

  const handleApplyDistortion = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { toast.error("Canvas não disponível"); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = canvas.getActiveObject();
    if (!obj) { toast.error("Nenhum objeto selecionado"); return; }

    const origLeft = obj.left;
    const origTop = obj.top;

    const dataURL: string = obj.toDataURL({ format: "png", multiplier: 1 });

    const img = new Image();
    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = img.width;
      offscreen.height = img.height;
      const ctx = offscreen.getContext("2d");
      if (!ctx) { toast.error("Falha ao criar canvas offscreen"); return; }
      ctx.drawImage(img, 0, 0);

      const srcData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
      const distorted = applyWavePixels(srcData, waveType, amplitude, frequency, phase);
      ctx.putImageData(distorted, 0, 0);

      const resultURL = offscreen.toDataURL("image/png");

      import("fabric").then((m) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = m.fabric as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        f.Image.fromURL(resultURL, (fabricImg: any) => {
          fabricImg.set({ left: origLeft, top: origTop });
          canvas.remove(obj);
          canvas.add(fabricImg);
          canvas.setActiveObject(fabricImg);
          canvas.renderAll();
          toast.success("Distorção de onda aplicada!");
        });
      });
    };
    img.onerror = () => toast.error("Falha ao carregar imagem do objeto");
    img.src = dataURL;
  }, [waveType, amplitude, frequency, phase]);

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = canvas.getActiveObjects?.() ?? (canvas.getActiveObject() ? [canvas.getActiveObject()] : []);
    if (objs.length === 0) { toast.error("Nenhum objeto selecionado"); return; }
    objs.forEach((o) => o.set({ skewX: 0, skewY: 0, angle: 0 }));
    canvas.renderAll();
    toast.success("Transformações resetadas");
  }, []);

  // ---- render ----
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Waves className="w-5 h-5 text-muted-foreground" />
        <span className="font-semibold text-sm">Distorção de Onda</span>
      </div>

      {/* No selection message */}
      {!selectedObj && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Selecione um objeto no canvas para aplicar distorção de onda.
        </p>
      )}

      {/* Wave type selector */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Tipo de Onda</span>
        <div className="grid grid-cols-2 gap-1">
          {WAVE_TYPES.map((wt) => (
            <button
              key={wt.value}
              type="button"
              onClick={() => setWaveType(wt.value)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                waveType === wt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent"
              }`}
            >
              {wt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amplitude */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-muted-foreground">Amplitude</span>
          <span className="text-xs text-muted-foreground">{amplitude}</span>
        </div>
        <input
          type="range"
          min={1}
          max={80}
          step={1}
          value={amplitude}
          onChange={(e) => setAmplitude(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Frequency */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-muted-foreground">Frequência</span>
          <span className="text-xs text-muted-foreground">{frequency.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.02}
          max={0.3}
          step={0.01}
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Phase */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-muted-foreground">Fase</span>
          <span className="text-xs text-muted-foreground">{phase}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={phase}
          onChange={(e) => setPhase(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Animate toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="wave-animate-toggle"
          checked={animate}
          onChange={(e) => setAnimate(e.target.checked)}
          className="w-4 h-4 accent-primary cursor-pointer"
          disabled={!selectedObj}
        />
        <span className="text-xs font-medium select-none cursor-pointer" onClick={() => { if (selectedObj) setAnimate((v) => !v); }}>
          Animar Onda
        </span>
      </div>

      {/* Speed slider — only visible when animated */}
      {animate && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">Velocidade</span>
            <span className="text-xs text-muted-foreground">{speed.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={10}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleApplyDistortion}
          disabled={!selectedObj}
        >
          Aplicar Distorção
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={handleReset}
          disabled={!selectedObj}
        >
          Resetar
        </Button>
      </div>
    </div>
  );
}
