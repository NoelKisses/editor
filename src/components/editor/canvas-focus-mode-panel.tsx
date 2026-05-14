"use client";

import { useCallback, useEffect, useState } from "react";
import { Focus, Eye, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CanvasFocusModePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface LayerEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any;
  label: string;
  visible: boolean;
  focused: boolean;
}

export function CanvasFocusModePanel({ fabricCanvas, selectionVersion }: CanvasFocusModePanelProps) {
  const [layers, setLayers] = useState<LayerEntry[]>([]);
  const [focusActive, setFocusActive] = useState(false);
  const [dimOpacity, setDimOpacity] = useState(0.15);

  const refreshLayers = useCallback(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs: any[] = fabricCanvas.getObjects();
      const active = fabricCanvas.getActiveObject();
      setLayers(objs.map((o, i) => ({
        obj: o,
        label: o.data?.label ?? o.type ?? `Camada ${i + 1}`,
        visible: o.visible !== false,
        focused: o === active,
      })));
    });
  }, [fabricCanvas]);

  useEffect(() => {
    refreshLayers();
  }, [fabricCanvas, selectionVersion, refreshLayers]);

  const toggleVisible = useCallback((idx: number) => {
    if (!fabricCanvas) return;
    const layer = layers[idx];
    if (!layer) return;
    const next = !layer.visible;
    layer.obj.set({ visible: next });
    fabricCanvas.requestRenderAll();
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, visible: next } : l));
  }, [fabricCanvas, layers]);

  const focusObject = useCallback((idx: number) => {
    if (!fabricCanvas) return;
    const target = layers[idx];
    if (!target) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layers.forEach((l: LayerEntry) => {
      if (l.obj !== target.obj) {
        l.obj.set({ opacity: dimOpacity });
      } else {
        l.obj.set({ opacity: 1 });
      }
    });

    fabricCanvas.setActiveObject(target.obj);
    fabricCanvas.requestRenderAll();
    setFocusActive(true);
    setLayers(prev => prev.map((l, i) => ({ ...l, focused: i === idx })));
    toast.success(`Foco em: ${target.label}`);
  }, [fabricCanvas, layers, dimOpacity]);

  const exitFocus = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any) => {
      if (o._origOpacity !== undefined) {
        o.set({ opacity: o._origOpacity });
        delete o._origOpacity;
      } else {
        o.set({ opacity: 1 });
      }
    });
    fabricCanvas.requestRenderAll();
    setFocusActive(false);
    setLayers(prev => prev.map(l => ({ ...l, focused: false })));
    toast.success("Modo foco desativado");
  }, [fabricCanvas]);

  const showAll = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any) => o.set({ visible: true }));
    fabricCanvas.requestRenderAll();
    setLayers(prev => prev.map(l => ({ ...l, visible: true })));
    toast.success("Todos os objetos visíveis");
  }, [fabricCanvas]);

  const hideAll = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const active = fabricCanvas.getActiveObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any) => {
      if (o !== active) o.set({ visible: false });
    });
    fabricCanvas.requestRenderAll();
    setLayers(prev => prev.map((l) => ({ ...l, visible: l.obj === active })));
    toast.success("Outros objetos ocultados");
  }, [fabricCanvas]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Focus className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Modo Foco / Camadas</span>
        </div>
        <button onClick={refreshLayers}
          className="text-muted-foreground hover:text-primary transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {layers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Focus className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Nenhum objeto no canvas</p>
        </div>
      ) : (
        <>
          {/* Dim opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">Opacidade desfocado</span>
              <span className="text-[9px] tabular-nums">{Math.round(dimOpacity * 100)}%</span>
            </div>
            <input type="range" min={0} max={0.5} step={0.05} value={dimOpacity}
              onChange={e => setDimOpacity(Number(e.target.value))} className="w-full accent-primary h-1" />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-1">
            <button onClick={hideAll}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
              <EyeOff className="w-3 h-3" /> Isolar seleção
            </button>
            <button onClick={showAll}
              className="flex items-center justify-center gap-1 py-1.5 rounded border border-border text-muted-foreground text-[8px] hover:border-primary/30 hover:text-primary transition-colors">
              <Eye className="w-3 h-3" /> Mostrar todos
            </button>
          </div>

          {focusActive && (
            <button onClick={exitFocus}
              className="flex items-center justify-center gap-1 py-2 rounded border border-destructive text-destructive text-[9px] font-medium hover:bg-destructive/10 transition-colors">
              <RotateCcw className="w-3 h-3" /> Sair do modo foco
            </button>
          )}

          {/* Layer list */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Objetos ({layers.length})</span>
            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
              {[...layers].reverse().map((l, ri) => {
                const idx = layers.length - 1 - ri;
                return (
                  <div key={idx}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors ${l.focused ? "border-primary bg-primary/10" : "border-border hover:border-primary/20"}`}>
                    <button onClick={() => toggleVisible(idx)}
                      className={`flex-shrink-0 ${l.visible ? "text-primary" : "text-muted-foreground/40"}`}>
                      {l.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <span className={`flex-1 text-[9px] truncate ${l.focused ? "text-primary font-medium" : ""}`}>{l.label}</span>
                    <button onClick={() => focusObject(idx)}
                      className="text-[7px] text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                      Focar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {focusActive && (
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[8px] text-primary">Modo foco ativo</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
