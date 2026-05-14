"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Zap, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextNeonEffectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface NeonConfig {
  coreColor: string;
  glowColor: string;
  intensity: number; // 1-5
  pulseEnabled: boolean;
  pulseSpeed: number; // ms per cycle
  flickerEnabled: boolean;
  style: "classic" | "outline" | "double" | "retro";
}

const DEFAULT_CONFIG: NeonConfig = {
  coreColor: "#ffffff",
  glowColor: "#00ffff",
  intensity: 3,
  pulseEnabled: false,
  pulseSpeed: 1500,
  flickerEnabled: false,
  style: "classic",
};

const NEON_PRESETS: { label: string; coreColor: string; glowColor: string; style: NeonConfig["style"] }[] = [
  { label: "Cyan", coreColor: "#ffffff", glowColor: "#00ffff", style: "classic" },
  { label: "Pink", coreColor: "#ffffff", glowColor: "#ff00ff", style: "classic" },
  { label: "Green", coreColor: "#ffffff", glowColor: "#00ff44", style: "classic" },
  { label: "Orange", coreColor: "#ffffff", glowColor: "#ff6600", style: "classic" },
  { label: "Purple", coreColor: "#cc00ff", glowColor: "#8800ff", style: "double" },
  { label: "Red Hot", coreColor: "#ffdddd", glowColor: "#ff0033", style: "outline" },
  { label: "Gold", coreColor: "#ffffc0", glowColor: "#ffd700", style: "retro" },
  { label: "Ice", coreColor: "#eef8ff", glowColor: "#88ddff", style: "double" },
];

function buildShadowCSS(config: NeonConfig): string {
  const { glowColor, intensity } = config;
  const steps = intensity;
  const layers: string[] = [];

  if (config.style === "classic") {
    layers.push(`0 0 ${4 * steps}px ${glowColor}`);
    layers.push(`0 0 ${8 * steps}px ${glowColor}`);
    layers.push(`0 0 ${14 * steps}px ${glowColor}`);
    layers.push(`0 0 ${20 * steps}px ${glowColor}80`);
  } else if (config.style === "outline") {
    layers.push(`0 0 2px ${glowColor}`);
    layers.push(`0 0 ${6 * steps}px ${glowColor}`);
    layers.push(`0 0 ${12 * steps}px ${glowColor}aa`);
    layers.push(`1px 0 ${4 * steps}px ${glowColor}66`);
    layers.push(`-1px 0 ${4 * steps}px ${glowColor}66`);
  } else if (config.style === "double") {
    const inner = glowColor + "ff";
    const outer = glowColor + "66";
    layers.push(`0 0 ${3 * steps}px ${inner}`);
    layers.push(`0 0 ${6 * steps}px ${inner}`);
    layers.push(`0 0 ${14 * steps}px ${outer}`);
    layers.push(`0 0 ${30 * steps}px ${outer}`);
  } else if (config.style === "retro") {
    layers.push(`2px 2px 0 ${glowColor}aa`);
    layers.push(`-2px -2px 0 ${glowColor}66`);
    layers.push(`0 0 ${8 * steps}px ${glowColor}`);
    layers.push(`0 0 ${16 * steps}px ${glowColor}88`);
  }

  return layers.join(", ");
}

function applyNeonToObject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  config: NeonConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;
  const shadowCSS = buildShadowCSS(config);
  const layers = shadowCSS.split(", ");
  // Apply the primary (first) glow layer as Fabric native shadow
  // Use the most visually impactful layer: the widest blur
  const primary = layers[layers.length - 1];
  const parts = primary.trim().split(" ");
  const blur = parseFloat(parts[2]) || 20;

  obj.set({
    fill: config.coreColor,
    shadow: new f.Shadow({
      color: config.glowColor,
      offsetX: 0,
      offsetY: 0,
      blur: blur,
    }),
    __neonConfig: config,
    __neonShadowCSS: shadowCSS,
  });
}

