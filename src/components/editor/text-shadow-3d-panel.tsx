"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BoxSelect, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TextShadow3dPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface Shadow3dConfig {
  depth: number;
  angle: number;
  baseColor: string;
  shadowColor: string;
  useFade: boolean;
  fadeStart: number;
  style: "flat" | "extrude" | "perspective" | "floating";
  addHighlight: boolean;
  highlightColor: string;
}

const DEFAULT_CONFIG: Shadow3dConfig = {
  depth: 6,
  angle: 135,
  baseColor: "#ffffff",
  shadowColor: "#1a1a2e",
  useFade: true,
  fadeStart: 0.8,
  style: "extrude",
  addHighlight: false,
  highlightColor: "#fffbe6",
};

const PRESETS: { label: string; config: Partial<Shadow3dConfig> }[] = [
  { label: "3D Clássico", config: { depth: 6, angle: 135, style: "extrude", useFade: false, baseColor: "#ffffff", shadowColor: "#333333" } },
  { label: "Flutuante", config: { depth: 10, angle: 120, style: "floating", useFade: true, fadeStart: 0.5, baseColor: "#ffffff", shadowColor: "#00000066" } },
  { label: "Neon 3D", config: { depth: 4, angle: 135, style: "extrude", useFade: false, baseColor: "#ffffff", shadowColor: "#00ffff" } },
  { label: "Perspectiva", config: { depth: 8, angle: 150, style: "perspective", useFade: true, fadeStart: 0.7, baseColor: "#ffdd00", shadowColor: "#8b6914" } },
  { label: "Pop Art", config: { depth: 5, angle: 135, style: "flat", useFade: false, baseColor: "#ff4757", shadowColor: "#000000" } },
  { label: "Vintage", config: { depth: 4, angle: 120, style: "extrude", useFade: false, baseColor: "#f5e6c8", shadowColor: "#8b4513", addHighlight: true, highlightColor: "#fffbe6" } },
];

function buildShadowLayers(config: Shadow3dConfig): string {
  const { depth, angle, shadowColor, useFade, fadeStart, style } = config;
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  const layers: string[] = [];

  for (let i = 1; i <= depth; i++) {
    const x = Math.round(dx * i);
    const y = Math.round(dy * i);
    let color = shadowColor;

    if (useFade) {
      const alpha = Math.max(0.05, fadeStart - (i / depth) * fadeStart);
      const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
      color = shadowColor.length === 7 ? shadowColor + hex : shadowColor.slice(0, 7) + hex;
    }

    if (style === "perspective") {
      const scaleOff = i * 0.2;
      layers.push(`${x}px ${y + scaleOff}px 0 ${color}`);
    } else if (style === "floating") {
      const blur = i === depth ? Math.round(depth * 1.5) : 0;
      layers.push(`${x}px ${y}px ${blur}px ${color}`);
    } else {
      layers.push(`${x}px ${y}px 0 ${color}`);
    }
  }

  if (config.addHighlight) {
    layers.unshift(`-1px -1px 0 ${config.highlightColor}`);
  }

  return layers.join(", ");
}

function apply3dShadow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  config: Shadow3dConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;
  const { depth, angle } = config;
  const rad = (angle * Math.PI) / 180;
  const lastX = Math.round(Math.cos(rad) * depth);
  const lastY = Math.round(Math.sin(rad) * depth);

  obj.set({
    fill: config.baseColor,
    shadow: new f.Shadow({
      color: config.shadowColor,
      offsetX: lastX,
      offsetY: lastY,
      blur: config.style === "floating" ? depth * 2 : 0,
    }),
    __shadow3dConfig: config,
    __shadow3dCSS: buildShadowLayers(config),
  });
}

