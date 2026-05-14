"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Grid3X3, Circle, Waves, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasElementRepeaterPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

type PatternType = "grid" | "circle" | "spiral" | "arc";

interface RepeatConfig {
  pattern: PatternType;
  count: number;
  // Grid
  cols: number;
  gapX: number;
  gapY: number;
  // Circle / Arc
  radius: number;
  startAngle: number;
  endAngle: number;
  // Spiral
  spiralStep: number;
  spiralExpand: number;
  // Common
  rotateWithPath: boolean;
  scaleFactor: number;
  alternateOpacity: boolean;
  opacityStep: number;
}

const DEFAULT_CONFIG: RepeatConfig = {
  pattern: "grid",
  count: 6,
  cols: 3,
  gapX: 20,
  gapY: 20,
  radius: 120,
  startAngle: 0,
  endAngle: 360,
  spiralStep: 30,
  spiralExpand: 15,
  rotateWithPath: false,
  scaleFactor: 1,
  alternateOpacity: false,
  opacityStep: 0.15,
};

const PATTERN_OPTIONS: { value: PatternType; label: string; icon: React.ReactNode }[] = [
  { value: "grid", label: "Grade", icon: <Grid3X3 className="w-3 h-3" /> },
  { value: "circle", label: "Circular", icon: <Circle className="w-3 h-3" /> },
  { value: "arc", label: "Arco", icon: <Waves className="w-3 h-3" /> },
  { value: "spiral", label: "Espiral", icon: <RotateCcw className="w-3 h-3" /> },
];

function computePositions(
  config: RepeatConfig,
  originX: number,
  originY: number,
  objW: number,
  objH: number
): { x: number; y: number; angle: number; scale: number; opacity: number }[] {
  const positions: { x: number; y: number; angle: number; scale: number; opacity: number }[] = [];
  const n = Math.max(1, config.count);

  for (let i = 0; i < n; i++) {
    let x = 0, y = 0, angle = 0;

    if (config.pattern === "grid") {
      const col = i % config.cols;
      const row = Math.floor(i / config.cols);
      x = originX + col * (objW + config.gapX);
      y = originY + row * (objH + config.gapY);
    } else if (config.pattern === "circle") {
      const total = n;
      const spread = config.endAngle - config.startAngle;
      const deg = config.startAngle + (i / total) * spread;
      const rad = (deg * Math.PI) / 180;
      x = originX + config.radius * Math.cos(rad);
      y = originY + config.radius * Math.sin(rad);
      if (config.rotateWithPath) angle = deg + 90;
    } else if (config.pattern === "arc") {
      const spread = config.endAngle - config.startAngle;
      const deg = n > 1 ? config.startAngle + (i / (n - 1)) * spread : config.startAngle;
      const rad = (deg * Math.PI) / 180;
      x = originX + config.radius * Math.cos(rad);
      y = originY + config.radius * Math.sin(rad);
      if (config.rotateWithPath) angle = deg + 90;
    } else if (config.pattern === "spiral") {
      const deg = i * config.spiralStep;
      const rad = (deg * Math.PI) / 180;
      const r = config.radius + i * config.spiralExpand;
      x = originX + r * Math.cos(rad);
      y = originY + r * Math.sin(rad);
      if (config.rotateWithPath) angle = deg + 90;
    }

    const scale = Math.pow(config.scaleFactor, i);
    const opacity = config.alternateOpacity
      ? Math.max(0.1, 1 - i * config.opacityStep)
      : 1;

    positions.push({ x, y, angle, scale, opacity });
  }

  return positions;
}

