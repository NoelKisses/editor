"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CanvasExportPresetsPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type ExportFormat = "png" | "jpeg" | "webp";

interface ExportPreset {
  id: string;
  label: string;
  width: number | null;
  height: number | null;
  format: ExportFormat;
  quality: number;
  multiplier: number;
  keepSize?: boolean;
}

const PRESETS: ExportPreset[] = [
  {
    id: "youtube",
    label: "YouTube Thumb",
    width: 1280,
    height: 720,
    format: "jpeg",
    quality: 0.9,
    multiplier: 1,
  },
  {
    id: "instagram-post",
    label: "Instagram Post",
    width: 1080,
    height: 1080,
    format: "png",
    quality: 1,
    multiplier: 1,
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    width: 1080,
    height: 1920,
    format: "png",
    quality: 1,
    multiplier: 1,
  },
  {
    id: "tiktok",
    label: "TikTok",
    width: 1080,
    height: 1920,
    format: "png",
    quality: 1,
    multiplier: 1,
  },
  {
    id: "twitter",
    label: "Twitter",
    width: 1200,
    height: 675,
    format: "jpeg",
    quality: 0.85,
    multiplier: 1,
  },
  {
    id: "facebook",
    label: "Facebook",
    width: 1200,
    height: 630,
    format: "jpeg",
    quality: 0.85,
    multiplier: 1,
  },
  {
    id: "web-optimized",
    label: "Web Optimized",
    width: null,
    height: null,
    format: "jpeg",
    quality: 0.8,
    multiplier: 1,
    keepSize: true,
  },
  {
    id: "print-hd",
    label: "Print HD",
    width: null,
    height: null,
    format: "png",
    quality: 1,
    multiplier: 2,
    keepSize: true,
  },
  {
    id: "web-light",
    label: "Web Light",
    width: null,
    height: null,
    format: "jpeg",
    quality: 0.6,
    multiplier: 1,
    keepSize: true,
  },
];

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function formatExtension(format: string): string {
  if (format === "jpeg") return "jpg";
  if (format === "webp") return "webp";
  return "png";
}

function formatMime(format: string): string {
  if (format === "jpeg") return "image/jpeg";
  if (format === "webp") return "image/webp";
  return "image/png";
}

export function CanvasExportPresetsPanel({
  fabricCanvas,
}: CanvasExportPresetsPanelProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canvasRef = useRef<any>(null);
  const [format, setFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState<number>(0.9);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [filename, setFilename] = useState<string>("thumbnail");
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(
    null
  );

  useEffect(() => {
    canvasRef.current = fabricCanvas;
    if (fabricCanvas) {
      const w =
        typeof fabricCanvas.getWidth === "function"
          ? fabricCanvas.getWidth()
          : fabricCanvas.width ?? 0;
      const h =
        typeof fabricCanvas.getHeight === "function"
          ? fabricCanvas.getHeight()
          : fabricCanvas.height ?? 0;
      queueMicrotask(() => setDimensions({ w, h }));
    } else {
      queueMicrotask(() => setDimensions(null));
    }
  }, [fabricCanvas]);

  const performExport = async (
    fmt: ExportFormat,
    q: number,
    mult: number,
    targetWidth: number | null,
    targetHeight: number | null
  ): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return null;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = {
        format: fmt,
        quality: q,
        multiplier: mult,
      };
      if (targetWidth && targetHeight) {
        const curW =
          typeof canvas.getWidth === "function"
            ? canvas.getWidth()
            : canvas.width;
        const curH =
          typeof canvas.getHeight === "function"
            ? canvas.getHeight()
            : canvas.height;
        if (curW && curH) {
          const scale = Math.min(targetWidth / curW, targetHeight / curH);
          opts.multiplier = scale * mult;
        }
      }
      const dataUrl: string = canvas.toDataURL(opts);
      const ext = formatExtension(fmt);
      triggerDownload(dataUrl, `${filename || "thumbnail"}.${ext}`);
      toast.success("Exportação concluída");
      return dataUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Falha na exportação: ${message}`);
      return null;
    }
  };

  const handlePreset = (preset: ExportPreset) => {
    queueMicrotask(() => {
      setFormat(preset.format);
      setQuality(preset.quality);
      setMultiplier(preset.multiplier);
    });
    void performExport(
      preset.format,
      preset.quality,
      preset.multiplier,
      preset.keepSize ? null : preset.width,
      preset.keepSize ? null : preset.height
    );
  };

  const handleCustomExport = () => {
    void performExport(format, quality, multiplier, null, null);
  };

  const handleCopyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("Canvas indisponível");
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = {
        format,
        quality,
        multiplier,
      };
      const dataUrl: string = canvas.toDataURL(opts);
      const blob = await dataUrlToBlob(dataUrl);
      const mime = formatMime(format);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ClipboardItemCtor: any = (window as any).ClipboardItem;
      if (!ClipboardItemCtor || !navigator.clipboard?.write) {
        toast.error("Clipboard API indisponível");
        return;
      }
      await navigator.clipboard.write([
        new ClipboardItemCtor({ [mime]: blob }),
      ]);
      toast.success("Imagem copiada para o clipboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Falha ao copiar: ${message}`);
    }
  };

  const showQuality = format === "jpeg" || format === "webp";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span className="text-sm font-semibold">Presets de Exportação</span>
        </div>
        {dimensions && (
          <Badge variant="secondary">
            {dimensions.w} x {dimensions.h}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset)}
            className="flex h-auto flex-col items-start gap-1 px-2 py-2 text-left"
          >
            <span className="text-xs font-medium">{preset.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {preset.keepSize
                ? `atual${preset.multiplier !== 1 ? ` x${preset.multiplier}` : ""}`
                : `${preset.width}x${preset.height}`}
              {" "}
              {formatExtension(preset.format).toUpperCase()}
            </span>
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 border-t pt-4">
        <span className="text-sm font-semibold">Exportação Customizada</span>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Nome do arquivo</span>
          <Input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="thumbnail"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Formato</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        {showQuality && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Qualidade</span>
              <span className="text-xs font-medium">
                {quality.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Multiplicador</span>
            <span className="text-xs font-medium">{multiplier.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.5}
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCustomExport} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleCopyToClipboard()}
            className="flex-1"
          >
            Copiar para Clipboard
          </Button>
        </div>
      </div>
    </div>
  );
}
