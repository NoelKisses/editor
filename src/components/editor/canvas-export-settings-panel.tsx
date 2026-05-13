"use client";

import { useCallback, useState } from "react";
import { Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

function downloadDataUrl(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}

interface CanvasExportSettingsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ExportFormat = "png" | "jpeg" | "webp" | "svg";
type ExportArea = "full" | "selection" | "custom";

const SCALES = [0.5, 1, 1.5, 2, 3, 4];
const FORMATS: { value: ExportFormat; label: string; hasQuality: boolean }[] = [
  { value: "png", label: "PNG", hasQuality: false },
  { value: "jpeg", label: "JPEG", hasQuality: true },
  { value: "webp", label: "WebP", hasQuality: true },
  { value: "svg", label: "SVG", hasQuality: false },
];

export function CanvasExportSettingsPanel({ fabricCanvas }: CanvasExportSettingsPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(1);
  const [area, setArea] = useState<ExportArea>("full");
  const [customX, setCustomX] = useState(0);
  const [customY, setCustomY] = useState(0);
  const [customW, setCustomW] = useState(400);
  const [customH, setCustomH] = useState(400);
  const [withBg, setWithBg] = useState(true);
  const [filename, setFilename] = useState("design");

  const selectedFormat = FORMATS.find(f => f.value === format)!;

  const exportCanvas = useCallback(() => {
    if (!fabricCanvas) { toast.error("Canvas não disponível"); return; }

    if (format === "svg") {
      const svg = fabricCanvas.toSVG();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("SVG exportado");
      return;
    }

    const opts: Record<string, unknown> = {
      format,
      multiplier: scale,
    };

    if (selectedFormat.hasQuality) {
      opts.quality = quality;
    }

    if (!withBg) {
      const prevBg = fabricCanvas.backgroundColor;
      fabricCanvas.setBackgroundColor("", () => {
        if (area === "selection") {
          const obj = fabricCanvas.getActiveObject();
          if (obj) {
            const br = obj.getBoundingRect();
            opts.left = br.left;
            opts.top = br.top;
            opts.width = br.width;
            opts.height = br.height;
          }
        } else if (area === "custom") {
          opts.left = customX;
          opts.top = customY;
          opts.width = customW;
          opts.height = customH;
        }

        const dataUrl = fabricCanvas.toDataURL(opts);
        fabricCanvas.setBackgroundColor(prevBg, () => fabricCanvas.requestRenderAll());
        downloadDataUrl(dataUrl, `${filename}.${format}`);
      });
      return;
    }

    if (area === "selection") {
      const obj = fabricCanvas.getActiveObject();
      if (!obj) { toast.error("Selecione um objeto para exportar a área"); return; }
      const br = obj.getBoundingRect();
      opts.left = br.left;
      opts.top = br.top;
      opts.width = br.width;
      opts.height = br.height;
    } else if (area === "custom") {
      opts.left = customX;
      opts.top = customY;
      opts.width = customW;
      opts.height = customH;
    }

    const dataUrl = fabricCanvas.toDataURL(opts);
    downloadDataUrl(dataUrl, `${filename}.${format}`);
    toast.success(`Exportado como ${format.toUpperCase()} (${scale}x)`);
  }, [fabricCanvas, format, quality, scale, area, withBg, filename, customX, customY, customW, customH, selectedFormat]);

  const previewSize = useCallback(() => {
    if (!fabricCanvas) return "—";
    const cw = Math.round((fabricCanvas.getWidth() / fabricCanvas.getZoom()) * scale);
    const ch = Math.round((fabricCanvas.getHeight() / fabricCanvas.getZoom()) * scale);
    return `${cw} × ${ch}px`;
  }, [fabricCanvas, scale]);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Exportar Avançado</span>
      </div>

      {/* Filename */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome do arquivo</span>
        <input
          type="text"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          className="w-full bg-muted/50 border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-primary"
          placeholder="design"
        />
      </div>

      {/* Format */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Formato</span>
        <div className="grid grid-cols-4 gap-1">
          {FORMATS.map(f => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`py-1.5 rounded border text-[10px] font-medium transition-colors ${format === f.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality */}
      {selectedFormat.hasQuality && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Qualidade</span>
            <span className="text-[9px] tabular-nums">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            className="w-full accent-primary h-1"
          />
        </div>
      )}

      {/* Scale */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Escala</span>
          <span className="text-[9px] tabular-nums text-muted-foreground">{previewSize()}</span>
        </div>
        <div className="flex gap-1">
          {SCALES.map(s => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className={`flex-1 py-1 rounded border text-[9px] transition-colors ${scale === s ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Area */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Área</span>
        <div className="flex flex-col gap-1">
          {([
            { value: "full", label: "Canvas inteiro" },
            { value: "selection", label: "Seleção atual" },
            { value: "custom", label: "Área personalizada" },
          ] as const).map(a => (
            <button
              key={a.value}
              onClick={() => setArea(a.value)}
              className={`px-2 py-1.5 rounded border text-left text-[10px] transition-colors ${area === a.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {area === "custom" && (
        <div className="grid grid-cols-2 gap-2 p-2 rounded border border-border">
          {[
            { label: "X", value: customX, set: setCustomX },
            { label: "Y", value: customY, set: setCustomY },
            { label: "Largura", value: customW, set: setCustomW },
            { label: "Altura", value: customH, set: setCustomH },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[8px] text-muted-foreground">{label}</span>
              <input
                type="number"
                value={value}
                onChange={e => set(Number(e.target.value))}
                className="w-full bg-muted/50 border border-border rounded px-1.5 py-0.5 text-[9px] font-mono focus:outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
      )}

      {/* Options */}
      <div className="flex items-center justify-between p-2 rounded border border-border">
        <span className="text-[9px] text-muted-foreground">Incluir fundo</span>
        <button
          onClick={() => setWithBg(v => !v)}
          className={`relative w-8 h-4 rounded-full transition-colors ${withBg ? "bg-primary" : "bg-muted"}`}
        >
          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${withBg ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
      </div>

      <button
        onClick={exportCanvas}
        className="flex items-center justify-center gap-2 py-2.5 rounded border border-primary text-primary text-[11px] font-medium hover:bg-primary/10 transition-colors"
      >
        <ImageIcon className="w-3.5 h-3.5" />
        Exportar {format.toUpperCase()} {scale}x
      </button>
    </div>
  );
}
