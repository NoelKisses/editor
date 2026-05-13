"use client";

import { useCallback, useEffect, useState } from "react";
import { Eclipse, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TextShadowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ShadowLayer {
  id: number;
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
  opacity: number;
}

let nextId = 1;

function ShadowCard({ layer, onChange, onRemove }: {
  layer: ShadowLayer;
  onChange: (id: number, patch: Partial<ShadowLayer>) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground">Sombra #{layer.id}</span>
        <button onClick={() => onRemove(layer.id)} className="text-red-400/60 hover:text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {([
          { label: "Offset X", field: "offsetX" as const, min: -100, max: 100 },
          { label: "Offset Y", field: "offsetY" as const, min: -100, max: 100 },
          { label: "Blur", field: "blur" as const, min: 0, max: 80 },
          { label: "Opacidade %", field: "opacity" as const, min: 0, max: 100 },
        ] as const).map(({ label, field, min, max }) => (
          <div key={field} className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-muted-foreground">{label}</span>
              <span className="text-[8px] tabular-nums">{layer[field]}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={layer[field]}
              onChange={e => onChange(layer.id, { [field]: Number(e.target.value) })}
              className="w-full accent-primary h-1"
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[8px] text-muted-foreground">Cor</span>
        <input
          type="color"
          value={layer.color}
          onChange={e => onChange(layer.id, { color: e.target.value })}
          className="w-8 h-6 rounded cursor-pointer border border-border"
        />
        <span className="text-[8px] font-mono">{layer.color}</span>
      </div>
    </div>
  );
}

function buildShadowString(layers: ShadowLayer[]): string {
  return layers
    .map(l => {
      const alpha = Math.round(l.opacity * 2.55).toString(16).padStart(2, "0");
      const hex = l.color.length === 7 ? `${l.color}${alpha}` : l.color;
      return `${l.offsetX}px ${l.offsetY}px ${l.blur}px ${hex}`;
    })
    .join(", ");
}

export function TextShadowPanel({ fabricCanvas, selectionVersion }: TextShadowPanelProps) {
  const [hasText, setHasText] = useState(false);
  const [layers, setLayers] = useState<ShadowLayer[]>([]);

  useEffect(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    queueMicrotask(() => {
      const isText = ["i-text", "textbox", "text"].includes(obj?.type ?? "");
      setHasText(isText);
    });
  }, [fabricCanvas, selectionVersion]);

  const addLayer = useCallback(() => {
    setLayers(prev => [...prev, {
      id: nextId++,
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      color: "#000000",
      opacity: 60,
    }]);
  }, []);

  const changeLayer = useCallback((id: number, patch: Partial<ShadowLayer>) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  const removeLayer = useCallback((id: number) => {
    setLayers(prev => prev.filter(l => l.id !== id));
  }, []);

  const apply = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (!obj) { toast.error("Selecione um texto"); return; }

    if (layers.length === 0) {
      obj.set({ shadow: null });
    } else {
      // Fabric.js supports single shadow via Shadow object; for multi-shadow we use the first
      // and encode the rest as textShadow style (browser renders via canvas)
      const first = layers[0];
      const alpha = (first.opacity / 100);
      import("fabric").then(m => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shadow = new (m.fabric as any).Shadow({
          color: first.color,
          blur: first.blur,
          offsetX: first.offsetX,
          offsetY: first.offsetY,
          affectStroke: false,
          includeDefaultValues: true,
          nonScaling: false,
        });
        // Override color with opacity
        shadow.color = first.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
        obj.set({ shadow });

        // Encode additional layers in styles for visual info
        if (layers.length > 1) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (obj as any).set("data", { ...(obj as any).data, textShadows: buildShadowString(layers) });
        }

        fabricCanvas.requestRenderAll();
        toast.success(`${layers.length} sombra(s) aplicada(s)`);
      });
      return;
    }
    fabricCanvas.requestRenderAll();
    toast.success("Sombra removida");
  }, [fabricCanvas, layers]);

  const clearAll = useCallback(() => {
    if (!fabricCanvas) return;
    const obj = fabricCanvas.getActiveObject();
    if (obj) {
      obj.set({ shadow: null });
      fabricCanvas.requestRenderAll();
    }
    setLayers([]);
    toast.success("Sombras removidas");
  }, [fabricCanvas]);

  const PRESETS = [
    { name: "Suave", layers: [{ id: nextId++, offsetX: 1, offsetY: 1, blur: 3, color: "#000000", opacity: 40 }] },
    { name: "Forte", layers: [{ id: nextId++, offsetX: 3, offsetY: 3, blur: 0, color: "#000000", opacity: 80 }] },
    { name: "Neon", layers: [{ id: nextId++, offsetX: 0, offsetY: 0, blur: 10, color: "#a855f7", opacity: 100 }] },
    { name: "Retro", layers: [{ id: nextId++, offsetX: 4, offsetY: 4, blur: 0, color: "#f59e0b", opacity: 100 }] },
  ];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Eclipse className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Sombra de Texto</span>
      </div>

      {!hasText ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Eclipse className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um texto para adicionar sombra</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Presets</span>
            <div className="grid grid-cols-4 gap-1">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => setLayers(p.layers)}
                  className="py-1.5 rounded border border-border text-[9px] text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Layers */}
          <div className="flex flex-col gap-2">
            {layers.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">Nenhuma sombra — adicione uma</p>
            )}
            {layers.map(l => (
              <ShadowCard key={l.id} layer={l} onChange={changeLayer} onRemove={removeLayer} />
            ))}
          </div>

          <button
            onClick={addLayer}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded border border-dashed border-border text-muted-foreground text-[10px] hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3" /> Adicionar camada de sombra
          </button>

          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={apply}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
            >
              <Eclipse className="w-3 h-3" /> Aplicar
            </button>
            <button
              onClick={clearAll}
              className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/30 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Limpar
            </button>
          </div>

          {layers.length > 1 && (
            <p className="text-[8px] text-muted-foreground/60 text-center">
              Fabric.js aplica a 1ª sombra nativamente; as demais ficam salvas nos dados do objeto
            </p>
          )}
        </>
      )}
    </div>
  );
}
