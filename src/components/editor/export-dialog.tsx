"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Image as ImageIcon } from "lucide-react";
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
] as const;

const SCALES = [
  { value: 1, label: "1x", desc: "Tamanho original" },
  { value: 2, label: "2x", desc: "Alta resolução (recomendado)" },
  { value: 3, label: "3x", desc: "Máxima resolução" },
];

export function ExportDialog({ open, onClose, fabricCanvas }: ExportDialogProps) {
  const { template } = useEditorStore();
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [scale, setScale] = useState(2);
  const [quality, setQuality] = useState(95);
  const [loading, setLoading] = useState(false);

  const handleExport = useCallback(async () => {
    if (!fabricCanvas || !template) return;
    setLoading(true);

    try {
      let dataURL: string;

      if (format === "webp") {
        // Fabric não suporta webp diretamente — usar canvas nativo
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = template.width * scale;
        tempCanvas.height = template.height * scale;
        const ctx = tempCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context unavailable");

        const pngURL = fabricCanvas.toDataURL({ format: "png", multiplier: scale });
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.src = pngURL;
        });
        dataURL = tempCanvas.toDataURL("image/webp", quality / 100);
      } else {
        dataURL = fabricCanvas.toDataURL({
          format,
          quality: quality / 100,
          multiplier: scale,
        });
      }

      const ext = format === "jpeg" ? "jpg" : format;
      const link = document.createElement("a");
      link.download = `thumbnail-${template.id}-${scale}x.${ext}`;
      link.href = dataURL;
      link.click();

      const w = template.width * scale;
      const h = template.height * scale;
      toast.success(`Exportado: ${w}×${h}px em ${format.toUpperCase()}`);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao exportar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [fabricCanvas, template, format, scale, quality, onClose]);

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
          <div className="grid grid-cols-3 gap-1.5">
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
        <Button onClick={handleExport} disabled={loading} className="w-full gap-2">
          <Download className="w-4 h-4" />
          {loading ? "Exportando..." : `Exportar ${format.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );
}
