"use client";

import { useCallback, useEffect, useState } from "react";
import { Scissors, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface ObjectClipMaskPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type ClipShape = "rect" | "circle" | "ellipse" | "triangle" | "star" | "diamond" | "roundedRect";

interface ClipConfig {
  shape: ClipShape;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  radius: number;
}

const SHAPE_LABELS: { value: ClipShape; label: string }[] = [
  { value: "rect", label: "Retângulo" },
  { value: "roundedRect", label: "Arredondado" },
  { value: "circle", label: "Círculo" },
  { value: "ellipse", label: "Elipse" },
  { value: "triangle", label: "Triângulo" },
  { value: "star", label: "Estrela" },
  { value: "diamond", label: "Diamante" },
];

function buildStarPath(cx: number, cy: number, r: number, points: number = 5): string {
  const inner = r * 0.45;
  let path = "";
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const x = cx + rad * Math.cos(angle);
    const y = cy + rad * Math.sin(angle);
    path += (i === 0 ? "M" : "L") + `${x},${y}`;
  }
  return path + "Z";
}

export function ObjectClipMaskPanel({ fabricCanvas, selectionVersion }: ObjectClipMaskPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [hasClip, setHasClip] = useState(false);
  const [config, setConfig] = useState<ClipConfig>({
    shape: "circle",
    width: 100,
    height: 100,
    offsetX: 0,
    offsetY: 0,
    radius: 20,
  });

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      const has = !!obj && obj.type !== "activeSelection";
      setHasObject(has);
      setHasClip(has && !!obj.clipPath);
      if (has && obj.clipPath) {
        const cp = obj.clipPath;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cpAny = cp as any;
        const w = cpAny.width ?? (cpAny.rx != null ? cpAny.rx * 2 : 100);
        const h = cpAny.height ?? (cpAny.ry != null ? cpAny.ry * 2 : 100);
        setConfig(prev => ({ ...prev, width: w, height: h }));
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getObject = useCallback(() => {
    if (!fabricCanvas) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = fabricCanvas.getActiveObject();
    return obj && obj.type !== "activeSelection" ? obj : null;
  }, [fabricCanvas]);

  const applyClip = useCallback((cfg: ClipConfig) => {
    const obj = getObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    const w = cfg.width;
    const h = cfg.height;
    const cx = cfg.offsetX;
    const cy = cfg.offsetY;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let clipShape: any;

      const baseOpts = {
        left: cx - w / 2,
        top: cy - h / 2,
        originX: "left",
        originY: "top",
        absolutePositioned: false,
      };

      switch (cfg.shape) {
        case "rect":
          clipShape = new f.Rect({ ...baseOpts, width: w, height: h });
          break;
        case "roundedRect":
          clipShape = new f.Rect({ ...baseOpts, width: w, height: h, rx: cfg.radius, ry: cfg.radius });
          break;
        case "circle":
          clipShape = new f.Circle({ left: cx - w / 2, top: cy - h / 2, radius: Math.min(w, h) / 2, originX: "left", originY: "top", absolutePositioned: false });
          break;
        case "ellipse":
          clipShape = new f.Ellipse({ ...baseOpts, rx: w / 2, ry: h / 2 });
          break;
        case "triangle":
          clipShape = new f.Triangle({ ...baseOpts, width: w, height: h });
          break;
        case "star": {
          const path = buildStarPath(cx, cy, Math.min(w, h) / 2);
          clipShape = new f.Path(path, { originX: "center", originY: "center", left: cx, top: cy, absolutePositioned: false });
          break;
        }
        case "diamond": {
          const dp = `M ${cx},${cy - h / 2} L ${cx + w / 2},${cy} L ${cx},${cy + h / 2} L ${cx - w / 2},${cy} Z`;
          clipShape = new f.Path(dp, { originX: "center", originY: "center", left: cx, top: cy, absolutePositioned: false });
          break;
        }
        default:
          clipShape = new f.Rect({ ...baseOpts, width: w, height: h });
      }

      obj.set({ clipPath: clipShape });
      fabricCanvas.requestRenderAll();
      setHasClip(true);
      toast.success(`Máscara "${cfg.shape}" aplicada`);
    });
  }, [getObject, fabricCanvas]);

  const removeClip = useCallback(() => {
    const obj = getObject();
    if (!obj) return;
    obj.set({ clipPath: null });
    fabricCanvas.requestRenderAll();
    setHasClip(false);
    toast.success("Máscara de recorte removida");
  }, [getObject, fabricCanvas]);

  const update = useCallback((partial: Partial<ClipConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Scissors className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Máscara de Recorte</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Scissors className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto para aplicar uma máscara</p>
        </div>
      ) : (
        <>
          {hasClip && (
            <div className="flex items-center justify-between px-2 py-1.5 rounded border border-primary/30 bg-primary/5">
              <span className="text-[9px] text-primary">Máscara ativa</span>
              <button onClick={removeClip} className="text-[8px] text-destructive hover:underline">Remover</button>
            </div>
          )}

          {/* Shape */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Forma da Máscara</span>
            <div className="grid grid-cols-4 gap-1">
              {SHAPE_LABELS.map(s => (
                <button key={s.value} onClick={() => update({ shape: s.value })}
                  className={`py-1.5 rounded border text-[7px] transition-colors ${config.shape === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Width/Height */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Largura</span>
                <span className="text-[9px] tabular-nums">{config.width}px</span>
              </div>
              <input type="range" min={10} max={500} step={5} value={config.width}
                onChange={e => update({ width: Number(e.target.value) })} className="w-full accent-primary h-1" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Altura</span>
                <span className="text-[9px] tabular-nums">{config.height}px</span>
              </div>
              <input type="range" min={10} max={500} step={5} value={config.height}
                onChange={e => update({ height: Number(e.target.value) })} className="w-full accent-primary h-1" />
            </div>
          </div>

          {/* Offset */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Deslocamento X</span>
                <span className="text-[9px] tabular-nums">{config.offsetX}</span>
              </div>
              <input type="range" min={-200} max={200} step={5} value={config.offsetX}
                onChange={e => update({ offsetX: Number(e.target.value) })} className="w-full accent-primary h-1" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Deslocamento Y</span>
                <span className="text-[9px] tabular-nums">{config.offsetY}</span>
              </div>
              <input type="range" min={-200} max={200} step={5} value={config.offsetY}
                onChange={e => update({ offsetY: Number(e.target.value) })} className="w-full accent-primary h-1" />
            </div>
          </div>

          {/* Border radius (roundedRect only) */}
          {config.shape === "roundedRect" && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">Raio dos Cantos</span>
                <span className="text-[9px] tabular-nums">{config.radius}px</span>
              </div>
              <input type="range" min={0} max={100} step={2} value={config.radius}
                onChange={e => update({ radius: Number(e.target.value) })} className="w-full accent-primary h-1" />
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={removeClip}
              className="flex items-center justify-center gap-1 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <RotateCcw className="w-3 h-3" /> Remover
            </button>
            <button onClick={() => applyClip(config)}
              className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Scissors className="w-3 h-3" /> Aplicar
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            A máscara recorta o objeto visualmente sem alterar seu conteúdo
          </p>
        </>
      )}
    </div>
  );
}
