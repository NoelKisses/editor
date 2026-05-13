"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface TextAnimationPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type AnimationType = "fade" | "typewriter" | "bounce" | "slide-in" | "zoom";

interface AnimationConfig {
  type: AnimationType;
  duration: number;
  delay: number;
  loop: boolean;
}

const ANIMATION_TYPES: { value: AnimationType; label: string; desc: string }[] = [
  { value: "fade", label: "Fade In/Out", desc: "Opacidade de 0 a 1" },
  { value: "typewriter", label: "Máquina de Escrever", desc: "Revela o texto letra a letra" },
  { value: "bounce", label: "Bounce", desc: "Efeito elástico de entrada" },
  { value: "slide-in", label: "Deslizar", desc: "Entra pela esquerda" },
  { value: "zoom", label: "Zoom In", desc: "Escala de 0 até tamanho final" },
];

export function TextAnimationPanel({ fabricCanvas, selectionVersion }: TextAnimationPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [config, setConfig] = useState<AnimationConfig>({
    type: "fade",
    duration: 1000,
    delay: 0,
    loop: false,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = !!obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text");
      setHasText(isText);
    });
  }, [fabricCanvas, selectionVersion]);

  const getTextObj = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text") ? obj : null;
  }, [fabricCanvas]);

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      clearTimeout(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
    const obj = getTextObj();
    if (obj) {
      obj.set({ opacity: 1, scaleX: obj._origScaleX ?? obj.scaleX, scaleY: obj._origScaleY ?? obj.scaleY, left: obj._origLeft ?? obj.left });
      obj.setCoords();
      fabricCanvas.requestRenderAll();
    }
  }, [getTextObj, fabricCanvas]);

  const playAnimation = useCallback(() => {
    const obj = getTextObj();
    if (!obj) { toast.error("Selecione um texto"); return; }

    if (isPlaying) { stopAnimation(); return; }

    // Store original values
    obj._origScaleX = obj.scaleX;
    obj._origScaleY = obj.scaleY;
    obj._origLeft = obj.left;
    obj._origOpacity = obj.opacity ?? 1;
    const origText = obj.text ?? "";

    setIsPlaying(true);
    const { duration, type } = config;

    const step = (elapsed: number) => {
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out

      switch (type) {
        case "fade":
          obj.set({ opacity: ease });
          break;
        case "bounce": {
          const bounce = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
          obj.set({ scaleX: bounce * (obj._origScaleX ?? 1), scaleY: bounce * (obj._origScaleY ?? 1) });
          break;
        }
        case "slide-in": {
          const offsetX = (1 - ease) * -120;
          obj.set({ left: (obj._origLeft ?? 0) + offsetX, opacity: ease });
          break;
        }
        case "zoom":
          obj.set({ scaleX: ease * (obj._origScaleX ?? 1), scaleY: ease * (obj._origScaleY ?? 1), opacity: ease });
          break;
        case "typewriter": {
          const chars = Math.floor(ease * origText.length);
          obj.set({ text: origText.slice(0, chars) });
          break;
        }
      }
      obj.setCoords();
      fabricCanvas.requestRenderAll();

      if (t < 1) {
        animFrameRef.current = setTimeout(() => step(Date.now() - startTimeRef.current), 16);
      } else {
        // Restore text for typewriter
        if (type === "typewriter") obj.set({ text: origText });
        obj.setCoords();
        fabricCanvas.requestRenderAll();
        if (config.loop) {
          // Reset and replay
          obj.set({ opacity: 0 });
          startTimeRef.current = Date.now();
          animFrameRef.current = setTimeout(() => step(0), config.delay);
        } else {
          setIsPlaying(false);
          animFrameRef.current = null;
        }
      }
    };

    // Initial state for animation
    switch (type) {
      case "fade": case "slide-in": case "zoom": obj.set({ opacity: 0 }); break;
      case "bounce": obj.set({ scaleX: 0, scaleY: 0 }); break;
      case "typewriter": obj.set({ text: "" }); break;
    }

    animFrameRef.current = setTimeout(() => {
      startTimeRef.current = Date.now();
      step(0);
    }, config.delay);

    toast.success(`Animação "${config.type}" iniciada`);
  }, [getTextObj, isPlaying, stopAnimation, config, fabricCanvas]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Animação de Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Activity className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para animar</p>
        </div>
      ) : (
        <>
          {/* Animation type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tipo de Animação</span>
            <div className="flex flex-col gap-1">
              {ANIMATION_TYPES.map(a => (
                <button key={a.value} onClick={() => setConfig(c => ({ ...c, type: a.value }))}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded border text-left transition-colors ${config.type === a.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <div className="flex-1">
                    <span className={`text-[9px] font-medium ${config.type === a.value ? "text-primary" : ""}`}>{a.label}</span>
                    <p className="text-[7px] text-muted-foreground">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Duração</span>
              <span className="text-[9px] tabular-nums">{config.duration}ms</span>
            </div>
            <input type="range" min={200} max={3000} step={100} value={config.duration}
              onChange={e => setConfig(c => ({ ...c, duration: Number(e.target.value) }))}
              className="w-full accent-primary h-1" />
          </div>

          {/* Delay */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Atraso</span>
              <span className="text-[9px] tabular-nums">{config.delay}ms</span>
            </div>
            <input type="range" min={0} max={2000} step={100} value={config.delay}
              onChange={e => setConfig(c => ({ ...c, delay: Number(e.target.value) }))}
              className="w-full accent-primary h-1" />
          </div>

          {/* Loop */}
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Loop</span>
            <button onClick={() => setConfig(c => ({ ...c, loop: !c.loop }))}
              className={`w-8 h-4 rounded-full transition-colors relative ${config.loop ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${config.loop ? "left-4" : "left-0.5"}`} />
            </button>
          </div>

          {/* Play/Stop */}
          <button onClick={playAnimation}
            className={`flex items-center justify-center gap-1 py-2 rounded border text-[9px] font-medium transition-colors ${isPlaying ? "border-destructive text-destructive hover:bg-destructive/10" : "border-primary text-primary hover:bg-primary/10"}`}>
            {isPlaying ? <><Square className="w-3 h-3" /> Parar</> : <><Play className="w-3 h-3" /> Reproduzir</>}
          </button>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Preview ao vivo no canvas — não exportado
          </p>
        </>
      )}
    </div>
  );
}
