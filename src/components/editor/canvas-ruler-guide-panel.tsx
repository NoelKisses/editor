"use client";

import { useCallback, useRef, useState } from "react";
import { Crosshair, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface CanvasRulerGuidePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface Guide {
  id: number;
  axis: "h" | "v";
  position: number;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricLine?: any;
}

let guideIdCounter = 1;

function GuideRow({ guide, onRemove, onToggle, visible }: {
  guide: Guide;
  onRemove: (id: number) => void;
  onToggle: (id: number) => void;
  visible: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: guide.color }} />
      <span className="text-[9px] text-muted-foreground flex-shrink-0">{guide.axis === "h" ? "H" : "V"}</span>
      <span className="text-[9px] tabular-nums flex-1">{guide.position}px</span>
      <button onClick={() => onToggle(guide.id)} className="text-muted-foreground hover:text-primary transition-colors" title={visible ? "Ocultar" : "Mostrar"}>
        {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      </button>
      <button onClick={() => onRemove(guide.id)} className="text-red-400/60 hover:text-red-400 transition-colors" title="Remover">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export function CanvasRulerGuidePanel({ fabricCanvas }: CanvasRulerGuidePanelProps) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [newAxis, setNewAxis] = useState<"h" | "v">("h");
  const [newPos, setNewPos] = useState(100);
  const [newColor, setNewColor] = useState("#3b82f6");
  const [showAll, setShowAll] = useState(true);
  const linesRef = useRef<Map<number, unknown>>(new Map());

  const drawGuide = useCallback(async (guide: Guide) => {
    if (!fabricCanvas) return;
    const m = await import("fabric");
    const fabric = m.fabric;
    const cw = fabricCanvas.getWidth() / fabricCanvas.getZoom();
    const ch = fabricCanvas.getHeight() / fabricCanvas.getZoom();

    const isH = guide.axis === "h";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line = new (fabric as any).Line(
      isH ? [0, guide.position, cw, guide.position] : [guide.position, 0, guide.position, ch],
      {
        stroke: guide.color,
        strokeWidth: 1,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        strokeDashArray: [6, 3],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { isGuide: true, guideId: guide.id } as any,
      }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.add(line as any);
    fabricCanvas.requestRenderAll();
    linesRef.current.set(guide.id, line);
  }, [fabricCanvas]);

  const removeGuideFromCanvas = useCallback((id: number) => {
    const line = linesRef.current.get(id);
    if (line && fabricCanvas) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { fabricCanvas.remove(line as any); } catch { /* ignore */ }
      linesRef.current.delete(id);
      fabricCanvas.requestRenderAll();
    }
  }, [fabricCanvas]);

  const addGuide = useCallback(() => {
    const guide: Guide = {
      id: guideIdCounter++,
      axis: newAxis,
      position: newPos,
      color: newColor,
    };
    setGuides(prev => [...prev, guide]);
    drawGuide(guide);
    toast.success(`Guia ${guide.axis === "h" ? "horizontal" : "vertical"} em ${guide.position}px adicionada`);
  }, [newAxis, newPos, newColor, drawGuide]);

  const removeGuide = useCallback((id: number) => {
    removeGuideFromCanvas(id);
    setGuides(prev => prev.filter(g => g.id !== id));
    setHidden(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [removeGuideFromCanvas]);

  const toggleGuide = useCallback((id: number) => {
    const line = linesRef.current.get(id);
    if (!line || !fabricCanvas) return;
    const isHidden = hidden.has(id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (line as any).set({ visible: isHidden });
    fabricCanvas.requestRenderAll();
    setHidden(prev => {
      const n = new Set(prev);
      if (isHidden) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }, [fabricCanvas, hidden]);

  const toggleAll = useCallback(() => {
    if (!fabricCanvas) return;
    const next = !showAll;
    linesRef.current.forEach(line => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (line as any).set({ visible: next });
    });
    fabricCanvas.requestRenderAll();
    setShowAll(next);
    if (!next) {
      setHidden(new Set(guides.map(g => g.id)));
    } else {
      setHidden(new Set());
    }
  }, [fabricCanvas, showAll, guides]);

  const clearAll = useCallback(() => {
    guides.forEach(g => removeGuideFromCanvas(g.id));
    setGuides([]);
    setHidden(new Set());
    toast.success("Todas as guias removidas");
  }, [guides, removeGuideFromCanvas]);

  const addCenterGuides = useCallback(() => {
    if (!fabricCanvas) return;
    const cw = Math.round(fabricCanvas.getWidth() / fabricCanvas.getZoom());
    const ch = Math.round(fabricCanvas.getHeight() / fabricCanvas.getZoom());
    const h: Guide = { id: guideIdCounter++, axis: "h", position: Math.round(ch / 2), color: "#ef4444" };
    const v: Guide = { id: guideIdCounter++, axis: "v", position: Math.round(cw / 2), color: "#ef4444" };
    setGuides(prev => [...prev, h, v]);
    drawGuide(h);
    drawGuide(v);
    toast.success("Guias de centro adicionadas");
  }, [fabricCanvas, drawGuide]);

  const addThirdsGuides = useCallback(() => {
    if (!fabricCanvas) return;
    const cw = Math.round(fabricCanvas.getWidth() / fabricCanvas.getZoom());
    const ch = Math.round(fabricCanvas.getHeight() / fabricCanvas.getZoom());
    const newGuides: Guide[] = [
      { id: guideIdCounter++, axis: "h", position: Math.round(ch / 3), color: "#22c55e" },
      { id: guideIdCounter++, axis: "h", position: Math.round((ch * 2) / 3), color: "#22c55e" },
      { id: guideIdCounter++, axis: "v", position: Math.round(cw / 3), color: "#22c55e" },
      { id: guideIdCounter++, axis: "v", position: Math.round((cw * 2) / 3), color: "#22c55e" },
    ];
    setGuides(prev => [...prev, ...newGuides]);
    newGuides.forEach(g => drawGuide(g));
    toast.success("Regra dos terços adicionada");
  }, [fabricCanvas, drawGuide]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Guias Manuais</span>
        </div>
        <button
          onClick={toggleAll}
          className="text-[9px] text-muted-foreground hover:text-primary transition-colors"
          title={showAll ? "Ocultar todas" : "Mostrar todas"}
        >
          {showAll ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick presets */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Guias rápidas</span>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={addCenterGuides}
            className="py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            Centro (H+V)
          </button>
          <button
            onClick={addThirdsGuides}
            className="py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            Regra dos 1/3
          </button>
        </div>
      </div>

      {/* Add guide form */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Nova guia</span>
        <div className="flex gap-1">
          <button
            onClick={() => setNewAxis("h")}
            className={`flex-1 py-1 rounded border text-[9px] transition-colors ${newAxis === "h" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            Horizontal
          </button>
          <button
            onClick={() => setNewAxis("v")}
            className={`flex-1 py-1 rounded border text-[9px] transition-colors ${newAxis === "v" ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            Vertical
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground flex-shrink-0">Posição</span>
          <input
            type="number"
            value={newPos}
            onChange={e => setNewPos(Number(e.target.value))}
            min={0}
            className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] font-mono focus:outline-none focus:border-primary"
          />
          <span className="text-[9px] text-muted-foreground">px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Cor</span>
          <input
            type="color"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            className="w-8 h-6 rounded cursor-pointer border border-border"
          />
        </div>
        <button
          onClick={addGuide}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-primary text-primary text-[9px] hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-3 h-3" /> Adicionar guia
        </button>
      </div>

      {/* Guides list */}
      {guides.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Guias ({guides.length})</span>
            <button
              onClick={clearAll}
              className="text-[8px] text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-0.5"
            >
              <Trash2 className="w-2.5 h-2.5" /> Limpar tudo
            </button>
          </div>
          {guides.map(g => (
            <GuideRow
              key={g.id}
              guide={g}
              onRemove={removeGuide}
              onToggle={toggleGuide}
              visible={!hidden.has(g.id)}
            />
          ))}
        </div>
      )}

      {guides.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          Nenhuma guia — adicione uma acima ou use as guias rápidas
        </p>
      )}
    </div>
  );
}
