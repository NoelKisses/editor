"use client";

import { useCallback, useState } from "react";
import { PackagePlus, Download, Check } from "lucide-react";
import { toast } from "sonner";

interface CanvasExportBatchPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ExportFormat = "png" | "jpeg" | "webp" | "svg";

interface ExportConfig {
  format: ExportFormat;
  quality: number;
  multiplier: number;
  filename: string;
  enabled: boolean;
}

const DEFAULT_CONFIGS: ExportConfig[] = [
  { format: "png", quality: 1, multiplier: 2, filename: "design-2x", enabled: true },
  { format: "png", quality: 1, multiplier: 1, filename: "design-1x", enabled: true },
  { format: "jpeg", quality: 0.9, multiplier: 2, filename: "design-hq", enabled: false },
  { format: "webp", quality: 0.85, multiplier: 2, filename: "design-web", enabled: false },
];

const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG",
  jpeg: "JPEG",
  webp: "WebP",
  svg: "SVG",
};

function downloadDataURL(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function CanvasExportBatchPanel({ fabricCanvas }: CanvasExportBatchPanelProps) {
  const [configs, setConfigs] = useState<ExportConfig[]>(DEFAULT_CONFIGS);
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState<string[]>([]);
  const [customPrefix, setCustomPrefix] = useState("design");
  const [bgTransparent, setBgTransparent] = useState(false);

  const updateConfig = useCallback((index: number, partial: Partial<ExportConfig>) => {
    setConfigs(prev => prev.map((c, i) => i === index ? { ...c, ...partial } : c));
  }, []);

  const addConfig = useCallback(() => {
    setConfigs(prev => [...prev, { format: "png", quality: 1, multiplier: 1, filename: `${customPrefix}-custom`, enabled: true }]);
  }, [customPrefix]);

  const removeConfig = useCallback((index: number) => {
    setConfigs(prev => prev.filter((_, i) => i !== index));
  }, []);

  const exportAll = useCallback(async () => {
    if (!fabricCanvas) return;
    const enabled = configs.filter(c => c.enabled);
    if (enabled.length === 0) { toast.error("Ative pelo menos um formato de exportação"); return; }

    setIsExporting(true);
    setExported([]);

    const originalBg = fabricCanvas.backgroundColor;
    if (bgTransparent) {
      fabricCanvas.set({ backgroundColor: "" });
      fabricCanvas.requestRenderAll();
    }

    const names: string[] = [];

    for (const cfg of enabled) {
      await new Promise<void>(resolve => setTimeout(() => {
        try {
          const filename = `${cfg.filename}.${cfg.format === "jpeg" ? "jpg" : cfg.format}`;

          if (cfg.format === "svg") {
            const svg = fabricCanvas.toSVG();
            const blob = new Blob([svg], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            downloadDataURL(url, filename);
            URL.revokeObjectURL(url);
          } else {
            const dataUrl = fabricCanvas.toDataURL({
              format: cfg.format,
              quality: cfg.quality,
              multiplier: cfg.multiplier,
            });
            downloadDataURL(dataUrl, filename);
          }

          names.push(filename);
        } catch {
          // individual export failed silently
        }
        resolve();
      }, 100));
    }

    if (bgTransparent) {
      fabricCanvas.set({ backgroundColor: originalBg });
      fabricCanvas.requestRenderAll();
    }

    setExported(names);
    setIsExporting(false);
    toast.success(`${names.length} arquivo${names.length > 1 ? "s" : ""} exportado${names.length > 1 ? "s" : ""}`);
  }, [fabricCanvas, configs, bgTransparent]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <PackagePlus className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Exportação em Lote</span>
      </div>

      {/* Settings */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Prefixo</span>
          <input type="text" value={customPrefix} onChange={e => setCustomPrefix(e.target.value)}
            className="flex-1 bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px]">Fundo Transparente</span>
          <button onClick={() => setBgTransparent(v => !v)}
            className={`w-8 h-4 rounded-full transition-colors ${bgTransparent ? "bg-primary" : "bg-muted-foreground/30"}`}>
            <div className={`w-3 h-3 bg-white rounded-full shadow transition-transform mx-0.5 ${bgTransparent ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
      </div>

      {/* Configs */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Formatos ({configs.filter(c => c.enabled).length} ativos)</span>
          <button onClick={addConfig}
            className="text-[8px] text-primary hover:underline">+ Adicionar</button>
        </div>

        <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
          {configs.map((cfg, i) => (
            <div key={i}
              className={`flex flex-col gap-1 p-2 rounded border transition-colors ${cfg.enabled ? "border-primary/30 bg-primary/5" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <button onClick={() => updateConfig(i, { enabled: !cfg.enabled })}
                  className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${cfg.enabled ? "border-primary bg-primary" : "border-border"}`}>
                  {cfg.enabled && <Check className="w-2.5 h-2.5 text-white" />}
                </button>

                <select value={cfg.format} onChange={e => updateConfig(i, { format: e.target.value as ExportFormat })}
                  className="bg-transparent border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none">
                  {(["png", "jpeg", "webp", "svg"] as ExportFormat[]).map(f => (
                    <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                  ))}
                </select>

                <span className="text-[7px] text-muted-foreground">{cfg.multiplier}x</span>

                <input type="text" value={cfg.filename}
                  onChange={e => updateConfig(i, { filename: e.target.value })}
                  className="flex-1 bg-transparent border border-border rounded px-1 py-0.5 text-[7px] focus:outline-none focus:border-primary min-w-0" />

                <button onClick={() => removeConfig(i)}
                  className="text-[7px] text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">×</button>
              </div>

              {cfg.format !== "svg" && (
                <div className="grid grid-cols-2 gap-1 pl-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-muted-foreground">Escala</span>
                    <input type="range" min={0.5} max={4} step={0.5} value={cfg.multiplier}
                      onChange={e => updateConfig(i, { multiplier: Number(e.target.value) })}
                      className="w-full accent-primary h-0.5" />
                  </div>
                  {cfg.format !== "png" && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] text-muted-foreground">Qualidade {Math.round(cfg.quality * 100)}%</span>
                      <input type="range" min={0.1} max={1} step={0.05} value={cfg.quality}
                        onChange={e => updateConfig(i, { quality: Number(e.target.value) })}
                        className="w-full accent-primary h-0.5" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={exportAll} disabled={isExporting}
        className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40">
        <Download className="w-3 h-3" />
        {isExporting ? "Exportando…" : `Exportar ${configs.filter(c => c.enabled).length} arquivo(s)`}
      </button>

      {exported.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {exported.map(name => (
            <div key={name} className="flex items-center gap-1 text-[8px] text-green-500">
              <Check className="w-2.5 h-2.5" /> {name}
            </div>
          ))}
        </div>
      )}

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Cada formato será baixado separadamente pelo navegador
      </p>
    </div>
  );
}
