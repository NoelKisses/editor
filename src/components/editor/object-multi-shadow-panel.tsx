"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers2, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ObjectMultiShadowPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface ShadowLayer {
  id: string;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  visible: boolean;
}

const SHADOW_PRESETS: { label: string; layers: Omit<ShadowLayer, "id" | "visible">[] }[] = [
  {
    label: "Neon Duplo",
    layers: [
      { color: "#00ffff", offsetX: 0, offsetY: 0, blur: 20 },
      { color: "#0080ff", offsetX: 0, offsetY: 0, blur: 40 },
    ],
  },
  {
    label: "Sombra Profunda",
    layers: [
      { color: "#00000060", offsetX: 4, offsetY: 4, blur: 4 },
      { color: "#00000030", offsetX: 8, offsetY: 8, blur: 12 },
      { color: "#00000015", offsetX: 16, offsetY: 16, blur: 24 },
    ],
  },
  {
    label: "Contorno Duplo",
    layers: [
      { color: "#ffffff", offsetX: 0, offsetY: 0, blur: 0 },
      { color: "#000000", offsetX: 0, offsetY: 0, blur: 8 },
    ],
  },
  {
    label: "3D Pop",
    layers: [
      { color: "#1a1a2e", offsetX: 2, offsetY: 2, blur: 0 },
      { color: "#1a1a2e", offsetX: 4, offsetY: 4, blur: 0 },
      { color: "#1a1a2e", offsetX: 6, offsetY: 6, blur: 0 },
    ],
  },
  {
    label: "Halo Suave",
    layers: [
      { color: "#ffffff80", offsetX: 0, offsetY: 0, blur: 8 },
      { color: "#ffffff40", offsetX: 0, offsetY: 0, blur: 20 },
      { color: "#ffffff20", offsetX: 0, offsetY: 0, blur: 40 },
    ],
  },
  {
    label: "Sunset Glow",
    layers: [
      { color: "#ff6b6b", offsetX: -4, offsetY: 0, blur: 20 },
      { color: "#ffd93d", offsetX: 4, offsetY: 0, blur: 20 },
    ],
  },
];

function buildShadowCSS(layers: ShadowLayer[]): string {
  return layers
    .filter((l) => l.visible)
    .map((l) => `${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.color}`)
    .join(", ");
}

function applyMultiShadow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  layers: ShadowLayer[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any
): void {
  const visibleLayers = layers.filter((l) => l.visible);
  if (visibleLayers.length === 0) {
    obj.set({ shadow: null });
    return;
  }

  // Fabric.js only supports a single shadow natively.
  // For multi-shadow, we apply the first as native shadow and
  // encode all layers in a custom property for reference.
  const primary = visibleLayers[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = fabric as any;
  obj.set({
    shadow: new f.Shadow({
      color: primary.color,
      offsetX: primary.offsetX,
      offsetY: primary.offsetY,
      blur: primary.blur,
    }),
    __multiShadow: layers,
    __shadowCSS: buildShadowCSS(layers),
  });

  // For text objects, we can also build a combined visual effect:
  if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
    // Apply the shadow CSS via the element if accessible
    if (obj._element) {
      obj._element.style.filter = `drop-shadow(${buildShadowCSS(visibleLayers)})`;
    }
  }
}

