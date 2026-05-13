"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Lock, Unlock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ObjectVisibilityPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ObjEntry {
  id: string;
  label: string;
  type: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    "i-text": "Texto", textbox: "Texto", text: "Texto",
    rect: "Retângulo", circle: "Círculo", triangle: "Triângulo",
    ellipse: "Elipse", image: "Imagem", group: "Grupo",
    path: "Caminho", line: "Linha", polyline: "Polilinha",
    polygon: "Polígono",
  };
  return map[type] ?? type;
}

function ObjRow({ entry, onToggleVisible, onToggleLock, onOpacity }: {
  entry: ObjEntry;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onOpacity: (id: string, v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 py-1.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          entry.type === "image" ? "bg-blue-400" :
          entry.type.includes("text") ? "bg-purple-400" :
          entry.type === "group" ? "bg-orange-400" : "bg-green-400"
        }`} />
        <span className="text-[9px] flex-1 truncate">{entry.label}</span>
        <button onClick={() => onToggleVisible(entry.id)} title={entry.visible ? "Ocultar" : "Mostrar"} className="transition-colors text-muted-foreground hover:text-primary">
          {entry.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-40" />}
        </button>
        <button onClick={() => onToggleLock(entry.id)} title={entry.locked ? "Desbloquear" : "Bloquear"} className="transition-colors text-muted-foreground hover:text-primary">
          {entry.locked ? <Lock className="w-3 h-3 text-yellow-400" /> : <Unlock className="w-3 h-3" />}
        </button>
      </div>
      <div className="flex items-center gap-2 pl-4">
        <span className="text-[8px] text-muted-foreground w-12">{Math.round(entry.opacity * 100)}%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={entry.opacity}
          onChange={e => onOpacity(entry.id, Number(e.target.value))}
          className="flex-1 accent-primary h-1"
        />
      </div>
    </div>
  );
}

export function ObjectVisibilityPanel({ fabricCanvas, selectionVersion }: ObjectVisibilityPanelProps) {
  const [entries, setEntries] = useState<ObjEntry[]>([]);

  const buildEntries = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objs: any[] = fabricCanvas.getObjects().filter((o: any) => !o.data?.isGuideOverlay && !o.data?.isGuide);
    setEntries(objs.map((o, i) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (o as any).__uid ?? String(i),
      label: o.name ?? `${typeLabel(o.type ?? "objeto")} ${i + 1}`,
      type: o.type ?? "unknown",
      visible: o.visible ?? true,
      locked: !o.selectable,
      opacity: o.opacity ?? 1,
    })));
  }, [fabricCanvas]);

  useEffect(() => {
    void selectionVersion;
    queueMicrotask(buildEntries);
  }, [fabricCanvas, selectionVersion, buildEntries]);

  // Assign __uid on mount for stable ids
  useEffect(() => {
    if (!fabricCanvas) return;
    let uid = 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any) => {
      if (!o.__uid) o.__uid = String(uid++);
    });
  }, [fabricCanvas, selectionVersion]);

  const getObj = useCallback((id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return fabricCanvas?.getObjects().find((o: any) => (o.__uid ?? "") === id || fabricCanvas.getObjects().indexOf(o) === Number(id));
  }, [fabricCanvas]);

  const toggleVisible = useCallback((id: string) => {
    const obj = getObj(id);
    if (!obj || !fabricCanvas) return;
    const next = !(obj.visible ?? true);
    obj.set({ visible: next });
    fabricCanvas.requestRenderAll();
    setEntries(prev => prev.map(e => e.id === id ? { ...e, visible: next } : e));
  }, [fabricCanvas, getObj]);

  const toggleLock = useCallback((id: string) => {
    const obj = getObj(id);
    if (!obj || !fabricCanvas) return;
    const locked = !obj.selectable;
    obj.set({
      selectable: locked,
      evented: locked,
      lockMovementX: !locked,
      lockMovementY: !locked,
    });
    fabricCanvas.requestRenderAll();
    setEntries(prev => prev.map(e => e.id === id ? { ...e, locked: !locked } : e));
    toast.success(locked ? "Objeto desbloqueado" : "Objeto bloqueado");
  }, [fabricCanvas, getObj]);

  const changeOpacity = useCallback((id: string, val: number) => {
    const obj = getObj(id);
    if (!obj || !fabricCanvas) return;
    obj.set({ opacity: val });
    fabricCanvas.requestRenderAll();
    setEntries(prev => prev.map(e => e.id === id ? { ...e, opacity: val } : e));
  }, [fabricCanvas, getObj]);

  const showAll = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any) => { if (!o.data?.isGuideOverlay) o.set({ visible: true }); });
    fabricCanvas.requestRenderAll();
    buildEntries();
    toast.success("Todos os objetos visíveis");
  }, [fabricCanvas, buildEntries]);

  const hideAll = useCallback(() => {
    if (!fabricCanvas) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any) => { if (!o.data?.isGuideOverlay) o.set({ visible: false }); });
    fabricCanvas.requestRenderAll();
    buildEntries();
    toast.success("Todos os objetos ocultos");
  }, [fabricCanvas, buildEntries]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Visibilidade</span>
        </div>
        <button onClick={buildEntries} className="text-muted-foreground hover:text-primary transition-colors" title="Atualizar">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-1">
        <button onClick={showAll} className="flex-1 py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1">
          <Eye className="w-3 h-3" /> Mostrar tudo
        </button>
        <button onClick={hideAll} className="flex-1 py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center justify-center gap-1">
          <EyeOff className="w-3 h-3" /> Ocultar tudo
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-4">Canvas vazio — adicione objetos</p>
      ) : (
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{entries.length} objeto(s)</span>
          {entries.map(e => (
            <ObjRow
              key={e.id}
              entry={e}
              onToggleVisible={toggleVisible}
              onToggleLock={toggleLock}
              onOpacity={changeOpacity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
