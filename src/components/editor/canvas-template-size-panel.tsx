"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutTemplate, Check, Smartphone, Monitor, Square, Play, Image } from "lucide-react";
import { toast } from "sonner";
import { useEditorStore } from "@/store/editor-store";

interface CanvasTemplateSizePanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricCanvas: any;
}

type TemplateCategory = "social" | "video" | "print" | "custom";

interface SizePreset {
  label: string;
  sublabel: string;
  width: number;
  height: number;
  category: TemplateCategory;
  icon: React.ElementType;
}

const PRESETS: SizePreset[] = [
  { label: "YouTube Thumbnail", sublabel: "1280 × 720", width: 1280, height: 720, category: "video", icon: Play },
  { label: "YouTube Banner", sublabel: "2560 × 1440", width: 2560, height: 1440, category: "video", icon: Play },
  { label: "Instagram Post", sublabel: "1080 × 1080", width: 1080, height: 1080, category: "social", icon: Square },
  { label: "Instagram Story", sublabel: "1080 × 1920", width: 1080, height: 1920, category: "social", icon: Smartphone },
  { label: "Instagram Landscape", sublabel: "1080 × 566", width: 1080, height: 566, category: "social", icon: Image },
  { label: "Facebook Post", sublabel: "1200 × 630", width: 1200, height: 630, category: "social", icon: Monitor },
  { label: "Facebook Story", sublabel: "1080 × 1920", width: 1080, height: 1920, category: "social", icon: Smartphone },
  { label: "Twitter/X Post", sublabel: "1600 × 900", width: 1600, height: 900, category: "social", icon: Monitor },
  { label: "LinkedIn Post", sublabel: "1200 × 627", width: 1200, height: 627, category: "social", icon: Monitor },
  { label: "TikTok Vídeo", sublabel: "1080 × 1920", width: 1080, height: 1920, category: "video", icon: Smartphone },
  { label: "Pinterest Pin", sublabel: "1000 × 1500", width: 1000, height: 1500, category: "social", icon: Smartphone },
  { label: "Apresentação 16:9", sublabel: "1920 × 1080", width: 1920, height: 1080, category: "print", icon: Monitor },
  { label: "Apresentação 4:3", sublabel: "1024 × 768", width: 1024, height: 768, category: "print", icon: Monitor },
  { label: "Cartão A4", sublabel: "2480 × 3508", width: 2480, height: 3508, category: "print", icon: Square },
];

const CATEGORIES: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "social", label: "Social" },
  { value: "video", label: "Vídeo" },
  { value: "print", label: "Impressão" },
];

export function CanvasTemplateSizePanel({ fabricCanvas }: CanvasTemplateSizePanelProps) {
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [customW, setCustomW] = useState(1280);
  const [customH, setCustomH] = useState(720);
  const [currentW, setCurrentW] = useState(0);
  const [currentH, setCurrentH] = useState(0);
  const { template } = useEditorStore();

  useEffect(() => {
    if (!fabricCanvas) return;
    queueMicrotask(() => {
      setCurrentW(fabricCanvas.width ?? 0);
      setCurrentH(fabricCanvas.height ?? 0);
    });
  }, [fabricCanvas]);

  const applySize = useCallback((width: number, height: number, label: string) => {
    if (!fabricCanvas) { toast.error("Canvas não disponível"); return; }
    const scaleX = width / (fabricCanvas.width ?? 1);
    const scaleY = height / (fabricCanvas.height ?? 1);
    // Scale all objects proportionally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fabricCanvas.getObjects().forEach((obj: any) => {
      obj.set({
        left: (obj.left ?? 0) * scaleX,
        top: (obj.top ?? 0) * scaleY,
        scaleX: (obj.scaleX ?? 1) * scaleX,
        scaleY: (obj.scaleY ?? 1) * scaleY,
      });
      obj.setCoords();
    });
    fabricCanvas.setWidth(width);
    fabricCanvas.setHeight(height);
    fabricCanvas.requestRenderAll();
    setCurrentW(width);
    setCurrentH(height);
    toast.success(`Canvas redimensionado: ${label}`);
  }, [fabricCanvas]);

  const applyCustom = useCallback(() => {
    if (customW < 1 || customH < 1) { toast.error("Dimensões inválidas"); return; }
    applySize(customW, customH, `${customW}×${customH}px`);
  }, [customW, customH, applySize]);

  const filtered = category === "all" ? PRESETS : PRESETS.filter(p => p.category === category);
  const isActive = (p: SizePreset) => p.width === currentW && p.height === currentH;

  return (
    <div className="flex flex-col gap-4 p-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Tamanho do Canvas</span>
      </div>

      {currentW > 0 && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded border border-border bg-muted/20">
          <span className="text-[9px] text-muted-foreground">Atual:</span>
          <span className="text-[9px] font-medium tabular-nums">{currentW} × {currentH}px</span>
        </div>
      )}

      {!template && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <LayoutTemplate className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-[11px] text-muted-foreground">Selecione um template para começar</p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Categoria</span>
        <div className="grid grid-cols-4 gap-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`py-1.5 rounded border text-[8px] font-medium transition-colors ${category === c.value ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Presets list */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Predefinições</span>
        <div className="flex flex-col gap-1">
          {filtered.map(preset => {
            const Icon = preset.icon;
            const active = isActive(preset);
            return (
              <button
                key={`${preset.width}x${preset.height}-${preset.label}`}
                onClick={() => applySize(preset.width, preset.height, preset.label)}
                className={`flex items-center gap-2 px-2 py-2 rounded border text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-medium truncate ${active ? "text-primary" : "text-foreground"}`}>{preset.label}</p>
                  <p className="text-[8px] text-muted-foreground">{preset.sublabel}</p>
                </div>
                {active && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom size */}
      <div className="flex flex-col gap-2 p-2 rounded border border-border bg-muted/10">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tamanho personalizado</span>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] text-muted-foreground">Largura (px)</span>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              value={customW}
              onChange={e => setCustomW(Number(e.target.value))}
              className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary text-center"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] text-muted-foreground">Altura (px)</span>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              value={customH}
              onChange={e => setCustomH(Number(e.target.value))}
              className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-[9px] focus:outline-none focus:border-primary text-center"
            />
          </div>
        </div>
        <button
          onClick={applyCustom}
          className="flex items-center justify-center gap-1.5 py-2 rounded border border-primary text-primary text-[10px] font-medium hover:bg-primary/10 transition-colors"
        >
          <Check className="w-3 h-3" /> Aplicar tamanho
        </button>
      </div>

      <p className="text-[8px] text-muted-foreground/50 text-center">
        Objetos serão redimensionados proporcionalmente
      </p>
    </div>
  );
}
