"use client";

import { useCallback, useRef, useState } from "react";
import { Share2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CanvasExportSocialPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

interface SocialFormat {
  id: string;
  label: string;
  platform: string;
  width: number;
  height: number;
  description: string;
}

const SOCIAL_FORMATS: SocialFormat[] = [
  // Instagram
  { id: "ig-post", label: "Post Quadrado", platform: "Instagram", width: 1080, height: 1080, description: "Feed 1:1" },
  { id: "ig-portrait", label: "Post Retrato", platform: "Instagram", width: 1080, height: 1350, description: "Feed 4:5" },
  { id: "ig-story", label: "Stories/Reels", platform: "Instagram", width: 1080, height: 1920, description: "Vertical 9:16" },
  { id: "ig-banner", label: "IGTV Cover", platform: "Instagram", width: 420, height: 654, description: "IGTV" },
  // YouTube
  { id: "yt-thumb", label: "Thumbnail", platform: "YouTube", width: 1280, height: 720, description: "16:9" },
  { id: "yt-banner", label: "Channel Art", platform: "YouTube", width: 2560, height: 1440, description: "Banner" },
  // Facebook
  { id: "fb-post", label: "Post", platform: "Facebook", width: 1200, height: 630, description: "Feed" },
  { id: "fb-cover", label: "Capa", platform: "Facebook", width: 820, height: 312, description: "Cover" },
  { id: "fb-story", label: "Stories", platform: "Facebook", width: 1080, height: 1920, description: "9:16" },
  // Twitter/X
  { id: "tw-post", label: "Post com Imagem", platform: "Twitter/X", width: 1200, height: 675, description: "16:9" },
  { id: "tw-banner", label: "Header", platform: "Twitter/X", width: 1500, height: 500, description: "Banner" },
  // LinkedIn
  { id: "li-post", label: "Post", platform: "LinkedIn", width: 1200, height: 627, description: "Feed" },
  { id: "li-cover", label: "Capa Perfil", platform: "LinkedIn", width: 1584, height: 396, description: "Banner" },
  // Pinterest
  { id: "pin-pin", label: "Pin", platform: "Pinterest", width: 1000, height: 1500, description: "2:3" },
  { id: "pin-wide", label: "Pin Largo", platform: "Pinterest", width: 1000, height: 2100, description: "Tall" },
  // TikTok
  { id: "tt-cover", label: "Capa Vídeo", platform: "TikTok", width: 1080, height: 1920, description: "9:16" },
  // WhatsApp
  { id: "wa-status", label: "Status", platform: "WhatsApp", width: 1080, height: 1920, description: "9:16" },
];

const PLATFORMS = [...new Set(SOCIAL_FORMATS.map((f) => f.platform))];

function getPlatformColor(platform: string): string {
  const map: Record<string, string> = {
    Instagram: "#e1306c",
    YouTube: "#ff0000",
    "Facebook": "#1877f2",
    "Twitter/X": "#000000",
    LinkedIn: "#0077b5",
    Pinterest: "#e60023",
    TikTok: "#010101",
    WhatsApp: "#25d366",
  };
  return map[platform] ?? "#6366f1";
}

export function CanvasExportSocialPanel({ fabricCanvas }: CanvasExportSocialPanelProps) {
  const [platform, setPlatform] = useState<string>("YouTube");
  const [quality, setQuality] = useState(0.92);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [exporting, setExporting] = useState<string | null>(null);
  const canvasRef = useRef<unknown>(null);

  const exportFormat = useCallback((sf: SocialFormat) => {
    const cv = fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }

    setExporting(sf.id);

    try {
      const originalWidth = cv.getWidth();
      const originalHeight = cv.getHeight();

      const scaleX = sf.width / originalWidth;
      const scaleY = sf.height / originalHeight;

      const dataURL: string = cv.toDataURL({
        format,
        quality,
        multiplier: Math.max(scaleX, scaleY),
      });

      const link = document.createElement("a");
      link.download = `${sf.platform.toLowerCase().replace(/\//g, "-")}-${sf.id}-${sf.width}x${sf.height}.${format}`;
      link.href = dataURL;
      link.click();

      toast.success(`Exportado: ${sf.label} (${sf.width}×${sf.height})`);
    } catch {
      toast.error("Erro ao exportar — tente reduzir a qualidade");
    } finally {
      setExporting(null);
    }
  }, [fabricCanvas, format, quality]);

  const exportAll = useCallback(() => {
    const cv = fabricCanvas;
    if (!cv) { toast.error("Canvas não disponível"); return; }
    const filtered = SOCIAL_FORMATS.filter((f) => f.platform === platform);
    let delay = 0;
    filtered.forEach((sf) => {
      setTimeout(() => exportFormat(sf), delay);
      delay += 300;
    });
  }, [fabricCanvas, platform, exportFormat]);

  const filtered = SOCIAL_FORMATS.filter((f) => f.platform === platform);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Exportar para Redes Sociais</span>
      </div>

      {/* Platform selector */}
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-muted-foreground">Plataforma</span>
        <div className="flex gap-1 flex-wrap">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-2 py-0.5 rounded border text-[7px] transition-colors ${
                platform === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}
              style={platform === p ? { borderColor: getPlatformColor(p), color: getPlatformColor(p) } : {}}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Format options */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Formato</span>
          <div className="flex gap-1">
            {(["png", "jpeg"] as const).map((f) => (
              <button key={f} onClick={() => setFormat(f)}
                className={`flex-1 py-0.5 rounded border text-[7px] uppercase transition-colors ${
                  format === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-muted-foreground">Qualidade {Math.round(quality * 100)}%</span>
          <input type="range" min={0.5} max={1} step={0.05} value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full h-1 accent-primary mt-1.5" />
        </div>
      </div>

      {/* Format list */}
      <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
        {filtered.map((sf) => (
          <div key={sf.id}
            className="flex items-center gap-2 p-1.5 rounded border border-border hover:border-primary/30 transition-colors group">
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-medium block">{sf.label}</span>
              <span className="text-[7px] text-muted-foreground">{sf.width}×{sf.height} · {sf.description}</span>
            </div>
            <button
              onClick={() => exportFormat(sf)}
              disabled={exporting === sf.id || !fabricCanvas}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all text-muted-foreground disabled:opacity-40"
            >
              {exporting === sf.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Download className="w-3 h-3" />
              }
            </button>
          </div>
        ))}
      </div>

      {/* Export all */}
      <button
        onClick={exportAll}
        disabled={!fabricCanvas}
        className="flex items-center justify-center gap-1 py-2 rounded border border-primary text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors disabled:opacity-40"
      >
        <Download className="w-3 h-3" />
        Exportar todos de {platform} ({filtered.length})
      </button>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Exportação usa a proporção do canvas atual · re-escalada para cada formato
      </p>
    </div>
  );
}
