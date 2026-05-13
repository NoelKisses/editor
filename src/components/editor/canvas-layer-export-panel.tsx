"use client";

import { useCallback, useEffect, useState } from "react";
import { Layers, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface CanvasLayerExportPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
  selectionVersion: number;
}

interface LayerItem {
  id: string;
  label: string;
  type: string;
  visible: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: any;
}

type ExportFormat = "png" | "jpeg" | "svg";

function getObjectLabel(obj: { type: string; text?: string; name?: string }, index: number): string {
  if (obj.name) return obj.name;
  if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") return `Texto: ${(obj.text ?? "").substring(0, 15)}`;
  if (obj.type === "image") return `Imagem ${index + 1}`;
  if (obj.type === "rect") return `Retângulo ${index + 1}`;
  if (obj.type === "circle") return `Círculo ${index + 1}`;
  if (obj.type === "triangle") return `Triângulo ${index + 1}`;
  if (obj.type === "path") return `Forma ${index + 1}`;
  if (obj.type === "group") return `Grupo ${index + 1}`;
  return `Objeto ${index + 1}`;
}

export function CanvasLayerExportPanel({ fabricCanvas, selectionVersion }: CanvasLayerExportPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [exportScale, setExportScale] = useState(1);
  const [exportAll, setExportAll] = useState(false);

  const refreshLayers = useCallback(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const objs: any[] = fabricCanvas.getObjects().filter((o: any) => !o.data?.isGrid && !o.data?.isWatermark);
      const items: LayerItem[] = objs.reverse().map((obj, i) => ({
        id: obj.data?.__id ?? `layer-${i}`,
        label: getObjectLabel(obj, i),
        type: obj.type ?? "object",
        visible: obj.visible !== false,
        ref: obj,
      }));
      setLayers(items);
    });
  }, [fabricCanvas]);

  useEffect(() => { refreshLayers(); }, [fabricCanvas, selectionVersion, refreshLayers]);

  const toggleLayerVisibility = useCallback((item: LayerItem) => {
    item.ref.set({ visible: !item.visible });
    fabricCanvas?.requestRenderAll();
    refreshLayers();
  }, [fabricCanvas, refreshLayers]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(layers.map(l => l.id)));
  }, [layers]);

  const exportSelectedLayer = useCallback((item: LayerItem) => {
    if (!fabricCanvas) return;

    const obj = item.ref;
    const origVisible = fabricCanvas.getObjects().map((o: { visible: boolean }) => o.visible);

    // Hide all except target
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any) => { o.set({ visible: false }); });
    obj.set({ visible: true });
    fabricCanvas.requestRenderAll();

    const br = obj.getBoundingRect();
    const dataUrl = fabricCanvas.toDataURL({
      format: exportFormat,
      multiplier: exportScale,
      left: br.left,
      top: br.top,
      width: br.width,
      height: br.height,
    });

    // Restore visibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((o: any, i: number) => { o.set({ visible: origVisible[i] }); });
    fabricCanvas.requestRenderAll();

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${item.label.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.${exportFormat}`;
    link.click();
    toast.success(`"${item.label}" exportado`);
  }, [fabricCanvas, exportFormat, exportScale]);

  const exportSelected = useCallback(() => {
    if (selectedIds.size === 0) { toast.error("Selecione ao menos uma camada"); return; }
    const toExport = layers.filter(l => selectedIds.has(l.id));
    toExport.forEach(item => exportSelectedLayer(item));
  }, [selectedIds, layers, exportSelectedLayer]);

  const exportCanvas = useCallback(() => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({ format: exportFormat, multiplier: exportScale });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `canvas.${exportFormat}`;
    link.click();
    toast.success("Canvas exportado");
  }, [fabricCanvas, exportFormat, exportScale]);

  const FORMATS: { value: ExportFormat; label: string }[] = [
    { value: "png", label: "PNG" },
    { value: "jpeg", label: "JPEG" },
    { value: "svg", label: "SVG" },
  ];

  const SCALES = [1, 1.5, 2, 3];

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Camadas e Exportação</span>
      </div>

      {/* Export settings */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Configurações</span>
        <div className="grid grid-cols-3 gap-1">
          {FORMATS.map(f => (
            <button key={f.value} onClick={() => setExportFormat(f.value)}
              className={`py-1 rounded border text-[9px] transition-colors ${exportFormat === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground">Escala:</span>
          {SCALES.map(s => (
            <button key={s} onClick={() => setExportScale(s)}
              className={`flex-1 py-0.5 rounded border text-[8px] transition-colors ${exportScale === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Export all canvas */}
      <button onClick={exportCanvas}
        className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors">
        <Download className="w-3 h-3" /> Exportar Canvas Completo
      </button>

      {/* Layers list */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Camadas ({layers.length})</span>
          <button onClick={selectAll} className="text-[8px] text-primary hover:underline">Selecionar tudo</button>
        </div>

        {layers.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-4">Nenhum objeto no canvas</p>
        ) : (
          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
            {layers.map(item => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded border transition-colors cursor-pointer ${selectedIds.has(item.id) ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"}`}
                onClick={() => toggleSelect(item.id)}
              >
                <input type="checkbox" readOnly checked={selectedIds.has(item.id)} className="accent-primary w-3 h-3 flex-shrink-0" />
                <span className="text-[8px] text-muted-foreground flex-shrink-0 w-10 truncate">{item.type}</span>
                <span className="flex-1 text-[9px] truncate">{item.label}</span>
                <button
                  onClick={e => { e.stopPropagation(); toggleLayerVisibility(item); }}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  {item.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 opacity-40" />}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); exportSelectedLayer(item); }}
                  className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export selected */}
      {selectedIds.size > 0 && (
        <button onClick={exportSelected}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[9px] hover:border-primary hover:text-primary transition-colors">
          <Download className="w-3 h-3" /> Exportar {selectedIds.size} camada{selectedIds.size > 1 ? "s" : ""}
        </button>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" id="exportAll" checked={exportAll} onChange={e => setExportAll(e.target.checked)} className="accent-primary w-3 h-3" />
        <label htmlFor="exportAll" className="text-[8px] text-muted-foreground">Incluir camadas ocultas na exportação</label>
      </div>
    </div>
  );
}