export function ObjectMultiShadowPanel({ fabricCanvas, selectionVersion }: ObjectMultiShadowPanelProps) {
  const [hasObject, setHasObject] = useState(false);
  const [layers, setLayers] = useState<ShadowLayer[]>([
    { id: "s1", color: "#000000", offsetX: 4, offsetY: 4, blur: 8, visible: true },
  ]);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = fabricCanvas.getActiveObject();
      if (!obj) { setHasObject(false); return; }
      setHasObject(true);
      if (obj.__multiShadow) {
        setLayers(obj.__multiShadow);
      }
    });
  }, [fabricCanvas, selectionVersion]);

  const getActive = useCallback(() => {
    if (!fabricCanvas) return null;
    return fabricCanvas.getActiveObject();
  }, [fabricCanvas]);

  const updateLayer = useCallback((id: string, field: keyof ShadowLayer, value: unknown) => {
    setLayers((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
  }, []);

  const addLayer = useCallback(() => {
    if (layers.length >= 5) { toast.error("Máximo 5 camadas"); return; }
    const newLayer: ShadowLayer = {
      id: `s${Date.now()}`,
      color: "#6366f1",
      offsetX: 2,
      offsetY: 2,
      blur: 6,
      visible: true,
    };
    setLayers((prev) => [...prev, newLayer]);
  }, [layers.length]);

  const removeLayer = useCallback((id: string) => {
    if (layers.length <= 1) { toast.error("Mínimo 1 camada"); return; }
    setLayers((prev) => prev.filter((l) => l.id !== id));
  }, [layers.length]);

  const applyPreset = useCallback((preset: typeof SHADOW_PRESETS[0]) => {
    const newLayers: ShadowLayer[] = preset.layers.map((l, i) => ({
      ...l,
      id: `preset_${i}_${Date.now()}`,
      visible: true,
    }));
    setLayers(newLayers);
    toast.success(`Preset "${preset.label}" carregado — clique Aplicar`);
  }, []);

  const applyToCanvas = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) { toast.error("Selecione um objeto"); return; }

    import("fabric").then((m) => {
      applyMultiShadow(obj, layers, m.fabric);
      fabricCanvas.requestRenderAll();
      toast.success(`${layers.filter(l => l.visible).length} sombra(s) aplicada(s)`);
    });
  }, [getActive, layers, fabricCanvas]);

  const clearShadows = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = getActive();
    if (!obj) return;
    obj.set({ shadow: null, __multiShadow: null, __shadowCSS: null });
    fabricCanvas.requestRenderAll();
    setLayers([{ id: "s1", color: "#000000", offsetX: 4, offsetY: 4, blur: 8, visible: true }]);
    toast.success("Sombras removidas");
  }, [getActive, fabricCanvas]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Layers2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Multi-Sombra</span>
      </div>

      {!hasObject ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Layers2 className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um objeto no canvas</p>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">Presets</span>
            <div className="grid grid-cols-2 gap-1">
              {SHADOW_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="py-1 rounded border border-border text-[7px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors truncate px-1"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shadow preview indicator */}
          <div className="flex items-center gap-2 p-2 rounded bg-muted/20 border border-border">
            <div
              className="w-10 h-6 rounded flex items-center justify-center text-[7px] font-bold"
              style={{
                background: "#ffffff",
                boxShadow: buildShadowCSS(layers),
                color: "#333",
              }}
            >
              Aa
            </div>
            <span className="text-[8px] text-muted-foreground">
              {layers.filter((l) => l.visible).length} de {layers.length} ativa(s)
            </span>
          </div>

          {/* Layers */}
          <div className="flex flex-col gap-2">
            {layers.map((layer, idx) => (
              <div key={layer.id} className="flex flex-col gap-1 p-2 rounded border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-medium">Camada {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateLayer(layer.id, "visible", !layer.visible)}
                      className={`text-[7px] p-0.5 rounded ${layer.visible ? "text-primary" : "text-muted-foreground/40"}`}
                    >
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button onClick={() => removeLayer(layer.id)}
                      className="text-[7px] text-muted-foreground hover:text-destructive p-0.5">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {layer.visible && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-muted-foreground w-8">Cor</span>
                      <input type="color" value={layer.color.slice(0, 7)} onChange={(e) => updateLayer(layer.id, "color", e.target.value)}
                        className="w-6 h-5 rounded border border-border cursor-pointer" />
                      <span className="text-[7px] font-mono text-muted-foreground">{layer.color}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[7px] text-muted-foreground">X</span>
                        <input type="number" min={-50} max={50} value={layer.offsetX}
                          onChange={(e) => updateLayer(layer.id, "offsetX", Number(e.target.value))}
                          className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[7px] text-muted-foreground">Y</span>
                        <input type="number" min={-50} max={50} value={layer.offsetY}
                          onChange={(e) => updateLayer(layer.id, "offsetY", Number(e.target.value))}
                          className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[7px] text-muted-foreground">Blur</span>
                        <input type="number" min={0} max={80} value={layer.blur}
                          onChange={(e) => updateLayer(layer.id, "blur", Number(e.target.value))}
                          className="bg-muted/50 border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-primary" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add layer */}
          <button onClick={addLayer} disabled={layers.length >= 5}
            className="flex items-center justify-center gap-1 py-1.5 rounded border border-dashed border-border text-muted-foreground text-[8px] hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40">
            <Plus className="w-3 h-3" /> Adicionar camada de sombra
          </button>

          {/* Apply / Clear */}
          <div className="flex gap-2">
            <button onClick={applyToCanvas}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
              <Layers2 className="w-3 h-3" /> Aplicar Sombras
            </button>
            <button onClick={clearShadows}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-destructive/30 hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          <p className="text-[8px] text-muted-foreground/50 text-center">
            Fabric.js aplica a primeira sombra nativa · Demais são gravadas no objeto
          </p>
        </>
      )}
    </div>
  );
}
