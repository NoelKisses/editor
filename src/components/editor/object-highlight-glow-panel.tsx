"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sun, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectHighlightGlowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type GlowType = "outer" | "inner" | "both" | "pulse" | "spotlight";

interface GlowConfig {
  type: GlowType;
  color: string;
  intensity: number;
  spread: number;
  innerIntensity: number;
  pulseEnabled: boolean;
  pulseSpeed: number;
  highlightEnabled: boolean;
  highlightAngle: number;
  highlightColor: string;
  highlightIntensity: number;
}

const DEFAULT_CONFIG: GlowConfig = {
  type: "outer",
  color: "#ffffff",
  intensity: 20,
  spread: 15,
  innerIntensity: 10,
  pulseEnabled: false,
  pulseSpeed: 1200,
  highlightEnabled: false,
  highlightAngle: 45,
  highlightColor: "#ffffff",
  highlightIntensity: 0.4,
};

const GLOW_PRESETS: { label: string; config: Partial<GlowConfig> }[] = [
  { label: "Branco suave", config: { type: "outer", color: "#ffffff", intensity: 15, spread: 10 } },
  { label: "Cyan neon", config: { type: "outer", color: "#00ffff", intensity: 25, spread: 20 } },
  { label: "Rosa neon", config: { type: "outer", color: "#ff00ff", intensity: 25, spread: 20 } },
  { label: "Dourado", config: { type: "both", color: "#ffd700", intensity: 20, spread: 12, innerIntensity: 8 } },
  { label: "Spotlight", config: { type: "spotlight", color: "#fffbe0", intensity: 30, spread: 25 } },
  { label: "Fogo", config: { type: "outer", color: "#ff6b00", intensity: 28, spread: 22 } },
];

function buildGlowShadow(config: GlowConfig): string {
  const { color, intensity, spread } = config;
  if (config.type === "outer" || config.type === "pulse") {
    return `0 0 ${intensity}px ${color}, 0 0 ${spread}px ${color}80, 0 0 ${spread * 2}px ${color}40`;
  }
  if (config.type === "inner") {
    return `inset 0 0 ${intensity}px ${color}, inset 0 0 ${spread}px ${color}80`;
  }
  if (config.type === "both") {
    return `0 0 ${intensity}px ${color}, 0 0 ${spread}px ${color}80, inset 0 0 ${config.innerIntensity}px ${color}60`;
  }
  if (config.type === "spotlight") {
    return `0 0 ${intensity}px ${color}, 0 0 ${spread * 1.5}px ${color}66, 0 0 ${spread * 3}px ${color}33`;
  }
  return `0 0 ${intensity}px ${color}`;
}

function applyGlowToObject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  config: GlowConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;
  const { color, intensity } = config;

  obj.set({
    shadow: new f.Shadow({
      color,
      offsetX: 0,
      offsetY: 0,
      blur: intensity,
    }),
    __glowConfig: config,
    __glowCSS: buildGlowShadow(config),
  });

  // Apply highlight as a separate stroke effect
  if (config.highlightEnabled) {
    const angle = (config.highlightAngle * Math.PI) / 180;
    const hx = Math.round(Math.cos(angle) * 2);
    const hy = Math.round(Math.sin(angle) * 2);
    obj.set({
      shadow: new f.Shadow({
        color,
        offsetX: hx,
        offsetY: hy,
        blur: intensity,
      }),
    });
  }
}

