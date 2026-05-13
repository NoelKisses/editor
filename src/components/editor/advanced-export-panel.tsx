"use client";

import { useCallback, useState } from "react";
import { Download, FileImage, FileType2, Image } from "lucide-react";
import { toast } from "sonner";

interface AdvancedExportPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ExportFormat = "png" | "jpg" | "webp" | "svg";

const FORMATS: { value: ExportFormat; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "png", label: "PNG", icon: <FileImage className="w-4 h-4" />, desc: "Transparência, alta qualidade" },
  { value: "jpg", label: "JPG", icon: <Image className="w-4 h-4" />, desc: "Menor arquivo, sem transparência" },
  { value: "webp", label: "WebP", icon: <FileImage className="w-4 h-4" />, desc: "Melhor compressão web" },
  { value: "svg", label: "SVG", icon: <FileType2 className="w-4 h-4" />, desc: "Vetorial, escalável" },
];

const SCALES = [
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "2×", value: 2 },
  { label: "3×", value: 3 },
  { label: "4×", value: 4 },
];

const PRESETS = [
  { label: "YouTube", w: 1280, h: 720 },
  { label: "Instagram", w: 1080, h: 1080 },
  { label: "Twitter", w: 1200, h: 628 },
  { label: "Facebook", w: 1200, h: 630 },
  { label: "LinkedIn", w: 1200, h: 627 },
  { label: "TikTok", w: 1080, h: 1920 },
];

export function AdvancedExportPanel({ fabricCanvas }: AdvancedExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState(1);
  const [fileName, setFileName] = useState("design");
  const [transparentBg, setTransparentBg] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!fabricCanvas || isExporting) return;
    setIsExporting(true);

    try {
      if (format === "svg") {
        const svg = fabricCanvas.toSVG();
        const blob = new Blob([svg], { type: "image/svg+xml" });
        downloadBlob(blob, `${fileName}.svg`);
        toast.success("SVG exportado com sucesso!");
        return;
      }

      const origBg = fabricCanvas.backgroundColor;
      if (transparentBg) fabricCanvas.setBackgroundColor("", () => {});

      const dataUrl = fabricCanvas.toDataURL({
        format: format === "jpg" ? "jpeg" : format,
        quality: quality / 100,
        multiplier: scale,
      });

      if (transparentBg) fabricCanvas.setBackgroundColor(origBg, () => fabricCanvas.requestRenderAll());

      const link = document.createElement("a");
      link.download = `${fileName}.${format}`;
      link.href = dataUrl;
      link.click();

      toast.success(`${format.toUpperCase()} exportado (${scale}×, ${quality}% qualidade)`);
    } catch {
      toast.error("Erro ao exportar");
    } finally {
      setIsExporting(false);
    }
  }, [fabricCanvas, format, quality, scale, fileName, transparentBg, isExporting]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!fabricCanvas) return;
    const dataUrl = fabricCanvas.toDataURL({ format: "png", multiplier: scale });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Imagem copiada para a área de transferência!");
    } catch {
      toast.error("Navegador não suporta cópia de imagem");
    }
  }, [fabricCanvas, scale]);

  const canvasW = fabricCanvas ? Math.round((fabricCanvas.getWidth?.() ?? 0) / fabricCanvas.getZoom()) : 0;
  const canvasH = fabricCanvas ? Math.round((fabricCanvas.getHeight?.() ?? 0) / fabricCanvas.getZoom()) : 0;
  const outW = Math.round(canvasW * scale);
  const outH = Math.round(canvasH * scale);

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Exportar</span>
      </div>

      {/* Format selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Formato</span>
        <div className="grid grid-cols-2 gap-1.5">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`flex flex-col items-start gap-0.5 p-2 rounded border transition-all ${format === f.value ? "bg-primary/10 border-primary" : "border-border hover:border-primary/40"}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={format === f.value ? "text-primary" : "text-muted-foreground"}>{f.icon}</span>
                <span className={`text-[11px] font-medium ${format === f.value ? "text-primary" : "text-foreground"}`}>{f.label}</span>
              </div>
              <span className="text-[8px] text-muted-foreground leading-tight">{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Escala de Saída</span>
          <span className="text-[10px] text-muted-foreground tabular-nums">{outW}×{outH}px</span>
        </div>
        <div className="flex gap-1">
          {SCALES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScale(s.value)}
              className={`flex-1 text-[10px] py-1 rounded border transition-colors ${scale === s.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality (not for SVG) */}
      {format !== "svg" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Qualidade</span>
            <span className="text-[10px] tabular-nums">{quality}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex gap-1">
            {[60, 75, 90, 100].map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`flex-1 text-[9px] py-0.5 rounded border transition-colors ${quality === q ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {q}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transparent BG (PNG/WebP only) */}
      {(format === "png" || format === "webp") && (
        <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/20 border border-border">
          <div>
            <p className="text-[11px] font-medium">Fundo Transparente</p>
            <p className="text-[9px] text-muted-foreground">Remove a cor de fundo</p>
          </div>
          <button
            onClick={() => setTransparentBg((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${transparentBg ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${transparentBg ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
      )}

      {/* File name */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome do Arquivo</span>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="flex-1 text-[11px] bg-background border border-border rounded px-2 py-1.5 text-foreground outline-none focus:border-primary/50"
          />
          <span className="text-[10px] text-muted-foreground">.{format}</span>
        </div>
      </div>

      {/* Export presets info */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanhos de Referência</span>
        <div className="grid grid-cols-2 gap-1">
          {PRESETS.map((p) => (
            <div key={p.label} className="flex items-center justify-between px-2 py-1 rounded bg-muted/20 border border-border/50">
              <span className="text-[9px] text-muted-foreground">{p.label}</span>
              <span className="text-[8px] tabular-nums text-muted-foreground/70">{p.w}×{p.h}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleExport}
          disabled={isExporting || !fabricCanvas}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Exportando..." : `Baixar ${format.toUpperCase()}`}
        </button>
        {format === "png" && (
          <button
            onClick={handleCopyToClipboard}
            disabled={!fabricCanvas}
            className="flex items-center justify-center gap-2 w-full py-2 bg-muted/30 hover:bg-muted/50 text-foreground border border-border rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50"
          >
            Copiar para Área de Transferência
          </button>
        )}
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