export function CanvasElementRepeaterPanel({
  fabricCanvas,
  selectionVersion,
}: CanvasElementRepeaterPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [config, setConfig] = useState<RepeatConfig>(DEFAULT_CONFIG);
  const canvasRef = useRef<unknown>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      setHasObject(!!obj && obj.type !== "activeSelection");
    });
  }, [fabricCanvas, selectionVersion]);

  const set = useCallback(<K extends keyof RepeatConfig>(key: K, value: RepeatConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyRepeat = useCallback(() => {
    const cv = canvasRef.current as ReturnType<typeof fabricCanvas>;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = cv.getActiveObject();
    if (!obj) { toast.error("Selecione um objeto"); return; }
    if (obj.type === "activeSelection") { toast.error("Selecione apenas um objeto"); return; }

    import("fabric").then((m) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = m.fabric as any;
      const objW = obj.getScaledWidth();
      const objH = obj.getScaledHeight();
      const originX = obj.left ?? 0;
      const originY = obj.top ?? 0;

      const positions = computePositions(config, originX, originY, objW, objH);
      const clones: unknown[] = [];

      let pending = positions.length;
      if (pending === 0) { toast.error("Nenhuma posição para repetir"); return; }

      positions.forEach(({ x, y, angle, scale, opacity }, i) => {
        if (i === 0) return; // skip original position (keep original object)
        pending--;
        obj.clone((cloned: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const c = cloned as any;
          c.set({
            left: x,
            top: y,
            angle: angle,
            scaleX: (obj.scaleX ?? 1) * scale,
            scaleY: (obj.scaleY ?? 1) * scale,
            opacity: opacity,
            selectable: true,
            evented: true,
          });
          c.setCoords?.();
          clones.push(c);

          if (clones.length === positions.length - 1) {
            clones.forEach((cl) => cv.add(cl));
            // Group all clones + original
            const all = [obj, ...clones];
            const group = new f.ActiveSelection(all, { canvas: cv });
            cv.setActiveObject(group);
            cv.requestRenderAll();
            toast.success(`${positions.length} cópias criadas (padrão: ${config.pattern})`);
          }
        });
      });

      // Only 1 item — just keep the original
      if (positions.length === 1) {
        toast.success("Apenas 1 cópia — aumente a contagem");
      }
    });
  }, [config]);

  const clearClones = useCallback(() => {
    const cv = canvasRef.current as ReturnType<typeof fabricCanvas>;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active: any = cv.getActiveObject();
    if (active && active.type === "activeSelection") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objects = active.getObjects() as any[];
      cv.discardActiveObject();
      objects.slice(1).forEach((o: unknown) => cv.remove(o));
      cv.setActiveObject(objects[0]);
      cv.requestRenderAll();
      toast.success("Cópias removidas");
    } else {
      toast.error("Selecione uma repetição ativa para limpar");
    }
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Copy className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Repetidor de Elementos</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Copy className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto no canvas</p>
        </div>
      ) : (
        <>
          {/* Pattern selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Padrão</span>
            <div className="grid grid-cols-4 gap-1">
              {PATTERN_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => set("pattern", p.value)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 rounded border text-[7px] transition-colors ${
                    config.pattern === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-16">Cópias</span>
            <input
              type="range" min={2} max={24} value={config.count}
              onChange={(e) => set("count", Number(e.target.value))}
              className="flex-1 h-1 accent-primary"
            />
            <span className="text-[8px] font-mono w-4 text-right">{config.count}</span>
          </div>

          {/* Grid options */}
          {config.pattern === "grid" && (
            <div className="flex flex-col gap-1 p-2 rounded border border-border">
              <span className="text-[8px] font-medium">Configuração de Grade</span>
              <div className="grid grid-cols-3 gap-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] text-muted-foreground">Colunas</span>
                  <input type="number" min={1} max={10} value={config.cols}
                    onChange={(e) => set("cols", Number(e.target.value))}
                    className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] text-muted-foreground">Gap X</span>
                  <input type="number" min={0} max={200} value={config.gapX}
                    onChange={(e) => set("gapX", Number(e.target.value))}
                    className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] text-muted-foreground">Gap Y</span>
                  <input type="number" min={0} max={200} value={config.gapY}
                    onChange={(e) => set("gapY", Number(e.target.value))}
                    className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Circle / Arc / Spiral options */}
          {(config.pattern === "circle" || config.pattern === "arc" || config.pattern === "spiral") && (
            <div className="flex flex-col gap-1 p-2 rounded border border-border">
              <span className="text-[8px] font-medium">Parâmetros</span>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[7px] text-muted-foreground">Raio</span>
                  <input type="number" min={10} max={600} value={config.radius}
                    onChange={(e) => set("radius", Number(e.target.value))}
                    className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                </div>
                {config.pattern === "spiral" && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-muted-foreground">Expansão</span>
                    <input type="number" min={1} max={100} value={config.spiralExpand}
                      onChange={(e) => set("spiralExpand", Number(e.target.value))}
                      className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                  </div>
                )}
                {config.pattern === "spiral" && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-muted-foreground">Passo (°)</span>
                    <input type="number" min={5} max={120} value={config.spiralStep}
                      onChange={(e) => set("spiralStep", Number(e.target.value))}
                      className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                  </div>
                )}
                {(config.pattern === "arc" || config.pattern === "circle") && (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] text-muted-foreground">Início (°)</span>
                      <input type="number" min={0} max={360} value={config.startAngle}
                        onChange={(e) => set("startAngle", Number(e.target.value))}
                        className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] text-muted-foreground">Fim (°)</span>
                      <input type="number" min={0} max={720} value={config.endAngle}
                        onChange={(e) => set("endAngle", Number(e.target.value))}
                        className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                    </div>
                  </>
                )}
              </div>
              <label className="flex items-center gap-1.5 mt-1 cursor-pointer">
                <input type="checkbox" checked={config.rotateWithPath}
                  onChange={(e) => set("rotateWithPath", e.target.checked)}
                  className="w-3 h-3 accent-primary" />
                <span className="text-[8px] text-muted-foreground">Rotacionar com trajetória</span>
              </label>
            </div>
          )}

          {/* Scale factor */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-muted-foreground w-16">Escala</span>
            <input
              type="range" min={0.5} max={1.5} step={0.05} value={config.scaleFactor}
              onChange={(e) => set("scaleFactor", Number(e.target.value))}
              className="flex-1 h-1 accent-primary"
            />
            <span className="text-[8px] font-mono w-8 text-right">{config.scaleFactor.toFixed(2)}x</span>
          </div>

          {/* Opacity fade */}
          <div className="flex flex-col gap-1 p-2 rounded border border-border">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={config.alternateOpacity}
                onChange={(e) => set("alternateOpacity", e.target.checked)}
                className="w-3 h-3 accent-primary" />
              <span className="text-[8px] font-medium">Degradê de opacidade</span>
            </label>
            {config.alternateOpacity && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[7px] text-muted-foreground w-16">Redução</span>
                <input
                  type="range" min={0.02} max={0.4} step={0.01} value={config.opacityStep}
                  onChange={(e) => set("opacityStep", Number(e.target.value))}
                  className="flex-1 h-1 accent-primary"
                />
                <span className="text-[8px] font-mono w-8 text-right">{config.opacityStep.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={applyRepeat}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
            >
              <Copy className="w-3 h-3" /> Repetir Elemento
            </button>
            <button
              onClick={clearClones}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors"
              title="Remover cópias da seleção atual"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Objeto original mantido · cópias agrupadas na seleção
          </p>
        </>
      )}
    </div>
  );
}
