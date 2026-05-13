"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Image as ImageIcon, Copy, FileCode, Images } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { toast } from "sonner";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

const FORMATS = [
  { id: "png", label: "PNG", description: "Sem perda, suporta transparência" },
  { id: "jpeg", label: "JPEG", description: "Menor tamanho, ideal para fotos" },
  { id: "webp", label: "WebP", description: "Melhor compressão moderna" },
  { id: "svg", label: "SVG", description: "Vetorial, escalável infinitamente" },
] as const;

const SCALES = [
  { value: 1, label: "1x", desc: "Tamanho original" },
  { value: 2, label: "2x", desc: "Alta resolução (recomendado)" },
  { value: 3, label: "3x", desc: "Máxima resolução" },
];

export function ExportDialog({ open, onClose, fabricCanvas }: ExportDialogProps) {
  const { template, pages, currentPageIndex, savePageState } = useEditorStore();
  const [format, setFormat] = useState<"png" | "jpeg" | "webp" | "svg">("png");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(95);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  const buildDataURL = useCallback(async (): Promise<{ dataURL: string; ext: string } | null> => {
    if (!fabricCanvas || !template) return null;

    if (format === "svg") {
      const svgString = fabricCanvas.toSVG();
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const dataURL = URL.createObjectURL(blob);
      return { dataURL, ext: "svg" };
    }

    if (format === "webp") {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = template.width * scale;
      tempCanvas.height = template.height * scale;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");
      const pngURL = fabricCanvas.toDataURL({ format: "png", multiplier: scale });
      await new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
        img.src = pngURL;
      });
      return { dataURL: tempCanvas.toDataURL("image/webp", quality / 100), ext: "webp" };
    }

    return {
      dataURL: fabricCanvas.toDataURL({ format, quality: quality / 100, multiplier: scale }),
      ext: format === "jpeg" ? "jpg" : format,
    };
  }, [fabricCanvas, template, format, scale, quality]);

  const handleExport = useCallback(async () => {
    if (!fabricCanvas || !template) return;
    setLoading(true);
    try {
      const result = await buildDataURL();
      if (!result) return;

      const link = document.createElement("a");
      link.download = `thumbnail-${template.id}-${format === "svg" ? "" : scale + "x."}${result.ext}`;
      link.href = result.dataURL;
      link.click();

      if (format === "svg") {
        URL.revokeObjectURL(result.dataURL);
        toast.success("Exportado como SVG vetorial");
      } else {
        toast.success(`Exportado: ${template.width * scale}×${template.height * scale}px em ${format.toUpperCase()}`);
      }
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao exportar");
    } finally {
      setLoading(false);
    }
  }, [fabricCanvas, template, format, scale, buildDataURL, onClose]);

  const handleExportAll = useCallback(async () => {
    if (!fabricCanvas || !template || pages.length <= 1) return;
    setExportingAll(true);

    try {
      // Save current page state first
      const currentJSON = JSON.stringify(fabricCanvas.toJSON());
      const currentThumb = fabricCanvas.toDataURL({ format: "jpeg", quality: 0.3, multiplier: 0.15 });
      savePageState(currentPageIndex, currentJSON, currentThumb);

      const allPages = [...pages];
      allPages[currentPageIndex] = { ...allPages[currentPageIndex], fabricJSON: currentJSON };

      for (let i = 0; i < allPages.length; i++) {
        const page = allPages[i];

        if (i !== currentPageIndex && page.fabricJSON) {
          await new Promise<void>((resolve) => {
            fabricCanvas.loadFromJSON(page.fabricJSON, () => {
              fabricCanvas.requestRenderAll();
              resolve();
            });
          });
        }

        const dataURL = fabricCanvas.toDataURL({ format: format === "svg" ? "png" : format, quality: quality / 100, multiplier: scale });
        const link = document.createElement("a");
        link.download = `${template.id}-pagina-${i + 1}.${format === "jpeg" ? "jpg" : format}`;
        link.href = dataURL;
        link.click();
        await new Promise((r) => setTimeout(r, 200));
      }

      // Restore current page
      if (pages[currentPageIndex].fabricJSON) {
        await new Promise<void>((resolve) => {
          fabricCanvas.loadFromJSON(pages[currentPageIndex].fabricJSON, () => {
            fabricCanvas.requestRenderAll();
            resolve();
          });
        });
      }

      toast.success(`${allPages.length} páginas exportadas`);
      onClose();
    } catch {
      toast.error("Erro ao exportar páginas");
    } finally {
      setExportingAll(false);
    }
  }, [fabricCanvas, template, pages, currentPageIndex, format, scale, quality, savePageState, onClose]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!fabricCanvas || !template) return;
    setCopying(true);
    try {
      const pngURL = fabricCanvas.toDataURL({ format: "png", multiplier: 1 });
      const res = await fetch(pngURL);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Imagem copiada para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar. Tente exportar como PNG.");
    } finally {
      setCopying(false);
    }
  }, [fabricCanvas, template]);

  if (!open) return null;

  const w = template ? template.width * scale : 0;
  const h = template ? template.height * scale : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-80 p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Exportar Imagem</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Formato</span>
          <div className="grid grid-cols-4 gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs transition-colors ${
                  format === f.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <span className="font-bold">{f.label}</span>
                <span className="text-[9px] text-center leading-tight opacity-70">{f.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolução</span>
          <div className="grid grid-cols-3 gap-1.5">
            {SCALES.map((s) => (
              <button
                key={s.value}
                onClick={() => setScale(s.value)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border text-xs transition-colors ${
                  scale === s.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                <span className="font-bold">{s.label}</span>
                <span className="text-[9px] opacity-70">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quality (only for jpeg/webp) */}
        {format !== "png" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Qualidade</span>
              <span className="text-xs tabular-nums text-foreground">{quality}%</span>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              step={5}
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg bg-muted/30 border border-border px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>Dimensões finais</span>
          <span className="font-mono text-foreground">{w} × {h} px</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={loading || exportingAll} className="flex-1 gap-2">
            {format === "svg" ? <FileCode className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {loading ? "Exportando..." : `Exportar ${format.toUpperCase()}`}
          </Button>
          {format !== "svg" && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyToClipboard}
              disabled={copying || exportingAll}
              title="Copiar para área de transferência"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Export all pages */}
        {pages.length > 1 && format !== "svg" && (
          <Button
            variant="outline"
            onClick={handleExportAll}
            disabled={loading || exportingAll}
            className="w-full gap-2 text-xs"
          >
            <Images className="w-3.5 h-3.5" />
            {exportingAll ? "Exportando páginas..." : `Exportar todas as ${pages.length} páginas`}
          </Button>
        )}
      </div>
    </div>
  );
}
