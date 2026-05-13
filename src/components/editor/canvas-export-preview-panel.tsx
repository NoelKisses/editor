"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Eye, Settings2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasExportPreviewPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type Format = "png" | "jpeg" | "webp" | "svg";

const FORMAT_OPTIONS: { value: Format; label: string; hasQuality: boolean }[] = [
  { value: "png", label: "PNG", hasQuality: false },
  { value: "jpeg", label: "JPEG", hasQuality: true },
  { value: "webp", label: "WebP", hasQuality: true },
  { value: "svg", label: "SVG", hasQuality: false },
];

function calcFileSizeLabel(dataUrl: string): string {
  const base64Len = dataUrl.split(",")[1]?.length ?? 0;
  const bytes = Math.round((base64Len * 3) / 4);
  if (bytes > 1024 * 1024) return `~${(bytes / (1024 * 1024)).toFixed(1)}mb`;
  return `~${Math.round(bytes / 1024)}kb`;
}

const SCALE_PRESETS = [
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "3×", value: 3 },
  { label: "4×", value: 4 },
];

export function CanvasExportPreviewPanel({ fabricCanvas }: CanvasExportPreviewPanelProps) {
  const [format, setFormat] = useState<Format>("png");
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(2);
  const [preview, setPreview] = useState<string | null>(null);
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(0);
  const [fileSizeEst, setFileSizeEst] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [bgTransparent, setBgTransparent] = useState(false);
  const [selectionOnly, setSelectionOnly] = useState(false);

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      setCanvasW(fabricCanvas.width ?? 0);
      setCanvasH(fabricCanvas.height ?? 0);
    });
  }, [fabricCanvas]);

  const generatePreview = useCallback(() => {
    if (!fabricCanvas) return;
    setGenerating(true);
    try {
      if (format === "svg") {
        const svg = fabricCanvas.toSVG();
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        setPreview(url);
        setFileSizeEst(`~${Math.round(blob.size / 1024)}kb`);
        setGenerating(false);
        return;
      }

      const opts: Record<string, unknown> = {
        format,
        multiplier: scale,
        quality,
        enableRetinaScaling: scale > 1,
      };

      if (bgTransparent && format === "png") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prevBg = (fabricCanvas as any).backgroundColor;
        fabricCanvas.set({ backgroundColor: "" });
        const dataUrl = fabricCanvas.toDataURL(opts);
        fabricCanvas.set({ backgroundColor: prevBg });
        setPreview(dataUrl);
        setFileSizeEst(calcFileSizeLabel(dataUrl));
      } else if (selectionOnly) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = fabricCanvas.getActiveObject();
        if (!obj) {
          toast.error("Nenhum objeto selecionado");
          setGenerating(false);
          return;
        }
        const dataUrl = obj.toDataURL({ format, multiplier: scale, quality });
        setPreview(dataUrl);
        setFileSizeEst(calcFileSizeLabel(dataUrl));
      } else {
        const dataUrl = fabricCanvas.toDataURL(opts);
        setPreview(dataUrl);
        setFileSizeEst(calcFileSizeLabel(dataUrl));
      }
    } catch {
      toast.error("Erro ao gerar prévia");
    }
    setGenerating(false);
  }, [fabricCanvas, format, quality, scale, bgTransparent, selectionOnly]);


  const doExport = useCallback(() => {
    if (!fabricCanvas) return;
    if (format === "svg") {
      const svg = fabricCanvas.toSVG();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `design.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("SVG exportado");
      return;
    }

    const opts: Record<string, unknown> = { format, multiplier: scale, quality };
    let dataUrl: string;
    if (bgTransparent && format === "png") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevBg = (fabricCanvas as any).backgroundColor;
      fabricCanvas.set({ backgroundColor: "" });
      dataUrl = fabricCanvas.toDataURL(opts);
      fabricCanvas.set({ backgroundColor: prevBg });
    } else {
      dataUrl = fabricCanvas.toDataURL(opts);
    }

    const link = document.createElement("a");
    link.download = `design-${scale}x.${format}`;
    link.href = dataUrl;
    link.click();
    toast.success(`Exportado como ${format.toUpperCase()} ${scale}×`);
  }, [fabricCanvas, format, quality, scale, bgTransparent]);

  const outputW = Math.round(canvasW * scale);
  const outputH = Math.round(canvasH * scale);
  const currentFmt = FORMAT_OPTIONS.find(f => f.value === format)!;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Exportar com Prévia</span>
      </div>

      {/* Format */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Formato</span>
        <div className="grid grid-cols-4 gap-1">
          {FORMAT_OPTIONS.map(f => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`py-1.5 rounded border text-[9px] font-medium transition-colors ${format === f.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Resolução</span>
        <div className="grid grid-cols-4 gap-1">
          {SCALE_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setScale(p.value)}
              className={`py-1.5 rounded border text-[9px] font-medium transition-colors ${scale === p.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between text-[8px] text-muted-foreground/60 px-1">
          <span>Canvas: {canvasW}×{canvasH}px</span>
          <span>Saída: {outputW}×{outputH}px</span>
        </div>
      </div>

      {/* Quality (JPEG/WebP only) */}
      {currentFmt.hasQuality && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Qualidade</span>
            <span className="text-[9px] tabular-nums">{Math.round(quality * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
            className="w-full accent-primary h-1"
          />
        </div>
      )}

      {/* Options */}
      <div className="flex flex-col gap-1 p-2 rounded border border-border bg-muted/20">
        <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Settings2 className="w-3 h-3" /> Opções</span>
        {format === "png" && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={bgTransparent} onChange={e => setBgTransparent(e.target.checked)} className="w-3 h-3 accent-primary" />
            <span className="text-[9px] text-foreground/80">Fundo transparente</span>
          </label>
        )}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={selectionOnly} onChange={e => setSelectionOnly(e.target.checked)} className="w-3 h-3 accent-primary" />
          <span className="text-[9px] text-foreground/80">Apenas seleção</span>
        </label>
      </div>

      {/* Preview area */}
      {preview && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground">Prévia</span>
            <span className="text-[8px] text-muted-foreground/60">{fileSizeEst}</span>
          </div>
          {format === "svg" ? (
            <div className="w-full h-24 rounded border border-border bg-muted/20 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">SVG gerado — clique Exportar</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Prévia"
              className="w-full rounded border border-border object-contain max-h-40"
            />
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={generatePreview}
          disabled={generating}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-border text-muted-foreground text-[10px] hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-40"
        >
          <Eye className="w-3 h-3" /> {generating ? "Gerando..." : "Prévia"}
        </button>
        <button
          onClick={doExport}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          <Download className="w-3 h-3" /> Exportar
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        {format.toUpperCase()} {scale}× · {outputW}×{outputH}px
        {currentFmt.hasQuality ? ` · Q${Math.round(quality * 100)}%` : ""}
      </p>
    </div>
  );
}
