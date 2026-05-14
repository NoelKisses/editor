"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Waves, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface ObjectBorderAnimPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type BorderAnimStyle = "march" | "pulse" | "rainbow" | "glow" | "dash-race";

const ANIM_STYLES: { value: BorderAnimStyle; label: string; desc: string }[] = [
  { value: "march", label: "Formigas", desc: "Traço pontilhado se movendo" },
  { value: "pulse", label: "Pulso", desc: "Borda expande e contrai" },
  { value: "rainbow", label: "Arco-íris", desc: "Cores cíclicas na borda" },
  { value: "glow", label: "Brilho", desc: "Sombra pulsante" },
  { value: "dash-race", label: "Corrida", desc: "Traços correm pela borda" },
];

export function ObjectBorderAnimPanel({ fabricCanvas, selectionVersion }: ObjectBorderAnimPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [style, setStyle] = useState<BorderAnimStyle>("march");
  const [color, setColor] = useState("#00e5ff");
  const [speed, setSpeed] = useState(50);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const valid = !!obj && ["rect", "circle", "triangle", "polygon", "path", "textbox", "text", "i-text", "image"].includes(obj.type);
      setHasObject(valid);
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj ?? null;
  }, [fabricCanvas]);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
    setIsPlaying(false);
    const obj = getObject();
    if (obj) {
      obj.set({
        stroke: obj._origStroke ?? null,
        strokeWidth: obj._origStrokeWidth ?? 0,
        strokeDashArray: obj._origStrokeDash ?? null,
        strokeDashOffset: 0,
        shadow: obj._origShadow ?? null,
      });
      obj.setCoords();
      fabricCanvas.requestRenderAll();
    }
  }, [getObject, fabricCanvas]);

  const startAnimation = useCallback(() => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    if (isPlaying) { stopAnimation(); return; }

    // Store originals
    obj._origStroke = obj.stroke;
    obj._origStrokeWidth = obj.strokeWidth;
    obj._origStrokeDash = obj.strokeDashArray;
    obj._origShadow = obj.shadow;

    setIsPlaying(true);
    frameRef.current = 0;
    const intervalMs = Math.max(16, 100 - speed);

    const rainbowColors = ["#ff0000", "#ff7700", "#ffff00", "#00ff00", "#0000ff", "#8b00ff"];

    animRef.current = setInterval(() => {
      frameRef.current += 1;
      const f = frameRef.current;

      switch (style) {
        case "march":
          obj.set({
            stroke: color,
            strokeWidth,
            strokeDashArray: [10, 5],
            strokeDashOffset: -(f * 2) % 30,
          });
          break;
        case "pulse": {
          const pulse = Math.sin(f * 0.15) * 0.5 + 0.5;
          obj.set({
            stroke: color,
            strokeWidth: strokeWidth + pulse * strokeWidth,
          });
          break;
        }
        case "rainbow": {
          const ci = Math.floor(f / 8) % rainbowColors.length;
          obj.set({ stroke: rainbowColors[ci], strokeWidth });
          break;
        }
        case "glow": {
          import("fabric").then(m => {
            const fabric = m.fabric;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const f2 = fabric as any;
            const glowSize = 5 + Math.sin(frameRef.current * 0.1) * 10;
            obj.shadow = new f2.Shadow({
              color,
              blur: glowSize,
              offsetX: 0,
              offsetY: 0,
            });
            obj.set({ stroke: color, strokeWidth: 1 });
            fabricCanvas.requestRenderAll();
          });
          return;
        }
        case "dash-race":
          obj.set({
            stroke: color,
            strokeWidth,
            strokeDashArray: [20, 40],
            strokeDashOffset: -(f * 3) % 60,
          });
          break;
      }

      obj.setCoords();
      fabricCanvas.requestRenderAll();
    }, intervalMs);

    toast.success(`Animação de borda "${style}" iniciada`);
  }, [getObject, isPlaying, stopAnimation, style, color, speed, strokeWidth, fabricCanvas]);

  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Waves className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Borda Animada</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Waves className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para animar a borda</p>
        </div>
      ) : (
        <>
          {/* Style */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Estilo</span>
            <div className="flex flex-col gap-1">
              {ANIM_STYLES.map(s => (
                <button key={s.value} onClick={() => setStyle(s.value)}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded border text-left transition-colors ${style === s.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                  <div className="flex-1">
                    <span className={`text-[9px] font-medium ${style === s.value ? "text-primary" : ""}`}>{s.label}</span>
                    <p className="text-[7px] text-muted-foreground">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Cor da Borda</span>
            <div className="flex items-center gap-2">
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-7 h-6 rounded border border-border cursor-pointer" />
              <span className="text-[8px] font-mono text-muted-foreground">{color}</span>
            </div>
          </div>

          {/* Stroke width */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Espessura</span>
              <span className="text-[9px] tabular-nums">{strokeWidth}px</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={strokeWidth}
              onChange={e => setStrokeWidth(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Speed */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Velocidade</span>
              <span className="text-[9px] tabular-nums">{speed}%</span>
            </div>
            <input type="range" min={10} max={90} step={10} value={speed}
              onChange={e => setSpeed(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Play/Stop */}
          <button onClick={startAnimation}
            className={`flex items-center justify-center gap-1 py-2 rounded border text-[9px] font-medium transition-colors ${isPlaying ? "border-destructive text-destructive hover:bg-destructive/10" : "border-primary text-primary hover:bg-primary/10"}`}>
            {isPlaying ? <><Square className="w-3 h-3" /> Parar</> : <><Play className="w-3 h-3" /> Animar Borda</>}
          </button>

          {isPlaying && (
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] text-primary">Animação em execução</span>
            </div>
          )}

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Preview ao vivo — não exportado com a imagem
          </p>
        </>
      )}
    </div>
  );
}