export function TextNeonEffectPanel({ fabricCanvas, selectionVersion }: TextNeonEffectPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [config, setConfig] = useState<NeonConfig>(DEFAULT_CONFIG);
  const [isAnimating, setIsAnimating] = useState(false);
  const animFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const isText = obj && (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox");
      setHasText(isText);
      if (isText && obj.__neonConfig) {
        setConfig(obj.__neonConfig);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(<K extends keyof NeonConfig>(key: K, value: NeonConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyNeon = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }
    if (obj.type !== "i-text" && obj.type !== "text" && obj.type !== "textbox") {
      toast.error("Apenas objetos de texto suportados");
      return;
    }
    import("fabric").then((m) => {
      applyNeonToObject(obj, config, m.fabric);
      cv.requestRenderAll();
      toast.success("Efeito Neon aplicado");
    });
  }, [config]);

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current) {
      clearTimeout(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const startPulse = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }

    setIsAnimating(true);
    let phase = 0;

    const tick = () => {
      if (!canvasRef.current) return;
      const cv2 = canvasRef.current as typeof fabricCanvas;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o: any = cv2.getActiveObject();
      if (!o) { stopAnimation(); return; }

      const t = (Math.sin((phase / config.pulseSpeed) * Math.PI * 2) + 1) / 2;
      const flickerMult = config.flickerEnabled ? (Math.random() > 0.05 ? 1 : 0.2) : 1;
      const intensity = Math.max(1, Math.round(1 + t * (config.intensity - 1) * flickerMult));

      import("fabric").then((m) => {
        applyNeonToObject(o, { ...config, intensity }, m.fabric);
        cv2.requestRenderAll();
      });

      phase = (phase + 16) % config.pulseSpeed;
      animFrameRef.current = setTimeout(tick, 16);
    };

    tick();
    toast.success("Animação neon iniciada");
  }, [config, stopAnimation]);

  const removeNeon = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) return;
    stopAnimation();
    obj.set({ shadow: null, __neonConfig: null, __neonShadowCSS: null });
    cv.requestRenderAll();
    setConfig(DEFAULT_CONFIG);
    toast.success("Efeito neon removido");
  }, [stopAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Efeito Neon</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Zap className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto no canvas</p>
        </div>
      ) : (
        <>
          {/* Live preview */}
          <div className="flex items-center justify-center p-3 rounded border border-border bg-black">
            <span
              className="text-[18px] font-bold select-none"
              style={{
                color: config.coreColor,
                textShadow: buildShadowCSS(config),
                fontFamily: "Arial",
              }}
            >
              NEON
            </span>
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Presets</span>
            <div className="grid grid-cols-4 gap-1">
              {NEON_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setConfig((prev) => ({ ...prev, coreColor: p.coreColor, glowColor: p.glowColor, style: p.style }))}
                  className="py-1 rounded border border-border text-[7px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                  style={{ textShadow: `0 0 6px ${p.glowColor}` }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Estilo</span>
            <div className="grid grid-cols-4 gap-1">
              {(["classic", "outline", "double", "retro"] as NeonConfig["style"][]).map((s) => (
                <button
                  key={s}
                  onClick={() => set("style", s)}
                  className={`py-1 rounded border text-[7px] capitalize transition-colors ${
                    config.style === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Cor do texto</span>
              <div className="flex items-center gap-1">
                <input type="color" value={config.coreColor}
                  onChange={(e) => set("coreColor", e.target.value)}
                  className="w-6 h-5 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{config.coreColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Cor do glow</span>
              <div className="flex items-center gap-1">
                <input type="color" value={config.glowColor}
                  onChange={(e) => set("glowColor", e.target.value)}
                  className="w-6 h-5 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{config.glowColor}</span>
              </div>
            </div>
          </div>

          {/* Intensity */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-16">Intensidade</span>
            <input type="range" min={1} max={5} step={1} value={config.intensity}
              onChange={(e) => set("intensity", Number(e.target.value))}
              className="flex-1 h-1 accent-primary" />
            <span className="text-[8px] font-mono w-4">{config.intensity}</span>
          </div>

          {/* Pulse */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={config.pulseEnabled}
                onChange={(e) => set("pulseEnabled", e.target.checked)}
                className="w-3 h-3 accent-primary" />
              <span className="text-[8px] font-medium">Animação de pulso</span>
            </label>
            {config.pulseEnabled && (
              <>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[7px] text-muted-foreground w-16">Velocidade</span>
                  <input type="range" min={500} max={4000} step={100} value={config.pulseSpeed}
                    onChange={(e) => set("pulseSpeed", Number(e.target.value))}
                    className="flex-1 h-1 accent-primary" />
                  <span className="text-[7px] font-mono w-10 text-right">{(config.pulseSpeed / 1000).toFixed(1)}s</span>
                </div>
                <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                  <input type="checkbox" checked={config.flickerEnabled}
                    onChange={(e) => set("flickerEnabled", e.target.checked)}
                    className="w-3 h-3 accent-primary" />
                  <span className="text-[8px] text-muted-foreground">Efeito de flicker</span>
                </label>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <button onClick={applyNeon}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Zap className="w-3 h-3" /> Aplicar
            </button>
            {config.pulseEnabled && (
              isAnimating ? (
                <button onClick={stopAnimation}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-yellow-500/50 text-yellow-500 text-[9px] hover:bg-yellow-500/10 transition-colors">
                  <Square className="w-3 h-3" />
                </button>
              ) : (
                <button onClick={startPulse}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-green-500/50 text-green-500 text-[9px] hover:bg-green-500/10 transition-colors">
                  <Play className="w-3 h-3" />
                </button>
              )
            )}
            <button onClick={removeNeon}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Fabric.js aplica glow principal · CSS completo em __neonShadowCSS
          </p>
        </>
      )}
    </div>
  );
}