export function ObjectHighlightGlowPanel({ fabricCanvas, selectionVersion }: ObjectHighlightGlowPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [config, setConfig] = useState<GlowConfig>(DEFAULT_CONFIG);
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<unknown>(null);
  const configRef = useRef(config);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setHasObject(false); return; }
      setHasObject(true);
      if (obj.__glowConfig) setConfig(obj.__glowConfig);
    });
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(<K extends keyof GlowConfig>(key: K, val: GlowConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const applyGlow = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    import("fabric").then((m) => {
      applyGlowToObject(obj, config, m.fabric);
      cv.requestRenderAll();
      toast.success("Glow aplicado");
    });
  }, [config]);

  const stopPulse = useCallback(() => {
    if (animRef.current) { clearTimeout(animRef.current); animRef.current = null; }
    setIsAnimating(false);
  }, []);

  const startPulse = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    setIsAnimating(true);
    let phase = 0;

    const tick = () => {
      const cv2 = canvasRef.current as typeof fabricCanvas;
      if (!cv2) { stopPulse(); return; }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o: any = cv2.getActiveObject();
      if (!o) { stopPulse(); return; }

      const cfg = configRef.current;
      const t = (Math.sin((phase / cfg.pulseSpeed) * Math.PI * 2) + 1) / 2;
      const dynIntensity = Math.max(4, cfg.intensity * (0.3 + 0.7 * t));
      import("fabric").then((m) => {
        applyGlowToObject(o, { ...cfg, intensity: dynIntensity }, m.fabric);
        cv2.requestRenderAll();
      });
      phase = (phase + 16) % cfg.pulseSpeed;
      animRef.current = setTimeout(tick, 16);
    };

    tick();
    toast.success("Animação de glow iniciada");
  }, [stopPulse]);

  const removeGlow = useCallback(() => {
    stopPulse();
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) return;
    obj.set({ shadow: null, __glowConfig: null, __glowCSS: null });
    cv.requestRenderAll();
    setConfig(DEFAULT_CONFIG);
    toast.success("Glow removido");
  }, [stopPulse]);

  useEffect(() => () => { if (animRef.current) clearTimeout(animRef.current); }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Sun className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Highlight e Glow</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Sun className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto no canvas</p>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div className="flex items-center justify-center p-4 rounded border border-border bg-gray-900">
            <div className="w-16 h-10 rounded-md bg-primary/70"
              style={{ boxShadow: buildGlowShadow(config) }} />
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Presets</span>
            <div className="grid grid-cols-3 gap-1">
              {GLOW_PRESETS.map((p) => (
                <button key={p.label} onClick={() => setConfig((prev) => ({ ...prev, ...p.config }))}
                  className="py-1 rounded border border-border text-[7px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors truncate px-1">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Tipo</span>
            <div className="grid grid-cols-5 gap-1">
              {(["outer", "inner", "both", "pulse", "spotlight"] as GlowType[]).map((t) => (
                <button key={t} onClick={() => set("type", t)}
                  className={`py-0.5 rounded border text-[7px] capitalize transition-colors ${
                    config.type === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}>
                  {t === "outer" ? "Ext." : t === "inner" ? "Int." : t === "both" ? "Amb." : t === "pulse" ? "Pulso" : "Spot"}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-10">Cor</span>
            <input type="color" value={config.color} onChange={(e) => set("color", e.target.value)}
              className="w-6 h-5 rounded border border-border cursor-pointer" />
            <span className="text-[7px] font-mono text-muted-foreground">{config.color}</span>
          </div>

          {/* Intensity + spread */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Intensidade</span>
              <input type="range" min={2} max={60} value={config.intensity}
                onChange={(e) => set("intensity", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[7px] font-mono w-4">{config.intensity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Dispersão</span>
              <input type="range" min={4} max={80} value={config.spread}
                onChange={(e) => set("spread", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[7px] font-mono w-4">{config.spread}</span>
            </div>
            {(config.type === "inner" || config.type === "both") && (
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-muted-foreground w-16">Inner</span>
                <input type="range" min={2} max={40} value={config.innerIntensity}
                  onChange={(e) => set("innerIntensity", Number(e.target.value))}
                  className="flex-1 h-1 accent-primary" />
                <span className="text-[7px] font-mono w-4">{config.innerIntensity}</span>
              </div>
            )}
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
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[7px] text-muted-foreground w-16">Velocidade</span>
                <input type="range" min={400} max={4000} step={100} value={config.pulseSpeed}
                  onChange={(e) => set("pulseSpeed", Number(e.target.value))}
                  className="flex-1 h-1 accent-primary" />
                <span className="text-[7px] font-mono w-10">{(config.pulseSpeed / 1000).toFixed(1)}s</span>
              </div>
            )}
          </div>

          {/* Highlight */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={config.highlightEnabled}
                onChange={(e) => set("highlightEnabled", e.target.checked)}
                className="w-3 h-3 accent-primary" />
              <span className="text-[8px] font-medium">Highlight direcional</span>
            </label>
            {config.highlightEnabled && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[7px] text-muted-foreground w-16">Ângulo</span>
                <input type="range" min={0} max={360} step={5} value={config.highlightAngle}
                  onChange={(e) => set("highlightAngle", Number(e.target.value))}
                  className="flex-1 h-1 accent-primary" />
                <span className="text-[7px] font-mono w-8">{config.highlightAngle}°</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <button onClick={applyGlow}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Sun className="w-3 h-3" /> Aplicar
            </button>
            {config.pulseEnabled && (
              isAnimating ? (
                <button onClick={stopPulse}
                  className="px-3 py-2 rounded border border-yellow-500/50 text-yellow-500 text-[9px] hover:bg-yellow-500/10 transition-colors">
                  ■
                </button>
              ) : (
                <button onClick={startPulse}
                  className="px-3 py-2 rounded border border-green-500/50 text-green-500 text-[9px] hover:bg-green-500/10 transition-colors">
                  ▶
                </button>
              )
            )}
            <button onClick={removeGlow}
              className="px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Fabric.js usa shadow blur nativo · CSS completo em __glowCSS
          </p>
        </>
      )}
    </div>
  );
}