export function TextShadow3dPanel({ fabricCanvas, selectionVersion }: TextShadow3dPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [config, setConfig] = useState<Shadow3dConfig>(DEFAULT_CONFIG);
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
      if (isText && obj.__shadow3dConfig) {
        setConfig(obj.__shadow3dConfig);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(<K extends keyof Shadow3dConfig>(key: K, val: Shadow3dConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setConfig((prev) => ({ ...prev, ...preset.config }));
    toast.success(`Preset "${preset.label}" carregado`);
  }, []);

  const applyEffect = useCallback(() => {
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
      apply3dShadow(obj, config, m.fabric);
      cv.requestRenderAll();
      toast.success(`Sombra 3D aplicada (${config.depth} camadas)`);
    });
  }, [config]);

  const removeEffect = useCallback(() => {
    const cv = canvasRef.current as typeof fabricCanvas;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) return;
    obj.set({ shadow: null, __shadow3dConfig: null, __shadow3dCSS: null });
    cv.requestRenderAll();
    setConfig(DEFAULT_CONFIG);
    toast.success("Sombra 3D removida");
  }, []);

  const previewCSS = buildShadowLayers(config);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <BoxSelect className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Sombra 3D</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BoxSelect className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto no canvas</p>
        </div>
      ) : (
        <>
          {/* Preview */}
          <div className="flex items-center justify-center p-4 rounded border border-border bg-gray-800">
            <span
              className="text-[22px] font-black select-none"
              style={{
                color: config.baseColor,
                textShadow: previewCSS,
                fontFamily: "Arial",
              }}
            >
              3D TEXT
            </span>
          </div>

          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Presets</span>
            <div className="grid grid-cols-3 gap-1">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className="py-1 rounded border border-border text-[7px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors truncate px-1">
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Estilo</span>
            <div className="grid grid-cols-4 gap-1">
              {(["flat", "extrude", "perspective", "floating"] as Shadow3dConfig["style"][]).map((s) => (
                <button key={s} onClick={() => set("style", s)}
                  className={`py-0.5 rounded border text-[7px] capitalize transition-colors ${
                    config.style === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}>
                  {s === "flat" ? "Plano" : s === "extrude" ? "Extrusão" : s === "perspective" ? "Perspect." : "Flutuante"}
                </button>
              ))}
            </div>
          </div>

          {/* Depth + angle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Profundidade</span>
              <input type="range" min={1} max={20} value={config.depth}
                onChange={(e) => set("depth", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[8px] font-mono w-4">{config.depth}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-muted-foreground w-16">Ângulo</span>
              <input type="range" min={0} max={360} step={5} value={config.angle}
                onChange={(e) => set("angle", Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
              <span className="text-[8px] font-mono w-8">{config.angle}°</span>
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Cor do texto</span>
              <div className="flex items-center gap-1">
                <input type="color" value={config.baseColor.slice(0, 7)}
                  onChange={(e) => set("baseColor", e.target.value)}
                  className="w-6 h-5 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{config.baseColor.slice(0, 7)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-muted-foreground">Cor da sombra</span>
              <div className="flex items-center gap-1">
                <input type="color" value={config.shadowColor.slice(0, 7)}
                  onChange={(e) => set("shadowColor", e.target.value)}
                  className="w-6 h-5 rounded border border-border cursor-pointer" />
                <span className="text-[7px] font-mono text-muted-foreground">{config.shadowColor.slice(0, 7)}</span>
              </div>
            </div>
          </div>

          {/* Fade */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={config.useFade}
                onChange={(e) => set("useFade", e.target.checked)}
                className="w-3 h-3 accent-primary" />
              <span className="text-[8px] font-medium">Degradê de opacidade nas camadas</span>
            </label>
            {config.useFade && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[7px] text-muted-foreground w-16">Início</span>
                <input type="range" min={0.2} max={1} step={0.05} value={config.fadeStart}
                  onChange={(e) => set("fadeStart", Number(e.target.value))}
                  className="flex-1 h-1 accent-primary" />
                <span className="text-[7px] font-mono w-6">{config.fadeStart}</span>
              </div>
            )}
          </div>

          {/* Highlight */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={config.addHighlight}
              onChange={(e) => set("addHighlight", e.target.checked)}
              className="w-3 h-3 accent-primary" />
            <span className="text-[8px] text-muted-foreground">Adicionar highlight superior</span>
          </label>
          {config.addHighlight && (
            <div className="flex items-center gap-1">
              <input type="color" value={config.highlightColor}
                onChange={(e) => set("highlightColor", e.target.value)}
                className="w-6 h-5 rounded border border-border cursor-pointer" />
              <span className="text-[7px] font-mono text-muted-foreground">{config.highlightColor}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={applyEffect}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <BoxSelect className="w-3 h-3" /> Aplicar Sombra 3D
            </button>
            <button onClick={removeEffect}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Fabric.js aplica a última camada como shadow nativo · CSS completo em __shadow3dCSS
          </p>
        </>
      )}
    </div>
  );
}
