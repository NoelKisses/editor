"use client";

import { useCallback, useEffect, useState } from "react";
import { Ruler, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface CanvasGuidesPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type GuideAxis = "horizontal" | "vertical";

interface Guide {
  id: string;
  axis: GuideAxis;
  position: number;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any;
}

const GUIDE_DATA_KEY = "__guide__";

const COMMON_POSITIONS: { label: string; axis: GuideAxis; fn: (cw: number, ch: number) => number }[] = [
  { label: "Centro H", axis: "horizontal", fn: (_, ch) => ch / 2 },
  { label: "Centro V", axis: "vertical", fn: (cw) => cw / 2 },
  { label: "1/3 H sup.", axis: "horizontal", fn: (_, ch) => ch / 3 },
  { label: "2/3 H inf.", axis: "horizontal", fn: (_, ch) => (ch * 2) / 3 },
  { label: "1/3 V esq.", axis: "vertical", fn: (cw) => cw / 3 },
  { label: "2/3 V dir.", axis: "vertical", fn: (cw) => (cw * 2) / 3 },
  { label: "Margem 20px H", axis: "horizontal", fn: () => 20 },
  { label: "Margem 20px V", axis: "vertical", fn: () => 20 },
];

export function CanvasGuidesPanel({ fabricCanvas }: CanvasGuidesPanelProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [newAxis, setNewAxis] = useState<GuideAxis>("horizontal");
  const [newPosition, setNewPosition] = useState(100);
  const [guideColor, setGuideColor] = useState("#3b82f6");
  const [showGuides, setShowGuides] = useState(true);

  const refreshGuides = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects().filter((o: any) => o.data?.isGuide);
    const items: Guide[] = objs.map(o => ({
      id: o.data.guideId,
      axis: o.data.guideAxis,
      position: o.data.guidePosition,
      color: o.stroke ?? guideColor,
      ref: o,
    }));
    setGuides(items);
  }, [fabricCanvas, guideColor]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => { refreshGuides(); });
  }, [fabricCanvas, refreshGuides]);

  const addGuide = useCallback((axis: GuideAxis, position: number, color: string) => {
    if (!fabricCanvas) return;

    import("fabric").then(m => {
      const fabric = m.fabric;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = fabric as any;
      const cw = fabricCanvas.width ?? 800;
      const ch = fabricCanvas.height ?? 600;
      const id = `guide-${Date.now()}`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let line: any;
      if (axis === "horizontal") {
        line = new f.Line([0, position, cw, position], {
          stroke: color,
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          data: { isGuide: true, key: GUIDE_DATA_KEY, guideId: id, guideAxis: axis, guidePosition: position },
        });
      } else {
        line = new f.Line([position, 0, position, ch], {
          stroke: color,
          strokeWidth: 1,
          strokeDashArray: [5, 5],
          selectable: true,
          evented: true,
          hasControls: false,
          hasBorders: false,
          lockMovementY: true,
          data: { isGuide: true, key: GUIDE_DATA_KEY, guideId: id, guideAxis: axis, guidePosition: position },
        });
      }

      fabricCanvas.add(line);
      fabricCanvas.requestRenderAll();
      refreshGuides();
      toast.success(`Guia ${axis === "horizontal" ? "horizontal" : "vertical"} adicionada em ${position}px`);
    });
  }, [fabricCanvas, refreshGuides]);

  const removeGuide = useCallback((guide: Guide) => {
    if (!fabricCanvas) return;
    fabricCanvas.remove(guide.ref);
    fabricCanvas.requestRenderAll();
    refreshGuides();
    toast.success("Guia removida");
  }, [fabricCanvas, refreshGuides]);

  const clearAllGuides = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const guideObjs = fabricCanvas.getObjects().filter((o: any) => o.data?.isGuide);
    guideObjs.forEach((o: unknown) => fabricCanvas.remove(o));
    fabricCanvas.requestRenderAll();
    setGuides([]);
    toast.success("Todas as guias removidas");
  }, [fabricCanvas]);

  const toggleVisibility = useCallback(() => {
    if (!fabricCanvas) return;
    const next = !showGuides;
    setShowGuides(next);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().filter((o: any) => o.data?.isGuide).forEach((o: any) => {
      o.set({ visible: next });
    });
    fabricCanvas.requestRenderAll();
  }, [fabricCanvas, showGuides]);

  const addCommonGuide = useCallback((item: typeof COMMON_POSITIONS[number]) => {
    const cw = fabricCanvas?.width ?? 800;
    const ch = fabricCanvas?.height ?? 600;
    const pos = Math.round(item.fn(cw, ch));
    addGuide(item.axis, pos, guideColor);
  }, [fabricCanvas, addGuide, guideColor]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Ruler className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Guias Personalizadas</span>
      </div>

      {/* Toggle visibility */}
      <div className="flex items-center justify-between px-2 py-2 rounded border border-border">
        <span className="text-[10px]">Mostrar Guias</span>
        <button
          onClick={toggleVisibility}
          className={`w-8 h-4 rounded-full transition-colors ${showGuides ? "bg-primary" : "bg-muted-foreground/30"}`}
        >
          <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${showGuides ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Common guides */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Guias Comuns</span>
        <div className="grid grid-cols-2 gap-1">
          {COMMON_POSITIONS.map(item => (
            <button key={item.label} onClick={() => addCommonGuide(item)}
              className="py-1 rounded border border-border text-[8px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add custom guide */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nova Guia</span>

        <div className="grid grid-cols-2 gap-1">
          {(["horizontal", "vertical"] as const).map(a => (
            <button key={a} onClick={() => setNewAxis(a)}
              className={`py-1 rounded border text-[8px] transition-colors ${newAxis === a ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {a === "horizontal" ? "Horizontal" : "Vertical"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            value={newPosition}
            onChange={e => setNewPosition(Number(e.target.value))}
            min={0}
            max={newAxis === "horizontal" ? (fabricCanvas?.height ?? 600) : (fabricCanvas?.width ?? 800)}
            className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary"
            placeholder="Posição (px)"
          />
          <input type="color" value={guideColor} onChange={e => setGuideColor(e.target.value)}
            className="w-7 h-7 rounded border border-border cursor-pointer" />
        </div>

        <button onClick={() => addGuide(newAxis, newPosition, guideColor)}
          className="flex items-center justify-center gap-1 py-1.5 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
          <Plus className="w-3 h-3" /> Adicionar Guia
        </button>
      </div>

      {/* Guide list */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Guias Ativas ({guides.length})
          </span>
          {guides.length > 0 && (
            <button onClick={clearAllGuides}
              className="flex items-center gap-0.5 text-[8px] text-destructive hover:underline">
              <Trash2 className="w-2.5 h-2.5" /> Limpar tudo
            </button>
          )}
        </div>

        {guides.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-3">Nenhuma guia ativa</p>
        ) : (
          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
            {guides.map(guide => (
              <div key={guide.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded border border-border">
                <div className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: guide.color }} />
                <span className="text-[8px] text-muted-foreground flex-shrink-0 w-12">
                  {guide.axis === "horizontal" ? "Horiz." : "Vert."}
                </span>
                <span className="flex-1 text-[9px]">{guide.position}px</span>
                <button onClick={() => removeGuide(guide)}
                  className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Arraste as guias no canvas para reposicioná-las
      </p>
    </div>
  );
}
