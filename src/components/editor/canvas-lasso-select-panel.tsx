"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lasso, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasLassoSelectPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

export function CanvasLassoSelectPanel({ fabricCanvas }: CanvasLassoSelectPanelProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [strokeColor, setStrokeColor] = useState("#6366f1");
  const [selectMode, setSelectMode] = useState<"intersect" | "contain">("intersect");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlersRef = useRef<{ down: any; move: any; up: any } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lassoPathRef = useRef<any>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  const stopLasso = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const h = handlersRef.current;
    if (h) {
      cv.off("mouse:down", h.down);
      cv.off("mouse:move", h.move);
      cv.off("mouse:up", h.up);
      handlersRef.current = null;
    }
    if (lassoPathRef.current) {
      cv.remove(lassoPathRef.current);
      lassoPathRef.current = null;
    }
    pointsRef.current = [];
    cv.selection = true;
    cv.requestRenderAll();
    setIsDrawing(false);
    toast.success("Modo lasso desativado");
  }, []);

  const startLasso = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || isDrawing) return;
    setIsDrawing(true);
    cv.selection = false;
    cv.discardActiveObject();

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;

      let drawing = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lassoLine: any = null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const downHandler = (e: any) => {
        const pt = e.absolutePointer ?? e.pointer;
        if (!pt) return;
        drawing = true;
        pointsRef.current = [{ x: pt.x, y: pt.y }];

        if (lassoLine) { cv.remove(lassoLine); }
        lassoLine = new f.Polyline([{ x: pt.x, y: pt.y }], {
          stroke: strokeColor,
          strokeWidth: 1.5,
          fill: strokeColor + "22",
          selectable: false,
          evented: false,
          strokeDashArray: [4, 3],
        });
        cv.add(lassoLine);
        lassoPathRef.current = lassoLine;
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moveHandler = (e: any) => {
        if (!drawing || e.e?.buttons !== 1) return;
        const pt = e.absolutePointer ?? e.pointer;
        if (!pt) return;
        pointsRef.current.push({ x: pt.x, y: pt.y });
        if (lassoLine) {
          lassoLine.points = [...pointsRef.current];
          cv.requestRenderAll();
        }
      };

      const upHandler = () => {
        if (!drawing) return;
        drawing = false;

        const pts = pointsRef.current;
        if (pts.length < 3) {
          if (lassoLine) cv.remove(lassoLine);
          lassoPathRef.current = null;
          cv.requestRenderAll();
          return;
        }

        // Find objects inside lasso
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allObjs = cv.getObjects().filter((o: any) => o.selectable !== false);
        const minX = Math.min(...pts.map(p => p.x));
        const maxX = Math.max(...pts.map(p => p.x));
        const minY = Math.min(...pts.map(p => p.y));
        const maxY = Math.max(...pts.map(p => p.y));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inside = allObjs.filter((obj: any) => {
          const ox = obj.left ?? 0;
          const oy = obj.top ?? 0;
          const ow = (obj.width ?? 0) * (obj.scaleX ?? 1);
          const oh = (obj.height ?? 0) * (obj.scaleY ?? 1);
          if (selectMode === "intersect") {
            return ox < maxX && ox + ow > minX && oy < maxY && oy + oh > minY;
          }
          return ox >= minX && ox + ow <= maxX && oy >= minY && oy + oh <= maxY;
        });

        if (lassoLine) { cv.remove(lassoLine); lassoPathRef.current = null; }
        cv.requestRenderAll();

        if (inside.length === 0) {
          toast.error("Nenhum objeto no lasso");
          return;
        }

        if (inside.length === 1) {
          cv.setActiveObject(inside[0]);
        } else {
          const sel = new f.ActiveSelection(inside, { canvas: cv });
          cv.setActiveObject(sel);
        }
        cv.requestRenderAll();
        setSelectedCount(inside.length);
        toast.success(`${inside.length} objeto(s) selecionado(s) pelo lasso`);
      };

      cv.on("mouse:down", downHandler);
      cv.on("mouse:move", moveHandler);
      cv.on("mouse:up", upHandler);
      handlersRef.current = { down: downHandler, move: moveHandler, up: upHandler };
    });

    toast.success("Desenhe o lasso ao redor dos objetos");
  }, [isDrawing, strokeColor, selectMode]);

  const selectByColor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) { toast.error("Selecione um objeto de referência"); return; }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const refFill = (active as any).fill;
      if (!refFill) { toast.error("Objeto sem cor de preenchimento"); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sameColor = canvas.getObjects().filter((o: any) => o.fill === refFill && o.selectable !== false);
      if (sameColor.length <= 1) { toast.error("Nenhum outro objeto com a mesma cor"); return; }

      const sel = new f.ActiveSelection(sameColor, { canvas });
      canvas.setActiveObject(sel);
      canvas.requestRenderAll();
      setSelectedCount(sameColor.length);
      toast.success(`${sameColor.length} objeto(s) com a mesma cor selecionados`);
    });
  }, []);

  const selectByType = useCallback((type: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typed = canvas.getObjects().filter((o: any) => o.type === type && o.selectable !== false);
      if (typed.length === 0) { toast.error(`Nenhum objeto do tipo "${type}"`); return; }
      const sel = new f.ActiveSelection(typed, { canvas });
      canvas.setActiveObject(sel);
      canvas.requestRenderAll();
      setSelectedCount(typed.length);
      toast.success(`${typed.length} objeto(s) do tipo "${type}" selecionados`);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Lasso className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Seleção Lasso</span>
      </div>

      {/* Status */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-2 py-1 rounded border border-primary/30 bg-primary/5">
          <span className="text-[9px] text-primary">{selectedCount} objeto(s) selecionado(s)</span>
          <button onClick={() => { canvasRef.current?.discardActiveObject(); canvasRef.current?.requestRenderAll(); setSelectedCount(0); }}
            className="text-[7px] text-muted-foreground hover:text-destructive">limpar</button>
        </div>
      )}

      {/* Mode */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Modo de seleção</span>
        <div className="grid grid-cols-2 gap-1">
          {(["intersect", "contain"] as const).map(mode => (
            <button key={mode} onClick={() => setSelectMode(mode)}
              className={`py-1 rounded border text-[8px] transition-colors ${selectMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {mode === "intersect" ? "Toca (intersecta)" : "Dentro (contém)"}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-muted-foreground">Cor do lasso</span>
        <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)}
          className="w-7 h-6 rounded border border-border cursor-pointer" />
      </div>

      {/* Lasso button */}
      <button onClick={isDrawing ? stopLasso : startLasso}
        className={`flex items-center justify-center gap-1 py-2 rounded border text-[9px] font-medium transition-colors ${isDrawing ? "border-destructive text-destructive hover:bg-destructive/10 animate-pulse" : "border-primary text-primary hover:bg-primary/10"}`}>
        <Lasso className="w-3 h-3" /> {isDrawing ? "Cancelar lasso" : "Ativar lasso"}
      </button>

      {/* Select by... */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Selecionar por...</span>
        <button onClick={selectByColor}
          className="py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
          Mesma cor (do objeto selecionado)
        </button>
        <div className="grid grid-cols-3 gap-0.5">
          {["rect", "circle", "text"].map(type => (
            <button key={type} onClick={() => selectByType(type)}
              className="py-1 rounded border border-border text-muted-foreground text-[7px] hover:border-primary/30 hover:text-primary transition-colors capitalize">
              {type === "rect" ? "Retângulos" : type === "circle" ? "Círculos" : "Textos"}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { const c = canvasRef.current; if (c) { c.discardActiveObject(); c.requestRenderAll(); setSelectedCount(0); } }}
        className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
        <RotateCcw className="w-3 h-3" /> Desselecionar tudo
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Desenhe livremente ao redor dos objetos para selecioná-los
      </p>
    </div>
  );
}
