"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Gauge, RotateCcw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasRulerGuideAdvancedPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface GuideItem {
  id: string;
  axis: "h" | "v";
  position: number;
  color: string;
  label: string;
}

const GUIDE_TAG = "__guide__";

let guideCounter = 0;

export function CanvasRulerGuideAdvancedPanel({ fabricCanvas, selectionVersion }: CanvasRulerGuideAdvancedPanelProps) {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [rulerColor, setRulerColor] = useState("#6366f1");
  const [guideColor, setGuideColor] = useState("#ef4444");
  const [newAxis, setNewAxis] = useState<"h" | "v">("h");
  const [newPosition, setNewPosition] = useState(200);
  const [snapToGuides, setSnapToGuides] = useState(false);
  const [gridSize, setGridSize] = useState(50);
  const [showGrid, setShowGrid] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gridObjectsRef = useRef<any[]>([]);

  useEffect(() => {
    canvasRef.current = fabricCanvas;
  }, [fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const guideLines = fabricCanvas.getObjects().filter((o: any) => o[GUIDE_TAG]);
      const items: GuideItem[] = guideLines.map((o: Record<string, unknown>) => ({
        id: String(o.__guideId ?? ""),
        axis: String(o.__guideAxis ?? "h") as "h" | "v",
        position: Number(o.__guidePos ?? 0),
        color: String(o.stroke ?? "#ef4444"),
        label: String(o.__guideLabel ?? ""),
      }));
      setGuides(items);
    });
  }, [fabricCanvas, selectionVersion]);

  const addGuide = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const w = cv.getWidth();
      const h = cv.getHeight();
      const id = `guide_${++guideCounter}_${Date.now()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let line: any;
      if (newAxis === "h") {
        line = new f.Line([0, newPosition, w, newPosition], {
          stroke: guideColor, strokeWidth: 1, selectable: true, evented: true,
          strokeDashArray: [5, 3], hasControls: false, hasBorders: false,
        });
      } else {
        line = new f.Line([newPosition, 0, newPosition, h], {
          stroke: guideColor, strokeWidth: 1, selectable: true, evented: true,
          strokeDashArray: [5, 3], hasControls: false, hasBorders: false,
        });
      }

      line[GUIDE_TAG] = true;
      line.__guideId = id;
      line.__guideAxis = newAxis;
      line.__guidePos = newPosition;
      line.__guideLabel = `${newAxis === "h" ? "H" : "V"} ${newPosition}px`;

      cv.add(line);
      cv.requestRenderAll();

      const newGuide: GuideItem = {
        id, axis: newAxis, position: newPosition,
        color: guideColor, label: line.__guideLabel,
      };
      setGuides(prev => [...prev, newGuide]);
      toast.success(`Guia ${newAxis === "h" ? "horizontal" : "vertical"} adicionada em ${newPosition}px`);
    });
  }, [newAxis, newPosition, guideColor]);

  const removeGuide = useCallback((id: string) => {
    const cv = canvasRef.current;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = cv.getObjects().find((o: any) => o.__guideId === id);
    if (obj) {
      cv.remove(obj);
      cv.requestRenderAll();
    }
    setGuides(prev => prev.filter(g => g.id !== id));
    toast.success("Guia removida");
  }, []);

  const clearAllGuides = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guideLines = cv.getObjects().filter((o: any) => o[GUIDE_TAG]);
    guideLines.forEach((o: unknown) => cv.remove(o));
    cv.requestRenderAll();
    setGuides([]);
    toast.success("Todas as guias removidas");
  }, []);

  const toggleGrid = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    if (showGrid) {
      gridObjectsRef.current.forEach((o: unknown) => cv.remove(o));
      gridObjectsRef.current = [];
      cv.requestRenderAll();
      setShowGrid(false);
      toast.success("Grid ocultado");
      return;
    }

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const w = cv.getWidth();
      const h = cv.getHeight();
      const lines: unknown[] = [];

      for (let x = 0; x <= w; x += gridSize) {
        const line = new f.Line([x, 0, x, h], {
          stroke: rulerColor, strokeWidth: 0.5, selectable: false, evented: false, opacity: 0.3,
        });
        cv.add(line);
        lines.push(line);
      }
      for (let y = 0; y <= h; y += gridSize) {
        const line = new f.Line([0, y, w, y], {
          stroke: rulerColor, strokeWidth: 0.5, selectable: false, evented: false, opacity: 0.3,
        });
        cv.add(line);
        lines.push(line);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gridObjectsRef.current = lines as any[];
      cv.requestRenderAll();
      setShowGrid(true);
      toast.success(`Grid ${gridSize}px exibido`);
    });
  }, [showGrid, gridSize, rulerColor]);

  const toggleSnap = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const next = !snapToGuides;
    setSnapToGuides(next);

    if (next) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const snapHandler = (e: any) => {
        const obj = e.target;
        if (!obj || obj[GUIDE_TAG]) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const guideLines = cv.getObjects().filter((o: any) => o[GUIDE_TAG]);
        const snapThreshold = 10;
        guideLines.forEach((guide: Record<string, unknown>) => {
          const axis = String(guide.__guideAxis ?? "h");
          const pos = Number(guide.__guidePos ?? 0);
          if (axis === "h" && Math.abs(obj.top - pos) < snapThreshold) {
            obj.set({ top: pos });
          } else if (axis === "v" && Math.abs(obj.left - pos) < snapThreshold) {
            obj.set({ left: pos });
          }
        });
      };
      cv.__snapHandler = snapHandler;
      cv.on("object:moving", snapHandler);
      toast.success("Snap a guias ativado");
    } else {
      if (cv.__snapHandler) {
        cv.off("object:moving", cv.__snapHandler);
        cv.__snapHandler = null;
      }
      toast.success("Snap a guias desativado");
    }
  }, [snapToGuides]);

  const centerGuides = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const w = cv.getWidth();
    const h = cv.getHeight();
    setNewAxis("h"); setNewPosition(Math.round(h / 2));
    setTimeout(() => {
      setNewAxis("v"); setNewPosition(Math.round(w / 2));
    }, 50);
    toast.success("Posições definidas para o centro do canvas");
  }, []);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Réguas e Guias</span>
      </div>

      {/* Grid */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border">
        <span className="text-[9px] text-muted-foreground font-medium">Grade de fundo</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Tamanho</span>
          <input type="number" min={10} max={200} step={10} value={gridSize}
            onChange={e => setGridSize(Number(e.target.value))}
            className="w-16 bg-muted/50 border border-border rounded px-2 py-0.5 text-[9px] focus:outline-none focus:border-primary" />
          <span className="text-[8px] text-muted-foreground">px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Cor</span>
          <input type="color" value={rulerColor} onChange={e => setRulerColor(e.target.value)}
            className="w-6 h-5 rounded border border-border cursor-pointer" />
        </div>
        <button onClick={toggleGrid}
          className={`py-1.5 rounded border text-[9px] font-medium transition-colors ${showGrid ? "border-destructive text-destructive hover:bg-destructive/10" : "border-primary text-primary hover:bg-primary/10"}`}>
          {showGrid ? "Ocultar grade" : "Mostrar grade"}
        </button>
      </div>

      {/* Guides */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border">
        <span className="text-[9px] text-muted-foreground font-medium">Nova guia</span>
        <div className="grid grid-cols-2 gap-1">
          {(["h", "v"] as const).map(a => (
            <button key={a} onClick={() => setNewAxis(a)}
              className={`py-1 rounded border text-[8px] transition-colors ${newAxis === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {a === "h" ? "Horizontal" : "Vertical"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Posição</span>
          <input type="number" min={0} max={2000} step={10} value={newPosition}
            onChange={e => setNewPosition(Number(e.target.value))}
            className="w-20 bg-muted/50 border border-border rounded px-2 py-0.5 text-[9px] focus:outline-none focus:border-primary" />
          <span className="text-[8px] text-muted-foreground">px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Cor</span>
          <input type="color" value={guideColor} onChange={e => setGuideColor(e.target.value)}
            className="w-6 h-5 rounded border border-border cursor-pointer" />
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button onClick={addGuide}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-primary text-primary text-[9px] hover:bg-primary/10 transition-colors">
            <Plus className="w-3 h-3" /> Adicionar
          </button>
          <button onClick={centerGuides}
            className="py-1.5 rounded border border-border text-muted-foreground text-[9px] hover:border-primary/30 hover:text-primary transition-colors">
            Centro
          </button>
        </div>
      </div>

      {/* Snap */}
      <button onClick={toggleSnap}
        className={`py-1.5 rounded border text-[9px] font-medium transition-colors ${snapToGuides ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
        {snapToGuides ? "Snap ativo" : "Ativar snap a guias"}
      </button>

      {/* Guide list */}
      {guides.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Guias ({guides.length})</span>
            <button onClick={clearAllGuides}
              className="text-[7px] text-muted-foreground hover:text-destructive">
              Remover todas
            </button>
          </div>
          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
            {guides.map(g => (
              <div key={g.id} className="flex items-center gap-1 px-1.5 py-1 rounded border border-border">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: g.color }} />
                <span className="flex-1 text-[8px] text-foreground/70 truncate">{g.label}</span>
                <span className="text-[7px] text-muted-foreground">{g.position}px</span>
                <button onClick={() => removeGuide(g.id)}
                  className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={clearAllGuides}
        className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-destructive/30 hover:text-destructive transition-colors">
        <RotateCcw className="w-3 h-3" /> Limpar tudo
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Arraste guias no canvas · snap alinha objetos automaticamente
      </p>
    </div>
  );
}
