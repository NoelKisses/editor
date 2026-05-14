"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";

interface ObjectOpacityMapPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type OpacityEffectType =
  | "uniforme"
  | "fade-entrada"
  | "fade-saida"
  | "centro-fade"
  | "bordas-fade"
  | "pulso";

interface OpacityMapConfig {
  type: OpacityEffectType;
  opacity: number;
  duration: number;
}

const DEFAULT_CONFIG: OpacityMapConfig = {
  type: "uniforme",
  opacity: 0.8,
  duration: 1200,
};

const EFFECT_TYPES: { key: OpacityEffectType; label: string }[] = [
  { key: "uniforme", label: "Uniforme" },
  { key: "fade-entrada", label: "Fade Entrada" },
  { key: "fade-saida", label: "Fade Saída" },
  { key: "centro-fade", label: "Centro Fade" },
  { key: "bordas-fade", label: "Bordas Fade" },
  { key: "pulso", label: "Pulso" },
];

function applyOpacityEffect(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  config: OpacityMapConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;

  if (config.type === "uniforme") {
    obj.set({ opacity: config.opacity, shadow: null });
  } else if (config.type === "fade-entrada") {
    obj.set({
      opacity: config.opacity,
      shadow: new f.Shadow({
        color: "rgba(0,0,0,0.5)",
        offsetX: -20,
        offsetY: 0,
        blur: 30,
      }),
      __opacityMapConfig: config,
    });
  } else if (config.type === "fade-saida") {
    obj.set({
      opacity: config.opacity,
      shadow: new f.Shadow({
        color: "rgba(0,0,0,0.5)",
        offsetX: 20,
        offsetY: 0,
        blur: 30,
      }),
      __opacityMapConfig: config,
    });
  } else if (config.type === "centro-fade") {
    obj.set({
      opacity: config.opacity,
      shadow: null,
      __opacityMapConfig: config,
    });
  } else if (config.type === "bordas-fade") {
    obj.set({
      opacity: config.opacity * 0.6,
      shadow: new f.Shadow({
        color: "rgba(255,255,255,0.3)",
        offsetX: 0,
        offsetY: 0,
        blur: 15,
      }),
      __opacityMapConfig: config,
    });
  } else if (config.type === "pulso") {
    obj.set({
      opacity: config.opacity,
      shadow: null,
      __opacityMapConfig: config,
    });
  }
}

export function ObjectOpacityMapPanel({
  fabricCanvas,
  selectionVersion,
}: ObjectOpacityMapPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [config, setConfig] = useState<OpacityMapConfig>(DEFAULT_CONFIG);
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
      if (!obj) {
        setHasObject(false);
        return;
      }
      setHasObject(true);
      if (obj.__opacityMapConfig) setConfig(obj.__opacityMapConfig);
    });
  }, [fabricCanvas, selectionVersion]);

  const setField = useCallback(
    <K extends keyof OpacityMapConfig>(key: K, val: OpacityMapConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: val }));
    },
    []
  );

  const applyEffect = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cv = canvasRef.current as any;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto");
      return;
    }
    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = (m as any).fabric ?? m;
      applyOpacityEffect(obj, config, f);
      cv.requestRenderAll();
      toast.success("Efeito de opacidade aplicado");
    });
  }, [config]);

  const stopPulse = useCallback(() => {
    if (animRef.current) {
      clearTimeout(animRef.current);
      animRef.current = null;
    }
    setIsAnimating(false);
  }, []);

  const startPulse = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cv = canvasRef.current as any;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) {
      toast.error("Selecione um objeto");
      return;
    }

    setIsAnimating(true);
    let phase = 0;

    const tick = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cv2 = canvasRef.current as any;
      if (!cv2) {
        stopPulse();
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const o: any = cv2.getActiveObject();
      if (!o) {
        stopPulse();
        return;
      }

      const cfg = configRef.current;
      const t = (Math.sin((phase / cfg.duration) * Math.PI * 2) + 1) / 2;
      const dynOpacity = cfg.opacity * 0.2 + (cfg.opacity - cfg.opacity * 0.2) * t;

      o.set({ opacity: dynOpacity });
      cv2.requestRenderAll();

      phase = (phase + 16) % cfg.duration;
      animRef.current = setTimeout(tick, 16);
    };

    tick();
    toast.success("Animação de pulso iniciada");
  }, [stopPulse]);

  const resetOpacity = useCallback(() => {
    stopPulse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cv = canvasRef.current as any;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) return;
    obj.set({ opacity: 1, shadow: null, __opacityMapConfig: null });
    cv.requestRenderAll();
    setConfig(DEFAULT_CONFIG);
    toast.success("Opacidade resetada");
  }, [stopPulse]);

  useEffect(
    () => () => {
      if (animRef.current) clearTimeout(animRef.current);
    },
    []
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Mapa de Opacidade</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Eye className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">
            Selecione um objeto no canvas
          </p>
        </div>
      ) : (
        <>
          {/* Tipo de efeito */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">
              Tipo de efeito
            </span>
            <div className="grid grid-cols-2 gap-1">
              {EFFECT_TYPES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setField("type", key)}
                  className={`py-1 rounded border text-[8px] transition-colors ${
                    config.type === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Opacidade */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">
                Opacidade
              </span>
              <span className="text-[8px] font-mono text-muted-foreground">
                {config.opacity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.05}
              max={1.0}
              step={0.05}
              value={config.opacity}
              onChange={(e) => setField("opacity", Number(e.target.value))}
              className="w-full h-1 accent-primary"
            />
            <div className="flex justify-between text-[7px] text-muted-foreground/50">
              <span>0.05</span>
              <span>1.0</span>
            </div>
          </div>

          {/* Duração (apenas para pulso) */}
          {config.type === "pulso" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">
                  Duração
                </span>
                <span className="text-[8px] font-mono text-muted-foreground">
                  {(config.duration / 1000).toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={500}
                max={3000}
                step={100}
                value={config.duration}
                onChange={(e) => setField("duration", Number(e.target.value))}
                className="w-full h-1 accent-primary"
              />
              <div className="flex justify-between text-[7px] text-muted-foreground/50">
                <span>0.5s</span>
                <span>3.0s</span>
              </div>
            </div>
          )}

          {/* Preview de opacidade */}
          <div className="flex items-center justify-center p-4 rounded border border-border bg-gray-900">
            <div
              className="w-16 h-10 rounded-md bg-primary"
              style={{ opacity: config.opacity }}
            />
          </div>

          {/* Ações */}
          <div className="flex gap-1.5">
            <button
              onClick={applyEffect}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
            >
              <Eye className="w-3 h-3" />
              Aplicar
            </button>

            {config.type === "pulso" &&
              (isAnimating ? (
                <button
                  onClick={stopPulse}
                  className="flex-1 py-2 rounded border border-yellow-500/50 text-yellow-500 text-[9px] font-medium hover:bg-yellow-500/10 transition-colors"
                >
                  Parar pulso
                </button>
              ) : (
                <button
                  onClick={startPulse}
                  className="flex-1 py-2 rounded border border-green-500/50 text-green-500 text-[9px] font-medium hover:bg-green-500/10 transition-colors"
                >
                  Iniciar pulso
                </button>
              ))}

            <button
              onClick={resetOpacity}
              className="px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors"
              title="Resetar opacidade"
            >
              ↺
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Config salva em __opacityMapConfig · pulso usa setTimeout loop
          </p>
        </>
      )}
    </div>
  );
}
